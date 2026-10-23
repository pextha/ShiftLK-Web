# ShiftLK API - Standalone Backend

Standalone REST API backend for the **ShiftLK Spares** motorbike spare parts e-commerce platform. Built with **Node.js 20, Express, TypeScript, MySQL 8, and Prisma ORM**.

---

## Architecture & Tech Stack

- **Runtime & Language**: Node.js 20 (LTS), TypeScript (Strict Mode)
- **Framework**: Express.js
- **Database**: MySQL 8.0 (InnoDB engine, `utf8mb4` encoding for full English, Sinhala, and Tamil support)
- **ORM & Migrations**: Prisma ORM with native transaction support (`$transaction` and `SELECT ... FOR UPDATE` for row locks)
- **Validation**: Zod schema validation for all incoming requests
- **Authentication**: JWT authentication (short-lived access token in `httpOnly` secure cookie + rotating refresh token), Role-Based Access Control (`ADMIN`, `STAFF`)
- **Password Security**: bcrypt password hashing
- **File Uploads**: Multer with localized filesystem storage (`/uploads`), extensible to S3/Cloudflare R2
- **Security & Middlewares**: Helmet, CORS (locked to frontend origin), Express Rate Limit, Pino structured logging
- **API Documentation**: OpenAPI / Swagger UI at `/api/docs`
- **Testing**: Vitest + Supertest for unit and integration testing

---

## 📁 Repository Structure

```text
shiftLK-api/
├── prisma/
│   ├── schema.prisma        # Database schema models, enums, indexes, relations
│   ├── migrations/          # Version-controlled SQL migrations
│   └── seed.ts              # Database seeder (25 districts, categories, 12 sample parts, admin user)
├── src/
│   ├── config/              # Validated environment variables (Zod)
│   ├── middlewares/         # Auth guard, role guard, error handler, rate limiters, request validation
│   ├── modules/
│   │   ├── auth/            # Admin & staff login, logout, refresh, me, change-password
│   │   ├── products/        # Catalog search, filter, details, admin CRUD, CSV import/export
│   │   ├── categories/      # Category listing and management
│   │   ├── brands/          # Brand listing and management
│   │   ├── delivery/        # 25 District delivery zones and shipping fee calculator
│   │   ├── orders/          # Public order placement, tracking, admin order workflow, stock lock/release
│   │   ├── expenses/        # Operational and inventory expense management
│   │   ├── analytics/       # Revenue, profit calculation, top parts, low-stock alerts
│   │   ├── uploads/         # Multi-part image uploader with MIME type verification
│   │   └── audit/           # Audit trail logs for price, stock, and order status updates
│   ├── utils/               # Order code generator, phone validator, WhatsApp formatter, DTO serializers
│   ├── app.ts               # Express application initialization & routes mounting
│   └── server.ts            # Server entrypoint and graceful shutdown handling
├── tests/
│   ├── unit/                # Phone validator, shipping fee, WhatsApp builder tests
│   └── integration/         # Orders API, concurrency stock locking, auth flow tests
├── uploads/                 # Local media storage directory
├── docker-compose.yml       # Local MySQL 8 + API container orchestration
├── Dockerfile               # Multi-stage production container build
├── package.json
└── tsconfig.json
```

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- **Node.js**: v20 or higher
- **npm**: v10 or higher
- **Docker & Docker Compose** (optional, recommended for local MySQL) or a local MySQL 8 server

### 2. Configure Environment Variables
Copy the example environment configuration:
```bash
cp .env.example .env
```

Adjust the `.env` parameters if necessary:
```env
PORT=4000
NODE_ENV=development
FRONTEND_ORIGIN=http://localhost:3000

# MySQL Database Connection (utf8mb4 charset required)
DATABASE_URL="mysql://shiftlk_user:shiftlk_password@localhost:3306/shiftlk_db?charset=utf8mb4"

# JWT Secrets
JWT_SECRET=shiftlk_super_secure_jwt_access_secret_key_change_in_production_2026
JWT_REFRESH_SECRET=shiftlk_super_secure_jwt_refresh_secret_key_change_in_production_2026
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Initial Admin User Credentials
INITIAL_ADMIN_EMAIL=admin@shiftlk.lk
INITIAL_ADMIN_PASSWORD=ShiftAdmin@2026
INITIAL_ADMIN_NAME="ShiftLK Administrator"

# Uploads
UPLOAD_DIR=./uploads
MAX_FILE_SIZE_MB=5
```

### 3. Start MySQL with Docker Compose
If you do not have a local MySQL 8 server installed, launch the included MySQL container:
```bash
docker-compose up -d mysql
```
*This boots MySQL 8 with `utf8mb4` character set and mounts persistent data to a local volume.*

### 4. Install Dependencies
```bash
npm install
```

### 5. Run Database Migrations and Seed
Push the schema to MySQL and populate the database with default categories, brands, 25 Sri Lankan districts with standard fees, 12 motorcycle parts, and the initial admin account:
```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

### 6. Start the Development Server
```bash
npm run dev
```
The server starts at **`http://localhost:4000`**.
- Health check: `http://localhost:4000/health`
- Interactive API Documentation: `http://localhost:4000/api/docs`

---

## 🔒 Security & Data Integrity Highlights

1. **Zero Cost Price Leakage (Public DTO Serializers)**:
   - MySQL does not support Supabase-style Row-Level Security (RLS).
   - All public endpoints strictly pass database records through specialized DTO transformers (`toPublicProductDto`, etc.).
   - `cost_price`, supplier information, profit margins, and internal notes are **never** exposed on public endpoints.

2. **Race-Condition-Safe Order Numbers**:
   - Order codes format: `SLK-000124`.
   - Generated inside a Prisma transaction using a row-locked counter table (`SELECT last_number FROM order_counters WHERE id = 'default' FOR UPDATE`).

3. **Two-Stage Stock Management & Concurrency Locking**:
   - **Order Placement (Public)**: Validates that stock is available and sets order to `PENDING`. Stock is not decremented immediately to prevent cart-hoarding.
   - **Order Confirmation (Admin)**: When staff confirms the order via WhatsApp, a database transaction locks the product rows (`SELECT ... FOR UPDATE`), checks stock, and safely decrements `stock_qty`. If two customers ordered the last item, the second confirmation is rejected safely with an explicit error.
   - **Order Cancellation**: If a confirmed order is cancelled, stock is restored automatically inside an atomic transaction.

4. **Sri Lankan Phone Normalization**:
   - Accepts `0771234567`, `+94771234567`, `077 123 4567`, `94771234567`.
   - Normalizes all numbers to E.164 standard `+947XXXXXXXX`.

---

## 📡 API Overview

### Public Endpoints (`/api/v1`)
- `GET /api/v1/products` — Filter by search term, make/model/year, brand, category, condition, price range, stock status, sorting, and pagination (supports `locale=en|si|ta`).
- `GET /api/v1/products/:slug` — Retrieve full localized product details, compatibility specifications, and primary images.
- `GET /api/v1/categories` — List all active categories with icon identifiers.
- `GET /api/v1/brands` — List all supported bike brands (Bajaj, Yamaha, Honda, TVS, etc.).
- `GET /api/v1/delivery-zones` — All 25 Sri Lankan district delivery fees, base rates, and estimated transit times.
- `POST /api/v1/orders` — Place a new order, calculate official subtotal and shipping fees on server, generate WhatsApp order dispatch link.
- `GET /api/v1/orders/:code?phone=...` — Customer order status lookup (requires matching order code and verified phone number).

### Protected Admin Endpoints (`/api/v1/admin`, requires JWT cookie)
- `POST /api/v1/admin/auth/login` — Authenticate admin or staff.
- `POST /api/v1/admin/auth/refresh` — Rotate access token.
- `GET /api/v1/admin/auth/me` — Current logged-in user profile.
- `GET /api/v1/admin/orders` — Filter orders by status, date range, district, phone, or code.
- `PATCH /api/v1/admin/orders/:id/status` — Manage workflow (`PENDING` → `CONFIRMED` [atomic stock lock] → `SHIPPED` → `DELIVERED` / `CANCELLED` [atomic stock restore]).
- `POST /api/v1/admin/products` — Create product with cost price, stock, multilingual text, and vehicle compatibilities.
- `PUT /api/v1/admin/products/:id` — Update product pricing, cost, stock, and fitment.
- `POST /api/v1/admin/uploads` — Upload product photos with automatic MIME verification.
- `GET /api/v1/admin/analytics` — Revenue, gross profit, net profit, low-stock warnings, and district breakdown.
- `GET /api/v1/admin/expenses` — Track logistics, inventory, utilities, and salary expenses.
- `GET /api/v1/admin/audit` — View immutable logs for all price and inventory adjustments.

---

## 🧪 Testing

Run the test suite with Vitest:
```bash
# Run all unit and integration tests
npm test

# Run tests in watch mode
npm run test:watch
```

Key test suites:
- `tests/unit/phone-validator.test.ts`: Validates all Sri Lankan telecom prefix variants (Dialog, Mobitel, Airtel, Hutch).
- `tests/unit/delivery-fee.test.ts`: District shipping calculation and weight brackets.
- `tests/unit/whatsapp-builder.test.ts`: Verifies formatted multilingual WhatsApp order templates in English, Sinhala, and Tamil.
- `tests/integration/orders.test.ts`: End-to-end order placement, pricing validation, and order code generation.
- `tests/integration/concurrency-stock.test.ts`: Concurrency test simulating simultaneous confirmation of the last available stock.

---

## 🚢 Production Deployment

### Option A: Traditional VPS (Ubuntu + PM2 + Nginx)
1. **Provision Ubuntu 22.04+ Server** with Node.js 20 and MySQL 8.
2. **Clone & Build**:
   ```bash
   git clone <repo-url> /var/www/shiftlk-api
   cd /var/www/shiftlk-api
   npm ci
   npx prisma generate
   npx prisma migrate deploy
   npm run build
   ```
3. **PM2 Process Manager**:
   ```bash
   npm install -g pm2
   pm2 start dist/server.js --name shiftlk-api -i max
   pm2 save && pm2 startup
   ```
4. **Nginx Reverse Proxy**:
   Configure Nginx with SSL (Let's Encrypt Certbot) routing `api.shiftlk.lk` to `http://127.0.0.1:4000` with `client_max_body_size 10M;`.

### Option B: Containerized (Docker Compose)
Launch the complete stack in detached mode:
```bash
docker-compose -f docker-compose.yml up -d --build
```

### Option C: Cloud PaaS (Railway / Render / Koyeb + Managed MySQL)
- Set `DATABASE_URL` to your cloud MySQL connection string (e.g., PlanetScale, Aiven, or Railway MySQL).
- Set `NODE_ENV=production`, `FRONTEND_ORIGIN=https://shiftlk.lk`, and strong JWT secrets.
- Build command: `npm ci && npx prisma generate && npm run build`.
- Start command: `npx prisma migrate deploy && node dist/server.js`.

---

## 📄 License
Proprietary software for ShiftLK Spares (Pvt) Ltd. All rights reserved.
