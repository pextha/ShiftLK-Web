# ShiftLK Motorbike Spares

Complete E-Commerce & Inventory Management Platform for **ShiftLK Spares** (Polgasowita, Sri Lanka).

---

## 📁 Repository Structure

```
shiftLK-web/
├── frontend/           # Unified Web App: Storefront & Admin Portal (Next.js 16, React 19, Tailwind v4) - Port 3000
│   ├── /               # Customer Storefront (Trilingual EN, SI, TA, WhatsApp COD checkout)
│   └── /admin          # Store Operations & Admin Dashboard (TanStack, Recharts, Inventory)
├── backend/            # Express.js + Prisma + MySQL Backend REST API - Port 4000
├── package.json        # Root monorepo manager with convenience commands
├── .gitignore          # Monorepo root gitignore
└── README.md           # Monorepo documentation
```

---

## 🌐 Application Architecture & Port Mapping

| Application | Technology | Default Port | Description |
|---|---|---|---|
| **Unified Web App** (`frontend`) | Next.js 16+ (App Router, React 19) | **3000** | **Customer Storefront** (`/`, `/si`, `/ta`) with motorbike fitment filter & COD checkout. **Admin Portal** (`/admin`) for inventory, margins, orders, and expenses. |
| **Backend REST API** (`backend`) | Node.js + Express + Prisma + MySQL | **4000** | Multi-origin CORS, httpOnly cookie authentication, brute-force lockout, transactional order-stock sync, analytics. |

---

## 🚀 Getting Started

### Quick Start (from Repository Root)

```bash
# 1. Install all dependencies across both projects
npm run install:all

# 2. Start the Backend API (Port 4000)
npm run dev:api

# 3. Start the Unified Web Application (Port 3000)
npm run dev:web
```

---

### Step-by-Step Manual Start

#### 1. Backend REST API (`backend`)

```bash
cd backend
npm install
# Configure your .env file
npm run db:push
npm run prisma:seed
npm run dev
```
*API runs at [http://localhost:4000](http://localhost:4000)*  
*API Swagger Documentation at [http://localhost:4000/api/docs](http://localhost:4000/api/docs)*

To run backend test suite:
```bash
npm test
```

---

#### 2. Unified Web Application (`frontend`)

```bash
cd frontend
npm install
# Configure your .env.local file
npm run dev
```

- **Customer Storefront:** [http://localhost:3000](http://localhost:3000)
- **Admin Portal:** [http://localhost:3000/admin](http://localhost:3000/admin)

#### 🔑 Default Admin Credentials:
- **Email:** `admin@shiftlk.lk`
- **Password:** `ShiftAdmin@2026`

---

## 🔐 Security & Access Control

- **Unified Single-Origin Auth**: Both the customer store and admin portal run on `localhost:3000`, eliminating cross-origin cookie issues with httpOnly JWT tokens (`access_token`, `refresh_token`).
- **Route Group Isolation**: The admin dashboard runs with its own isolated layout and context. Unauthenticated access to `/admin/*` automatically redirects to `/admin/login`.
- **Search Engine Isolation**: Admin routes emit `robots: noindex, nofollow`, and `robots.txt` explicitly disallows `/admin/`.
- **Brute Force Protection**: 5 failed login attempts trigger an automatic 15-minute lockout (`429 ACCOUNT_LOCKED`).
- **Timing Attack Mitigation**: Constant-time password verification using dummy bcrypt hashes.
