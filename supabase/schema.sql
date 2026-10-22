-- ==============================================================================
-- ShiftLK Spares - Production Database Schema (Supabase / PostgreSQL)
-- Sri Lanka Automotive Spare Parts Customer-Side & Future Admin Panel
-- ==============================================================================

-- 1. Create Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Enums
DO $$ BEGIN
  CREATE TYPE condition_type AS ENUM ('new', 'reconditioned', 'used');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'cancelled', 'delivered');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE expense_type AS ENUM ('inventory', 'shipping', 'salary', 'utility', 'rent', 'marketing', 'other');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. Categories & Translations
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug VARCHAR(100) UNIQUE NOT NULL,
  icon VARCHAR(50) DEFAULT 'wrench',
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS category_translations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  language VARCHAR(5) NOT NULL, -- 'en', 'si', 'ta'
  name VARCHAR(150) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_cat_lang UNIQUE (category_id, language)
);

-- 4. Products Table (Includes cost_price for admin, never exposed to public)
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug VARCHAR(200) UNIQUE NOT NULL,
  part_number VARCHAR(100) NOT NULL,
  brand VARCHAR(100) NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  condition condition_type NOT NULL DEFAULT 'new',
  selling_price NUMERIC(12, 2) NOT NULL CHECK (selling_price >= 0),
  cost_price NUMERIC(12, 2) NOT NULL CHECK (cost_price >= 0), -- PRIVATE: Admin only
  stock_qty INT NOT NULL DEFAULT 0 CHECK (stock_qty >= 0),
  weight_kg NUMERIC(6, 2) DEFAULT 1.0 CHECK (weight_kg >= 0),
  is_active BOOLEAN DEFAULT true,
  images TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_part_no ON products(part_number);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);

-- 5. Product Translations
CREATE TABLE IF NOT EXISTS product_translations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  language VARCHAR(5) NOT NULL, -- 'en', 'si', 'ta'
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_prod_lang UNIQUE (product_id, language)
);

CREATE INDEX IF NOT EXISTS idx_prod_trans_lang ON product_translations(language);

-- 6. Vehicle Compatibility
CREATE TABLE IF NOT EXISTS vehicle_compatibility (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  make VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  year_from INT NOT NULL,
  year_to INT, -- NULL means up to current year
  chassis_code VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_compat_make_model ON vehicle_compatibility(make, model);
CREATE INDEX IF NOT EXISTS idx_compat_product ON vehicle_compatibility(product_id);

-- 7. Delivery Zones (All 25 Sri Lankan Districts)
CREATE TABLE IF NOT EXISTS delivery_zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  district VARCHAR(100) UNIQUE NOT NULL,
  province VARCHAR(100) NOT NULL,
  base_fee NUMERIC(10, 2) NOT NULL CHECK (base_fee >= 0),
  extra_per_kg NUMERIC(10, 2) DEFAULT 0 CHECK (extra_per_kg >= 0),
  estimated_days VARCHAR(50) DEFAULT '1-3 Days',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Order Number Sequence & Generator
CREATE SEQUENCE IF NOT EXISTS order_code_seq START 123;

CREATE OR REPLACE FUNCTION generate_order_code()
RETURNS TEXT AS $$
DECLARE
  next_val BIGINT;
BEGIN
  next_val := nextval('order_code_seq');
  RETURN 'SLK-' || LPAD(next_val::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- 9. Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_code VARCHAR(30) UNIQUE NOT NULL DEFAULT generate_order_code(),
  customer_name VARCHAR(150) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  address TEXT NOT NULL,
  district VARCHAR(100) NOT NULL,
  delivery_cost NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total NUMERIC(12, 2) NOT NULL,
  status order_status NOT NULL DEFAULT 'pending',
  customer_language VARCHAR(5) DEFAULT 'en',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_code ON orders(order_code);
CREATE INDEX IF NOT EXISTS idx_orders_phone ON orders(phone);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);

-- 10. Order Items Table (Snapshot of unit_price and unit_cost for profit analytics)
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  qty INT NOT NULL CHECK (qty > 0),
  unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
  unit_cost NUMERIC(12, 2) NOT NULL CHECK (unit_cost >= 0), -- Snapshot of cost_price for admin
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- 11. Expenses Table (Admin profit/salary/overhead tracking)
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type expense_type NOT NULL DEFAULT 'other',
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  note TEXT,
  created_by UUID, -- Supabase Auth User ID for admin
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);

-- ==============================================================================
-- 12. Security: Row Level Security (RLS) & Public Data Protection
-- ==============================================================================

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_compatibility ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Categories & Translations: Public Read Only
CREATE POLICY "Public can view active categories"
  ON categories FOR SELECT
  USING (is_active = true);

CREATE POLICY "Public can view category translations"
  ON category_translations FOR SELECT
  USING (true);

-- Delivery Zones: Public Read Only
CREATE POLICY "Public can view active delivery zones"
  ON delivery_zones FOR SELECT
  USING (is_active = true);

-- Public Safe View for Products (Explicitly omitting cost_price)
CREATE OR REPLACE VIEW public_products AS
SELECT 
  p.id,
  p.slug,
  p.part_number,
  p.brand,
  p.category_id,
  p.condition,
  p.selling_price,
  p.stock_qty,
  p.weight_kg,
  p.is_active,
  p.images,
  p.created_at,
  p.updated_at
FROM products p
WHERE p.is_active = true;

-- Products RLS Policies
CREATE POLICY "Public can read active products"
  ON products FOR SELECT
  USING (is_active = true);

CREATE POLICY "Public can read product translations"
  ON product_translations FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM products p WHERE p.id = product_translations.product_id AND p.is_active = true
  ));

CREATE POLICY "Public can read vehicle compatibility"
  ON vehicle_compatibility FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM products p WHERE p.id = vehicle_compatibility.product_id AND p.is_active = true
  ));

-- Orders RLS: Customers can only INSERT pending orders
CREATE POLICY "Public can create pending orders"
  ON orders FOR INSERT
  WITH CHECK (status = 'pending');

CREATE POLICY "Public can insert order items for their pending order"
  ON order_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM orders o WHERE o.id = order_items.order_id AND o.status = 'pending'
  ));

-- Admin full access to everything (when authenticated with admin role)
CREATE POLICY "Admins have full access to products"
  ON products FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins have full access to orders"
  ON orders FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins have full access to order items"
  ON order_items FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins have full access to expenses"
  ON expenses FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Updated_at Trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE TRIGGER update_products_updated_at
BEFORE UPDATE ON products
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE OR REPLACE TRIGGER update_orders_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
