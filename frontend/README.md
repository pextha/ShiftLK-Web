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

5. **Separate Backend API (`shiftLK-api` — MySQL + Prisma)**
   - All database and business logic lives in the standalone `../shiftLK-api` project; this frontend holds no DB code or secrets.
   - Schema, migrations and seed data live in `shiftLK-api/prisma/`.
   - Admin-ready data model:
     - `cost_price` column in `products` (never returned by public API endpoints — enforced by public DTO serializers).
     - `unit_cost` snapshot in `order_items` for historical profit tracking.
     - `expenses` table for admin operational expenses, salaries, shipping, and utility tracking.
   - Until the frontend is wired to the API (Phase 4), the site runs on the built-in seed data in `src/lib/db/seed-data.ts`.

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
│   │   │   └── seed-data.ts        # 12 sample spare parts, categories, 25 districts (dev fallback)
│   │   └── utils/
│   │       ├── currency.ts         # Sri Lankan Rupee (LKR / රු. / ரூ.) formatter
│   │       ├── phone-validator.ts  # Sri Lankan phone format validator (07X / +94)
│   │       └── whatsapp.ts         # Multilingual WhatsApp order message generator
│   ├── middleware.ts               # Locale routing proxy middleware
│   └── services/
│       ├── productService.ts       # Product retrieval and filtering logic
│       ├── deliveryService.ts      # District delivery fee calculation
│       └── orderService.ts         # Order creation & code generation (SLK-000124)
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

Edit `.env.local` to configure your site URL and WhatsApp number:
```env
# Public Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# WhatsApp Business Number (country code 94 without + or spaces)
NEXT_PUBLIC_WHATSAPP_NUMBER=94770871018
```

> The frontend has no database credentials. Phase 4 adds `NEXT_PUBLIC_API_URL` pointing at `shiftLK-api`.

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

## How Admin Panel Will Plug In

The admin panel talks to the `shiftLK-api` admin endpoints (`/api/v1/admin/**`):
- **Authentication**: JWT (httpOnly cookie + refresh token) with `admin` / `staff` roles, handled by `shiftLK-api`.
- **Data privacy**: Public endpoints only return active products through public serializers and never include `cost_price`. Admin endpoints have full access to `cost_price`, `stock_qty`, and the `expenses` table.
- **Stock Confirmation**: When the customer orders via WhatsApp, the order status is set to `pending` and stock is untouched. Clicking **"Confirm Order"** in the admin panel runs a single DB transaction that locks the product rows, checks stock, decrements `stock_qty`, and sets the status to `confirmed`.
- **Profit Analytics**: `order_items` stores both `unit_price` and `unit_cost` snapshots at order time, enabling automated gross profit reports: `Gross Profit = (unit_price - unit_cost) * qty`.
- **Expense Tracking**: The `expenses` table is pre-structured with categories (`inventory`, `shipping`, `salary`, `utility`, `rent`, `marketing`, `other`) for complete net profit reporting.
