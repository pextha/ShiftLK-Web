# ShiftLK

Fullstack Monorepo for **ShiftLK Spares** (E-commerce web application & backend API).

---

## 📁 Repository Structure

```
shiftLK-web/
├── shiftLK-frontend/       # Next.js 15+ Frontend (App Router, Tailwind/Vanilla CSS, next-intl)
├── shiftLK-api/            # Express.js + Prisma + MySQL Backend REST API
├── .gitignore              # Monorepo root gitignore
└── README.md               # Root documentation
```

---

## 🚀 Getting Started

### 1. Frontend (`shiftLK-frontend`)

```bash
cd shiftLK-frontend
npm install
npm run dev
```

The frontend will run at [http://localhost:3000](http://localhost:3000).

### 2. Backend API (`shiftLK-api`)

```bash
cd shiftLK-api
npm install
npm run dev
```

The API will run at [http://localhost:5000](http://localhost:5000).

---

## ⚙️ Environment Variables

- **Frontend**: Check [`shiftLK-frontend/.env.example`](./shiftLK-frontend/.env.example) and copy to `shiftLK-frontend/.env.local`.
- **Backend API**: Check [`shiftLK-api/.env.example`](./shiftLK-api/.env.example) and copy to `shiftLK-api/.env`.
