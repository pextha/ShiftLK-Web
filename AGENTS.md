# ShiftLK Motorbike Spares — AI Agent Guidelines (`AGENTS.md`)

This repository is an e-commerce and inventory management platform for **ShiftLK Spares** (Polgasowita, Sri Lanka), specializing in Indian motorbike spare parts (Bajaj, Yamaha, TVS, Honda), modification accessories, body decals, and helmets.

---

## 📁 Repository Architecture & Structure

This is a two-tier monorepo structured as follows:

```
shiftLK-web/
├── frontend/             # Unified Next.js 16 Web Application (Storefront + Admin)
│   ├── src/
│   │   ├── app/
│   │   │   ├── [locale]/ # Customer Storefront (Trilingual: en, si, ta)
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx
│   │   │   │   └── products/
│   │   │   │
│   │   │   └── admin/    # Store Operations & Admin Portal
│   │   │       ├── layout.tsx
│   │   │       ├── dashboard/
│   │   │       ├── orders/
│   │   │       ├── products/
│   │   │       ├── stock/
│   │   │       ├── expenses/
│   │   │       ├── reports/
│   │   │       ├── settings/
│   │   │       └── login/
│   │   ├── components/
│   │   │   ├── common/   # Shared components (FloatingWhatsApp, Toast, etc.)
│   │   │   ├── header/   # Storefront header & language switcher
│   │   │   ├── footer/   # Storefront footer
│   │   │   ├── products/ # Product cards, filter bar, WhatsApp modal
│   │   │   ├── admin/    # Admin UI shells, sidebars, tables
│   │   │   └── ui/       # Primitives (button, card, dialog, badge, table)
│   │   ├── lib/
│   │   │   ├── api/      # Storefront public API client
│   │   │   ├── db/       # Seed data & fallback database schema
│   │   │   ├── utils/    # Formatters, LKR currency, phone validator
│   │   │   ├── auth-context.tsx
│   │   │   ├── api-client.ts
│   │   │   └── query-client.tsx
│   │   └── middleware.ts # Route guard & next-intl localization handler
│   ├── public/           # Static assets, hero videos, brand logos
│   └── package.json
│
├── backend/              # Standalone Express.js + Prisma + MySQL REST API
│   ├── src/
│   │   ├── controllers/  # Public and admin route controllers
│   │   ├── middleware/   # Rate limiting, auth, validation, security
│   │   ├── routes/       # Express route definitions (/api/v1/*)
│   │   ├── services/     # Order placement, stock sync, analytics
│   │   ├── server.ts     # Server bootstrap
│   │   └── app.ts        # Express app & CORS configuration
│   ├── prisma/
│   │   ├── schema.prisma # MySQL schema definition
│   │   └── seed.ts       # Database seeder (admin user & categories)
│   ├── tests/            # Vitest unit and integration test suite
│   └── package.json
│
├── package.json          # Root manager with cross-project scripts
├── README.md             # Documentation
└── AGENTS.md             # AI Agent rules & invariants (this file)
```

---

## ⚡ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend Web & Admin** | Next.js 16 (App Router, Turbopack), React 19, TypeScript 5, Tailwind CSS v4 |
| **Storefront Localization** | `next-intl` (English `en`, Sinhala `si`, Tamil `ta`) |
| **Admin UI State & Tables** | `@tanstack/react-table`, `@tanstack/react-query`, `recharts`, `react-hook-form`, `zod` |
| **Backend REST API** | Node.js, Express.js 4, TypeScript, Prisma ORM 5, MySQL 8 (utf8mb4) |
| **Object & Media Storage** | **Cloudflare R2** (S3-compatible, zero egress fees, edge CDN delivery) |
| **Testing** | Vitest (Backend integration & unit tests) |
| **Icons & Styling** | Lucide React, Custom Dark Theme (`#05070a`, neon `#ccff00`) |

---

## 🌐 Port Mapping & Running Environments

| Service | Local Port | URL |
|---|---|---|
| **Frontend & Admin** | `3000` (or `3001`) | `http://localhost:3000` (Admin at `/admin`) |
| **Backend REST API** | `4000` | `http://localhost:4000/api/v1` |
| **Swagger API Docs** | `4000` | `http://localhost:4000/api/docs` |
| **MySQL Database** | `3306` | Native MySQL or Docker container (`shiftlk-mysql`) |

---

## 🚨 Critical Architectural Invariants (DO NOT VIOLATE)

### 1. Unified Frontend Architecture
- **NEVER separate the Admin UI back into a standalone Next.js project.**
- Customer storefront routes belong under `frontend/src/app/[locale]/...`.
- Admin routes belong strictly under `frontend/src/app/admin/...`.
- Both share the same domain and port (`http://localhost:3000`).

### 2. Authentication & Route Protection
- Authentication is handled via **HTTP-only, SameSite=Lax JWT cookies** (`access_token`, `refresh_token`).
- `frontend/src/middleware.ts` guards all `/admin/*` routes.
- If a user is not authenticated, they must be redirected to `/admin/login` (NOT `/login`).
- Root `/admin` redirects to `/admin/dashboard` when logged in.

### 3. SEO & Crawlers Isolation
- `frontend/src/app/robots.ts` **must always disallow** `/admin/` and `/admin`.
- Sitemaps (`sitemap.ts`) must only index customer storefront paths.
- Admin layout contains `robots: { index: false, follow: false }`.

### 4. Data Privacy & Margin Security
- **Cost prices (`cost_price`) and historical profit snapshots must NEVER be exposed in public API endpoints.**
- Public API controllers must serialize product DTOs to strip cost prices and internal notes.
- Only `/api/v1/admin/*` endpoints may return margins, costs, and profit calculations.

### 5. Stock Movement Audit Trail
- Stock updates cannot happen through ad-hoc queries.
- Every inventory modification must generate a `StockMovement` audit record (e.g., `RESTOCK`, `ORDER_DEDUCT`, `CANCEL_RESTORE`, `MANUAL_ADJUST`).
- Order placement does **NOT** reduce stock automatically; confirmation by admin in `/admin/orders` atomically decrements stock.

### 6. Design System & Typography
- Brand colors:
  - Neon Accent: `#ccff00` (`--color-brand-neon`)
  - Deep Dark Background: `#05070a` / `#06080d`
  - Cards & Borders: `#141c2e`, `#212c42`
- Typography:
  - English: `Outfit`, `Inter`
  - Sinhala (`:lang(si)`): `Gemunu Libre` (display), `Noto Sans Sinhala` (body)
  - Tamil (`:lang(ta)`): `Anek Tamil` (display), `Noto Sans Tamil` (body)
- **Do not use plain, generic color schemes or unstyled placeholders.**

### 7. Product Media & Image Storage (Cloudflare R2)
- **All product images and media assets are stored in Cloudflare R2 Object Storage**, NEVER on local server disk in production.
- Cloudflare R2 provides an S3-compatible API with **zero egress fees**, ensuring fast, cost-effective image delivery to mobile users across Sri Lanka.
- Image uploads from the Admin portal (`/admin/products/new`, `/admin/products/[id]/edit`) stream directly to the R2 bucket or use presigned PUT URLs generated by `backend`.
- Product image URLs persisted in MySQL (`products.images`) must store the public CDN URL (e.g. `https://media.shiftlk.lk/...` or `https://pub-<id>.r2.dev/...`).
- Next.js `next.config.ts` allows the Cloudflare R2 domain under `images.remotePatterns` for optimized image rendering.
- Backend requires the following environment variables:
  - `R2_ACCOUNT_ID`
  - `R2_ACCESS_KEY_ID`
  - `R2_SECRET_ACCESS_KEY`
  - `R2_BUCKET_NAME`
  - `R2_PUBLIC_DOMAIN`

---

## 🛠️ Common Commands

### From Root Directory (`/`):
```bash
# Start backend API (port 4000)
npm run dev:api

# Start unified web & admin (port 3000)
npm run dev:web

# Install all dependencies across both projects
npm run install:all

# Run backend tests
npm run test:api

# Production build check
npm run build:web
npm run build:api
```

### In `backend/`:
```bash
npm run db:push        # Push Prisma schema to MySQL
npm run prisma:seed    # Seed initial admin and product data
npm test               # Run Vitest test suite
npm run dev            # Start tsx development server
```

### In `frontend/`:
```bash
npm run dev            # Start Next.js development server
npm run build          # Production Next.js build
npm run start          # Start production Next.js server
```

---

## 🔑 Default Credentials (Development)
- **Admin Email:** `admin@shiftlk.lk`
- **Admin Password:** `ShiftAdmin@2026`
