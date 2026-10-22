export type ConditionType = 'new' | 'reconditioned' | 'used';
export type OrderStatus = 'pending' | 'confirmed' | 'cancelled' | 'delivered';
export type ExpenseType = 'inventory' | 'shipping' | 'salary' | 'utility' | 'rent' | 'marketing' | 'other';
export type AppLocale = 'en' | 'si' | 'ta';

export interface Category {
  id: string;
  slug: string;
  icon: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

export interface CategoryTranslation {
  id: string;
  category_id: string;
  language: AppLocale;
  name: string;
  description: string;
}

export interface Product {
  id: string;
  slug: string;
  part_number: string;
  brand: string;
  category_id: string;
  condition: ConditionType;
  selling_price: number;
  cost_price?: number; // Kept private, excluded from public queries
  stock_qty: number;
  weight_kg: number;
  is_active: boolean;
  images: string[];
  created_at: string;
  updated_at: string;
}

export interface ProductTranslation {
  id: string;
  product_id: string;
  language: AppLocale;
  name: string;
  description: string;
}

export interface VehicleCompatibility {
  id: string;
  product_id: string;
  make: string;
  model: string;
  year_from: number;
  year_to?: number | null;
  chassis_code?: string;
}

export interface DeliveryZone {
  id: string;
  district: string;
  province: string;
  base_fee: number;
  extra_per_kg: number;
  estimated_days: string;
  is_active: boolean;
}

export interface Order {
  id: string;
  order_code: string;
  customer_name: string;
  phone: string;
  address: string;
  district: string;
  delivery_cost: number;
  total: number;
  status: OrderStatus;
  customer_language: AppLocale;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  qty: number;
  unit_price: number;
  unit_cost: number;
}

export interface Expense {
  id: string;
  type: ExpenseType;
  amount: number;
  date: string;
  note?: string;
  created_by?: string;
}

// Localized product view for customer-side consumption
export interface LocalizedProduct {
  id: string;
  slug: string;
  part_number: string;
  brand: string;
  category_id: string;
  category_slug?: string;
  category_name: string;
  condition: ConditionType;
  selling_price: number;
  stock_qty: number;
  weight_kg: number;
  is_active: boolean;
  images: string[];
  name: string;
  description: string;
  compatibility: VehicleCompatibility[];
  translations: Record<AppLocale, { name: string; description: string }>;
}
