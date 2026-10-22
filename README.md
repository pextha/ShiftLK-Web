# ShiftLK Spares (ශ්‍රී ලංකා Motorbike Spare Parts & Accessories Network)

A modern, mobile-first, high-performance customer-side e-commerce web application for **"ShiftLK Spares"**, a Sri Lankan online motorbike spare parts business operating out of Undurugoda, Polgasowita.

Specializing in **Indian Motorbike Spare Parts (Bajaj, Yamaha, TVS, Honda)**, **Custom Modification & Performance Parts**, **Body Stickers & Graphic Decals**, and **Helmets & Riding Gear**.

Instead of an online payment gateway, customer checkout is orchestrated through a streamlined **WhatsApp Direct Order Flow**. The customer selects parts, quantities, and their delivery district (across all 25 districts of Sri Lanka), enters their contact and delivery details, and the platform creates a pending order in the database and opens WhatsApp with a pre-filled, localized order summary.

---

## Key Features

1. **WhatsApp Direct Order Flow (No Payment Gateway)**
   - Calculates item totals + dynamic district delivery fees in real-time.
   - Captures customer name, Sri Lankan phone number (with strict validation for `07X XXXXXXX` and `+94`), street address, and optional vehicle/bike chassis notes.
   - Generates an order reference code (`SLK-000124`) and persists the order with `status = 'pending'`.
   - Opens `https://wa.me/[NUMBER]` with an itemized, beautifully formatted message in the customer's active language.
   - Stock is **NOT** automatically reduced at this point; reduction is reserved for the future admin panel upon order confirmation.

2. **Multilingual (English, Sinhala, Tamil)**
   - Always-visible language switcher in the sticky header (`EN`, `සිං`, `த`).
   - Powered by `next-intl` App Router routing.
   - Google Fonts: `Noto Sans Sinhala` (`--font-sinhala`) and `Noto Sans Tamil` (`--font-tamil`) ensure native rendering.
   - Product titles and descriptions are localized per language with graceful English fallback.
   - WhatsApp messages are dynamically constructed in the language currently chosen by the customer.

3. **District Delivery Cost Engine (All 25 Districts)**
   - Configurable `delivery_zones` database table seeded with all 25 Sri Lankan districts:
     - Western Province: Colombo (Rs. 350), Gampaha (Rs. 400), Kalutara (Rs. 450)
     - Central & Southern Provinces: Kandy (Rs. 500), Galle (Rs. 500), Matara (Rs. 500), Hambantota (Rs. 550)
     - Northern & Eastern: Jaffna (Rs. 650), Trincomalee (Rs. 600), Batticaloa (Rs. 600)
     - Outstation & Central Highlands: Kurunegala (Rs. 500), Anuradhapura (Rs. 550), Badulla (Rs. 600), etc.
   - Instant live calculation on the Product Detail page upon district selection.

4. **Product Catalog & Motorbike Fitment Search**
   - Sticky search bar with popular Sri Lankan motorbike shortcuts (e.g. `Bajaj Pulsar 150/180/NS`, `Yamaha FZ / FZ-S`, `Body Sticker Kits`, `Helmets & Visors`).
   - Multi-parameter filtering:
     - Search query (Part Name, Model, Brand)
     - Category (Indian Bike Spare Parts, Modification & Performance, Body Stickers & Decals, Helmets & Riding Gear)
     - Brand (Bajaj, Yamaha, TVS, Honda, etc.)
     - Condition (Brand New OEM, Reconditioned, Aftermarket)
     - Bike Make, Model, and Year range
     - Price range and In-Stock only filter
     - Sorting (Newest, Price: Low to High, Price: High to Low)

5. **Future-Proof Database Architecture (Supabase / PostgreSQL)**
   - Full SQL schema in `supabase/schema.sql` and seed migration in `supabase/seed.sql`.
   - Ready for admin panel integration without any schema rewrites:
     - `cost_price` column in `products` (strictly hidden from public customer API).
     - `unit_cost` snapshot in `order_items` for historical profit tracking.
     - `expenses` table for admin operational expenses, salaries, shipping, and utility tracking.
     - Row Level Security (RLS) policies preventing public exposure of private cost figures or administrative orders.

6. **SEO & Performance**
   - Server-rendered pages with metadata and Open Graph tags for rich WhatsApp and Facebook link previews.
   - Dynamic `sitemap.xml` and `robots.txt`.
   - Fast loading on Sri Lankan mobile networks with optimized Next.js image loading and minimal client-side JavaScript.

---

## Folder Structure

```text
shiftLK-web/
├── messages/                       # Localization dictionaries
│   ├── en.json                     # English strings
│   ├── si.json                     # Sinhala strings (සිංහල)
│   └── ta.json                     # Tamil strings (தமிழ்)
├── public/                         # Static assets and favicon
├── src/
│   ├── app/
│   │   ├── [locale]/
│   │   │   ├── layout.tsx          # Root layout with fonts, header, footer, WhatsApp float
│   │   │   ├── page.tsx            # Home page (Hero, Categories, Featured, Trust points)
│   │   │   ├── products/
│   │   │   │   ├── page.tsx        # Product Catalog (Search, Multi-Filter, Grid)
│   │   │   │   └── [slug]/
│   │   │   │       └── page.tsx    # Product Detail (Gallery, Fitment, Live Delivery Calculator)
│   │   │   ├── about/page.tsx      # Panchikawatte sourcing & company story
│   │   │   ├── delivery/page.tsx   # All 25 districts delivery rates table
│   │   │   ├── returns/page.tsx    # 7-day fitment warranty policy
│   │   │   └── contact/page.tsx    # Panchikawatte address, hotline, business hours
│   │   ├── api/
│   │   │   └── orders/route.ts     # Order submission endpoint & WhatsApp message builder
│   │   ├── sitemap.ts              # Dynamic sitemap for all localized routes & products
│   │   ├── robots.ts               # Robots.txt configuration
│   │   ├── not-found.tsx           # Global 404 page
│   │   └── globals.css             # Tailwind v4 theme, font stacks, and custom animations
│   ├── components/
│   │   ├── common/
│   │   │   └── FloatingWhatsApp.tsx# Persistent bottom-right WhatsApp hotline button
│   │   ├── header/
│   │   │   ├── Header.tsx          # Main navigation bar with Sri Lankan branding
│   │   │   ├── LanguageSwitcher.tsx# EN / සිං / த language switcher pill
│   │   │   └── StickySearchBar.tsx # Sticky search input with auto-suggestions
│   │   ├── footer/
│   │   │   └── Footer.tsx          # Social links, Panchikawatte store info, trust badges
│   │   └── products/
│   │       ├── ProductCard.tsx     # Responsive product card with condition and stock badges
│   │       ├── ProductFilterBar.tsx# Multi-filter controls and mobile filter drawer
│   │       ├── ProductGallery.tsx  # Multi-thumbnail image gallery
│   │       ├── LiveOrderSummary.tsx# District selector, quantity counter, and live cost engine
│   │       └── WhatsAppOrderModal.tsx # Customer details modal with Sri Lankan phone validation
│   ├── i18n/
│   │   ├── routing.ts              # next-intl route definitions
│   │   └── request.ts              # Server-side message resolver
│   ├── lib/
│   │   ├── db/
│   │   │   ├── schema.types.ts     # TypeScript database and entity types
│   │   │   ├── seed-data.ts        # 12 sample spare parts, 3 categories, 25 districts
│   │   │   └── supabase.ts         # Supabase client connector
│   │   └── utils/
│   │       ├── currency.ts         # Sri Lankan Rupee (LKR / රු. / ரூ.) formatter
│   │       ├── phone-validator.ts  # Sri Lankan phone format validator (07X / +94)
│   │       └── whatsapp.ts         # Multilingual WhatsApp order message generator
│   ├── middleware.ts               # Locale routing proxy middleware
│   └── services/
│       ├── productService.ts       # Product retrieval and filtering logic
│       ├── deliveryService.ts      # District delivery fee calculation
│       └── orderService.ts         # Order creation & code generation (SLK-000124)
├── supabase/
│   ├── schema.sql                  # PostgreSQL / Supabase table definitions and RLS policies
│   └── seed.sql                    # Initial seed data for products, categories, and districts
├── .env.example                    # Environment variable template
├── .env.local                      # Local development environment configuration
└── package.json
```

---

## Getting Started

### 1. Prerequisites
- Node.js `20.x` or higher
- npm or pnpm

### 2. Installation
```bash
git clone <repo-url>
cd shiftLK-web
npm install
```

### 3. Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Edit `.env.local` to configure your WhatsApp number and optional Supabase credentials:
```env
# Public Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# WhatsApp Business Number (country code 94 without + or spaces)
NEXT_PUBLIC_WHATSAPP_NUMBER=94770871018

# Optional: Supabase Database Configuration
# The application runs out of the box with the built-in seed database if left unconfigured.
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### 4. Running the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Production Build
```bash
npm run build
npm run start
```

---

## Supabase Database Setup (When connecting Supabase)

1. Create a new project in [Supabase](https://supabase.com).
2. Go to the **SQL Editor** in your Supabase dashboard.
3. Run the SQL script located at `supabase/schema.sql` to generate all tables, enums, triggers, and Row Level Security (RLS) policies.
4. Run the SQL script located at `supabase/seed.sql` to insert the 12 sample spare parts, 3 categories, and 25 districts.
5. Copy your **Project URL** and **Anon API Key** into `.env.local`.

---

## How Admin Panel Will Plug In

When you build the admin panel later:
- **Authentication**: Connect Supabase Auth (`authenticated` role).
- **Security & RLS**: The public customer side only reads active products and never receives `cost_price`. The admin panel using authenticated credentials or service role key has full read/write access to `cost_price`, `stock_qty`, and the `expenses` table.
- **Stock Confirmation**: When the customer orders via WhatsApp, the order status is set to `pending` and stock is untouched. In the admin panel, clicking **"Confirm Order"** updates the order status to `confirmed` and executes a decrement on `stock_qty`.
- **Profit Analytics**: `order_items` stores both `unit_price` and `unit_cost` snapshots at order time, enabling automated gross profit reports: `Gross Profit = (unit_price - unit_cost) * qty`.
- **Expense Tracking**: The `expenses` table is pre-structured with categories (`inventory`, `shipping`, `salary`, `utility`, `rent`, `marketing`, `other`) for complete net profit reporting.
