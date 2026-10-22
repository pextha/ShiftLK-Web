# ShiftLK Motorbike Spares

Complete E-Commerce & Inventory Management Platform for **ShiftLK Spares** (Polgasowita, Sri Lanka).

---

## 📁 Repository Structure

```
shiftLK-web/
├── shiftLK-frontend/   # Customer Storefront (Next.js 15+ App Router, next-intl, Tailwind/CSS) - Port 3000
├── shiftLK-admin/      # Internal Store Admin Portal (Next.js 15+ App Router, TanStack, Recharts) - Port 3001
├── shiftLK-api/        # Express.js + Prisma + MySQL Backend REST API - Port 4000
├── .gitignore          # Monorepo root gitignore
└── README.md           # Monorepo documentation
```

---

## 🌐 Application Architecture & Port Mapping

| Application | Technology | Default Port | Description |
|---|---|---|---|
| **Customer Store** (`shiftLK-frontend`) | Next.js 15+ (App Router, next-intl) | **3000** | Trilingual (EN, SI, TA) customer catalogue, motorcycle compatibility filter, COD checkout & WhatsApp order confirmation. |
| **Admin Portal** (`shiftLK-admin`) | Next.js 15+ (App Router, TanStack, Recharts) | **3001** | Inventory management, live margins, stock movements audit log, order fulfillment, expense tracking, and district delivery fees. |
| **Backend REST API** (`shiftLK-api`) | Node.js + Express + Prisma + MySQL | **4000** | Multi-origin CORS, cross-domain httpOnly cookie authentication, brute-force lockout, transactional order-stock sync, analytics. |

---

## 🚀 Getting Started

### 1. Backend REST API (`shiftLK-api`)

```bash
cd shiftLK-api
npm install
# Configure your .env file
npm run db:push
npm run dev
```
*API runs at [http://localhost:4000](http://localhost:4000)*
*API Swagger Documentation at [http://localhost:4000/api/docs](http://localhost:4000/api/docs)*

To run backend test suite:
```bash
npm test
```

---

### 2. Customer Website (`shiftLK-frontend`)

```bash
cd shiftLK-frontend
npm install
# Copy .env.example to .env.local
npm run dev
```
*Customer site runs at [http://localhost:3000](http://localhost:3000)*

---

### 3. Store Admin Panel (`shiftLK-admin`)

```bash
cd shiftLK-admin
npm install
# Copy .env.example to .env.local
npm run dev
```
*Admin panel runs at [http://localhost:3001](http://localhost:3001)*

#### 🔑 Default Admin Credentials:
- **Email:** `admin@shiftlk.lk`
- **Password:** `ShiftAdmin@2026`

*(You can change the password anytime via the user profile menu inside the admin panel).*

---

## 🔐 Security & Access Control

- **HTTP-Only Cookies**: JWT tokens (`access_token`, `refresh_token`) are transmitted via httpOnly, `SameSite=Lax` cookies; no sensitive tokens in `localStorage`.
- **Brute Force Protection**: 5 failed login attempts trigger an automatic 15-minute lockout (`429 ACCOUNT_LOCKED`).
- **Timing Attack Mitigation**: Constant-time password verification using dummy bcrypt hashes.
- **Search Engine Isolation**: Admin panel emits `robots: noindex, nofollow`, and customer sitemaps strictly exclude administrative routes.
- **Stock Movement Integrity**: Order confirmation atomically decrements stock with `StockMovement` audit records; order cancellation automatically restores stock.
