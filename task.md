# ShiftLK Spares — Development Task Roadmap (`task.md`)

This document defines the actionable development tasks, architectural requirements, step-by-step external setup guidelines, and acceptance criteria to bring **ShiftLK Motorbike Spares** to 100% production completion.

---

## 📋 Task Overview & Status

| # | Task | Scope | Priority | Status |
|---|---|---|---|---|
| **1** | **Cloudflare R2 Object Storage Integration** | Store product images in Cloudflare R2 bucket with edge delivery | High | ✅ Completed |
| **2** | **Custom Product Low Stock Threshold** | Allow admins to define custom low stock alerts per product | Medium | ✅ Completed |
| **3** | **Admin Category Management & Selection** | Full CRUD for categories + in-form quick category creation | High | ✅ Completed |
| **4** | **Admin Brand Management & Quick Creation** | Full CRUD for brands + in-form `+ New Brand` modal in product forms | High | ✅ Completed |
| **5** | **Customer Order Tracking Portal** | Trilingual `/[locale]/track-order` page using Order Code + Phone | High | ⏳ Pending |
| **6** | **Multi-Item Shopping Cart & Checkout** | Persistent cart drawer + combined weight calculation + multi-item order | Medium | ⏳ Pending |
| **7** | **Dynamic Settings, Staff Privacy & Data Sync** | Fix low-stock KPI bug, enforce `hideProfitFromStaff`, dynamic WhatsApp & Sitemap | High | ⏳ Pending |
| **8** | **Storefront Catalog Pagination & Image Polish** | Server-side pagination UI on `/products` + R2/local image rendering | Medium | ⏳ Pending |
| **9** | **Admin Audit Logs Viewer & Password Reset** | UI for `/api/v1/admin/audit-logs` + Admin/Staff password reset in Settings | Low | ⏳ Pending |

---

## 🚀 Task 1: Cloudflare R2 Object Storage for Product Media

### 1.1 Objective
Enable admins to upload high-resolution product photos directly to **Cloudflare R2 Object Storage** from `/admin/products/new` and `/admin/products/[id]/edit`. Images must be delivered across Sri Lanka via Cloudflare CDN with zero egress fees, fast loading, and automated thumbnail optimization.

---

### 1.2 Step-by-Step Guide: How to Create and Configure a Cloudflare R2 Bucket

#### Step 1: Log in to Cloudflare Dashboard
1. Go to [dash.cloudflare.com](https://dash.cloudflare.com/) and log in with your Cloudflare account.
2. In the left navigation menu, click **R2 Object Storage**.
3. (If you haven't enabled R2 yet, accept terms — Cloudflare gives **10 GB/month free storage** and **zero egress bandwidth fees**).

#### Step 2: Create the R2 Bucket
1. Click the **Create bucket** button.
2. **Bucket Name:** Enter `shiftlk-media` (or `shiftlk-products`).
3. **Location:** Select **Automatic** (or regional placement closest to South Asia / Singapore for lowest latency in Sri Lanka).
4. Click **Create Bucket**.

#### Step 3: Enable Public Access or Connect Custom Domain
To allow storefront visitors and browsers to view product images:
- **Option A (Custom Domain - Recommended for Production):**
  1. Inside your bucket settings, go to the **Settings** tab.
  2. Under **Public Access**, click **Connect Domain**.
  3. Enter a subdomain on your domain (e.g. `media.shiftlk.lk`).
  4. Cloudflare automatically generates the DNS record and SSL certificate.
- **Option B (R2.dev Subdomain - Fast for Development):**
  1. In the **Settings** tab under **Public Access**, find **R2.dev subdomain**.
  2. Click **Allow Access** and type `allow` to enable.
  3. Copy your public URL (e.g. `https://pub-xxxxxxxxxxxxxxxxxxxxxxxx.r2.dev`).

#### Step 4: Configure CORS Policy
To allow uploads from your local development environment (`http://localhost:3000`, `http://localhost:3001`) and production domain (`https://shiftlk.lk`):
1. In bucket **Settings**, scroll to **CORS Policy**.
2. Click **Add CORS Policy** and paste the following JSON:
```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "http://localhost:3001",
      "https://shiftlk.lk",
      "https://www.shiftlk.lk"
    ],
    "AllowedMethods": [
      "GET",
      "PUT",
      "POST",
      "DELETE",
      "HEAD"
    ],
    "AllowedHeaders": [
      "*"
    ],
    "ExposeHeaders": [
      "ETag"
    ],
    "MaxAgeSeconds": 3600
  }
]
```
3. Click **Save**.

#### Step 5: Generate API Tokens (S3 Credentials)
1. Go back to the main **R2 Object Storage** overview page in the Cloudflare sidebar.
2. On the right side, click **Manage R2 API Tokens**.
3. Click **Create API Token**.
4. **Token Name:** `shiftlk-backend-uploader`.
5. **Permissions:** Select **Admin Read & Write** (or `Object Read & Write` scoped to `shiftlk-media`).
6. Click **Create API Token**.
7. Copy and securely store the values:
   - **Account ID** (found under Account details)
   - **Access Key ID**
   - **Secret Access Key**
   - **Jurisdiction Endpoint** (`https://<ACCOUNT_ID>.r2.cloudflarestorage.com`)

---

### 1.3 Technical Implementation Plan for Task 1

#### 1. Backend (`backend/`)
- [x] Install AWS SDK S3 client packages (`@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`)
- [x] Add R2 environment variables to `backend/.env` and `backend/src/config/env.ts` (`R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME=shiftlk-dev-media`)
- [x] Create `backend/src/lib/r2.ts` implementing the S3-compatible client and upload utilities
- [x] Create multipart upload & presigned URL endpoints in `backend/src/modules/uploads/`
- [x] Add integration tests in `backend/tests/integration/admin-r2-uploads.test.ts` (all 6 tests passing)

#### 2. Frontend (`frontend/`)
- [x] Configure image optimization remote patterns in `frontend/next.config.ts`
- [x] Build reusable `ImageUploadDropzone.tsx` component with drag-and-drop, upload progress, primary cover selector, and reordering
- [x] Integrate `ImageUploadDropzone` into `/admin/products/new` and `/admin/products/[id]/edit`
- [x] Persist uploaded image URLs array (`{ imageUrl, isPrimary, displayOrder }`) to MySQL via product create & update APIs

---

## 📦 Task 2: Custom Product Low Stock Threshold

### 2.1 Objective
Allow store managers to configure an individual **Low Stock Alert Threshold** for each product when creating or updating it (e.g. fast-moving items like spark plugs or engine oil may alert at 10 units, while rare fairing parts alert at 2 units).

---

### 2.2 Technical Implementation Plan for Task 2

#### 1. Backend Verification & Validation (`backend/`)
- [x] The Prisma schema already includes `lowStockThreshold Int @default(5) @map("low_stock_threshold")`.
- [x] In `backend/src/modules/products/admin.products.schema.ts`:
  - Ensure `createProductSchema` and `updateProductSchema` include:
    ```typescript
    lowStockThreshold: z.coerce.number().int().min(1, 'Threshold must be at least 1').default(5),
    ```
- [x] In `backend/src/modules/products/admin.products.controller.ts`:
  - Validate that `lowStockThreshold` is saved on product creation (`prisma.product.create`).
  - Validate that `lowStockThreshold` updates properly during product edits (`prisma.product.update`).
- [x] Add integration test verifying custom thresholds (e.g., threshold set to 8 alerts when stock drops to 8).

#### 2. Admin UI Enhancements (`frontend/`)
- [x] In `frontend/src/app/admin/products/new/page.tsx`:
  - Verify the "Low Stock Alert Threshold" input field has clear helper text:
    `"Alerts will trigger in Dashboard and Stock views when inventory drops to or below this amount."`
  - Ensure default value is `5`.
  - Validate that the submitted value is transmitted in the payload.
- [x] In `frontend/src/app/admin/products/[id]/edit/page.tsx`:
  - Pre-fill the existing product's `lowStockThreshold`.
  - Allow the admin to modify and save the value.
- [x] In `frontend/src/app/admin/stock/page.tsx`:
  - Verify the stock health calculation compares `product.stockQty <= product.lowStockThreshold` (rather than a hardcoded 5).
  - Badge with `Low Stock` (amber) or `Out of Stock` (rose).
- [x] In `frontend/src/app/admin/dashboard/page.tsx`:
  - Ensure the "Low Stock Alerts" card queries and displays products matching `stockQty <= lowStockThreshold`.

---

## 🗂️ Task 3: Admin Category Management & In-Form Selection

### 3.1 Objective
Provide a dedicated Category Management system where admins can create, view, edit, reorder, and toggle motorbike part categories (with trilingual support: English, Sinhala, Tamil). Furthermore, when creating a product at `/admin/products/new`, admins must be able to select existing categories or quickly add a new category on the fly without abandoning the product form.

---

### 3.2 Technical Implementation Plan for Task 3

#### 1. Backend API (`backend/`)
- [x] Create category schemas in `backend/src/modules/categories/categories.schema.ts`:
  ```typescript
  export const createCategorySchema = z.object({
    slug: z.string().min(2).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
    icon: z.string().default('Wrench'),
    displayOrder: z.coerce.number().int().default(0),
    isActive: z.boolean().default(true),
    translations: z.object({
      en: z.object({ name: z.string().min(2), description: z.string().optional() }),
      si: z.object({ name: z.string().min(2), description: z.string().optional() }),
      ta: z.object({ name: z.string().min(2), description: z.string().optional() }),
    }),
  });
  ```
- [x] Implement Admin Category Controller & Service:
  - `GET /api/v1/admin/categories` — List all categories with product counts and all translations.
  - `POST /api/v1/admin/categories` — Create category and `category_translations` atomically in Prisma transaction.
  - `PUT /api/v1/admin/categories/:id` — Update slug, icon, display order, isActive, and translation records.
  - `DELETE /api/v1/admin/categories/:id` — Prevent deletion if products are linked (return 400 with linked count), or allow soft-delete (`isActive: false`).
- [x] Register admin routes in `backend/src/modules/categories/categories.routes.ts` protected by `authGuard` and `requireRole(['ADMIN'])`.

#### 2. Admin UI: Dedicated Categories Page (`frontend/src/app/admin/categories/page.tsx`)
- [x] Create `/admin/categories` page displaying:
  - Header with total category count and `+ Add Category` button.
  - Responsive table showing:
    - Icon & English Name
    - Sinhala & Tamil Translations
    - Slug
    - Products Linked Count
    - Display Order
    - Status (`Active` / `Disabled` badge)
    - Actions (Edit, Toggle Status, Delete)
- [x] Create `CategoryModal.tsx` for creating/editing categories:
  - Auto-generate slug from English name.
  - Icon picker (popular Lucide motorbike icons: `Wrench`, `Cog`, `Disc`, `Zap`, `Shield`, `Activity`, `Gauge`, `Layers`, `Flame`, `Palette`, `Bike`).
  - Trilingual tabs or stacked inputs for `English`, `Sinhala (සිංහල)`, and `Tamil (தமிழ்)`.
  - Display order input and active status toggle.

#### 3. Admin UI: Navigation Integration
- [x] In `frontend/src/components/admin/layout/AdminSidebar.tsx`:
  - Add `Categories` navigation item with `Layers` icon under `/admin/categories`.

#### 4. Admin UI: In-Form Quick Category Creation in Product Form
- [x] In `frontend/src/app/admin/products/new/page.tsx` and `[id]/edit/page.tsx`:
  - Add a `+ New Category` button next to the Category dropdown.
  - Clicking opens a lightweight `QuickAddCategoryDialog`.
  - On submit:
    1. Creates the category via `POST /api/v1/admin/categories`.
    2. Invalidates React Query `['categories']` cache.
    3. Automatically selects the newly created category in the dropdown.
    4. Shows a success toast without resetting any product form inputs.

---

## 🏷️ Task 4: Admin Brand Management & In-Form Quick Brand Creation

### 4.1 Objective
Currently, `backend/src/modules/brands/` only exposes a read-only `GET /api/v1/brands` endpoint, leaving admins unable to add new motorbike or accessory brands (e.g., TVS, Hero, Studds, Vega, Brembo, NGK, Motul) from the Admin Portal. Provide full Admin CRUD for Brands and a quick `+ New Brand` modal inside the Product Create/Edit forms.

### 4.2 Technical Implementation Plan for Task 4
- [x] **Backend (`backend/src/modules/brands/`):**
  - Create `brands.schema.ts` (`name`, `slug`, `country`, `isActive`).
  - Implement Admin Brand endpoints:
    - `GET /api/v1/admin/brands` — List all brands with linked product counts (`_count.products`).
    - `POST /api/v1/admin/brands` — Create a new brand with unique slug validation and audit log.
    - `PUT /api/v1/admin/brands/:id` — Update brand name, slug, country, or active status.
    - `DELETE /api/v1/admin/brands/:id` — Block deletion if products are linked (return 400 with count).
- [x] **Admin UI (`frontend/src/app/admin/`):**
  - Create `/admin/brands` management page (or integrate with `/admin/categories` & sidebar navigation) to view, add, edit, and toggle brands.
  - In `frontend/src/app/admin/products/new/page.tsx` and `[id]/edit/page.tsx`, add a `+ New Brand` trigger next to the Brand selector that creates the brand, refreshes `['brands']`, and auto-selects it in the form.

---

## 📍 Task 5: Customer Order Tracking Portal (`/[locale]/track-order`)

### 5.1 Objective
The backend already provides `GET /api/v1/orders/:code?phone=...` (`ordersService.getOrderByCodeAndPhone`) and `apiClient.getOrderStatus(code, phone)`, but there is no storefront page for customers to track their orders. Build a trilingual Order Tracking page so customers can check live order progression (`PENDING` → `CONFIRMED` → `SHIPPED` → `DELIVERED`) and view their courier tracking number.

### 5.2 Technical Implementation Plan for Task 5
- [ ] **Storefront Page (`frontend/src/app/[locale]/track-order/page.tsx`):**
  - Search form accepting **Order Code** (e.g., `SLK-000125`) and **Sri Lankan Phone Number** (`07X XXX XXXX`).
  - Support URL query pre-filling (`?code=SLK-000125&phone=...`) so links shared on WhatsApp open directly.
  - Visual 4-step status timeline (`Order Placed`, `Confirmed & Packed`, `Handed to Courier`, `Delivered`) with cancellation handling.
  - Display courier tracking number badge, itemized parts list, delivery district, and total COD amount.
- [ ] **Navigation & Localization (`frontend/messages/{en,si,ta}.json`):**
  - Add trilingual translation keys under `trackOrder` and `nav.trackOrder`.
  - Add "Track Order" link in `Header.tsx` and `Footer.tsx`.

---

## 🛒 Task 6: Multi-Item Shopping Cart & Combined WhatsApp Checkout

### 6.1 Objective
Currently, customers can only order a single product at a time from the product detail page, even though `POST /api/v1/orders` in the backend already supports multi-item arrays (`items: Array<{ productId, qty }>`) and combined weight shipping calculations. Enable customers to add multiple parts into a shopping cart and place a single consolidated order.

### 6.2 Technical Implementation Plan for Task 6
- [ ] **Cart State (`frontend/src/lib/cart-context.tsx`):**
  - Persistent `localStorage` cart storing `{ product, qty }` with `addItem`, `updateQty`, `removeItem`, `clearCart`, total items count, and combined weight calculation.
- [ ] **Cart UI (`frontend/src/components/cart/CartDrawer.tsx`):**
  - Add Cart button with live item count badge in `Header.tsx`.
  - Add "Add to Cart" button alongside "Order via WhatsApp" in `ProductCard.tsx` and `LiveOrderSummary.tsx`.
  - Slide-over `CartDrawer` with district selector, live combined weight courier fee calculation (`Rs. 425` first kg + `Rs. 100/kg` extra, or `Rs. 220` Speed Post if all items are stickers `< 250g`), and multi-item WhatsApp checkout submission via `/api/orders`.
- [ ] **Update `/api/orders` & `orderService.ts`:**
  - Support both single-item (`productId`, `quantity`) and multi-item (`items: [{ productId, qty }]`) payloads seamlessly.

---

## 🔄 Task 7: Dynamic Settings, Staff Privacy & Storefront Data Sync Fixes

### 7.1 Objective
Resolve remaining hardcoded values, seed-data fallbacks, and staff permission gaps between the Backend and Frontend.

### 7.2 Technical Implementation Plan for Task 7
- [ ] **Fix Analytics Overview Low-Stock Count Bug (`backend/src/modules/analytics/analytics.service.ts`):**
  - In `getOverview()`, replace hardcoded `stockQty: { lte: 3 }` with dynamic per-product comparison (`stockQty <= lowStockThreshold`) so the Dashboard KPI card count matches `getLowStock()` and `/admin/stock`.
- [ ] **Per-Product Low Stock Badge on Storefront (`backend/src/utils/serializers.ts` & `frontend/`):**
  - Include `low_stock_threshold` in `toPublicProductDto` and `LocalizedProduct` so `ProductCard.tsx` and `LiveOrderSummary.tsx` use `product.low_stock_threshold` instead of hardcoded `5`.
- [ ] **Enforce `hideProfitFromStaff` System Setting:**
  - When `SystemSetting.hideProfitFromStaff` is `true` and the logged-in user has role `STAFF`:
    - Strip or mask `grossProfit`, `netProfit`, `cogs`, and `costPrice` in `/admin/dashboard`, `/admin/products`, `/admin/orders/[id]`, and `/admin/reports`.
- [ ] **Dynamic Business WhatsApp Number:**
  - Expose public store config (`whatsappNumber`) from `SystemSetting` and use it in `orders.service.ts` (`getWhatsAppUrl`) as well as storefront WhatsApp CTAs.
- [ ] **Dynamic Sitemap & Vehicle Make/Model Filter:**
  - Update `frontend/src/app/sitemap.ts` to fetch live active product slugs from `/api/v1/products` (with fallback to seed slugs if offline).
  - Update `getAllMakesAndModels()` in `frontend/src/services/productService.ts` to merge live vehicle compatibilities from the backend.

---

## 📄 Task 8: Storefront Catalog Pagination & Local/R2 Image Rendering Polish

### 8.1 Objective
Allow storefront visitors to browse across multiple pages of spare parts on `/[locale]/products` and ensure product images served from either Cloudflare R2 or the local backend media proxy render without Next.js private-IP errors.

### 8.2 Technical Implementation Plan for Task 8
- [ ] **Catalog Pagination (`frontend/src/app/[locale]/products/page.tsx` & `productService.ts`):**
  - Return `{ items, pagination }` from `getProducts()` and render Previous / Page Numbers / Next pagination controls at the bottom of `/[locale]/products` preserving active search/filter query params.
- [ ] **Image Rendering Resilience (`ProductCard.tsx` & `ProductGallery.tsx`):**
  - Normalize relative media paths (`/api/v1/media/...`) and set `unoptimized` on `<Image />` when the URL points to `localhost` / `127.0.0.1` in development, while keeping full Next.js optimization for Cloudflare R2 CDN URLs.

---

## 🛡️ Task 9: Admin Audit Logs Viewer & Staff Password Management

### 9.1 Objective
Expose the existing backend Audit Logs API (`GET /api/v1/admin/audit-logs`) in the Admin Portal and allow admins to change passwords or reset staff member passwords.

### 9.2 Technical Implementation Plan for Task 9
- [ ] **Audit Logs Tab in `/admin/settings` (`frontend/src/app/admin/settings/page.tsx`):**
  - Add an **Audit Trail** tab (Admin-only) displaying timestamp, staff member, action badge (`CREATE_PRODUCT`, `RESTOCK_PRODUCT`, `UPDATE_ORDER_STATUS`, etc.), entity ID, IP address, and change details with pagination.
- [ ] **Password Reset / Update (`backend/src/modules/users/` & `/admin/settings`):**
  - Add `PATCH /api/v1/admin/users/:id/password` endpoint allowing admins to reset a staff user's password (or change their own password) with bcrypt hashing and audit logging.
  - Add a "Reset Password" modal button in the Staff & Personnel table in `/admin/settings`.

---

## 🎯 Verification & Acceptance Checklist

### Cloudflare R2 (Task 1):
- [x] R2 bucket created (`shiftlk-dev-media`), credentials set in `.env`, and live connection verified.
- [x] Admin can drag-and-drop or pick multiple images in `/admin/products/new` and `/admin/products/[id]/edit`.
- [x] Images upload directly to Cloudflare R2 with progress feedback, primary cover selection, and reordering.
- [x] Product images stream directly from R2 via CDN and fallback media endpoint.

### Low Stock Threshold (Task 2):
- [x] Admin can enter a custom low stock threshold (e.g. `12`) when adding a product.
- [x] Product displays low stock warnings in `/admin/stock` when quantity drops to 12.
- [x] Default threshold remains 5 if unspecified.

### Category Management (Task 3):
- [x] Admin can view, create, edit, and disable categories from `/admin/categories`.
- [x] Categories support English, Sinhala, and Tamil names.
- [x] Admin can create a new category directly from the `/admin/products/new` screen without losing unsaved product data.
- [x] Storefront category filter bar dynamically displays all active categories in the customer's selected language.

### Brand Management (Task 4):
- [x] Admin can view, create, edit, and delete brands from the Admin Portal.
- [x] Admin can quickly add a new brand directly inside the product create/edit forms.

### Customer Order Tracking & Cart (Tasks 5 & 6):
- [ ] Customers can look up live order status on `/[locale]/track-order` using their Order Code and Sri Lankan phone number.
- [ ] Customers can add multiple spare parts to the cart drawer and submit a combined WhatsApp order with accurate weight-based delivery fees.

### Data Sync, Pagination & Security (Tasks 7, 8 & 9):
- [ ] Dashboard Low Stock KPI count accurately matches per-product `lowStockThreshold`.
- [ ] Enabling `hideProfitFromStaff` hides cost and profit metrics from `STAFF` users.
- [ ] Storefront `/products` supports multi-page pagination.
- [ ] Admin can view system audit logs and reset staff passwords in `/admin/settings`.
