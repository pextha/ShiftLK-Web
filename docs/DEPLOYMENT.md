# ShiftLK Spares — Deployment Guide (Namecheap cPanel)

This guide explains how to deploy **both** the Next.js frontend and the Express backend as **Node.js apps on Namecheap shared hosting (cPanel)**, with the database on Namecheap's MySQL server and media on Cloudflare R2. It ends with a GitHub Actions CI/CD workflow that deploys automatically on every push to `main`.

> Replace these placeholders everywhere in this guide:
>
> | Placeholder | Meaning | Example |
> |---|---|---|
> | `CPUSER` | Your cPanel username | `shiftlkab` |
> | `shiftlk.lk` | Your main domain | `shiftlk.lk` |
> | `api.shiftlk.lk` | Backend subdomain | `api.shiftlk.lk` |
> | `SERVER_HOST` | Server hostname from Namecheap welcome email | `server123.web-hosting.com` |

---

## Table of contents

1. [Architecture](#1-architecture)
2. [Before you start — hosting checklist](#2-before-you-start--hosting-checklist)
3. [Required code changes before first deploy](#3-required-code-changes-before-first-deploy)
4. [Create the MySQL database](#4-create-the-mysql-database)
5. [Create the subdomain & SSL](#5-create-the-subdomain--ssl)
6. [Enable SSH access](#6-enable-ssh-access)
7. [Deploy the backend (Node.js app)](#7-deploy-the-backend-nodejs-app)
8. [Deploy the frontend (Node.js app)](#8-deploy-the-frontend-nodejs-app)
9. [Initialize the database (migrations & admin user)](#9-initialize-the-database-migrations--admin-user)
10. [Verify the deployment](#10-verify-the-deployment)
11. [CI/CD with GitHub Actions](#11-cicd-with-github-actions)
12. [Day-to-day operations](#12-day-to-day-operations)
13. [Troubleshooting](#13-troubleshooting)
14. [Security checklist for production](#14-security-checklist-for-production)

---

## 1. Architecture

```
                         Browser
                 ┌──────────┴───────────┐
                 ▼                      ▼
     https://shiftlk.lk        https://api.shiftlk.lk
   ┌─────────────────────┐   ┌──────────────────────┐
   │ Node.js App #1      │   │ Node.js App #2       │
   │ Next.js (standalone)│──▶│ Express + Prisma     │
   │ ~/shiftlk-web       │   │ ~/shiftlk-api        │
   └─────────────────────┘   └──────────┬───────────┘
                                        │
                     ┌──────────────────┴──────────────┐
                     ▼                                 ▼
            Namecheap MySQL (localhost)        Cloudflare R2 (media)
            CPUSER_shiftlk                     media.shiftlk.lk
```

- Both apps run under cPanel **Setup Node.js App** (CloudLinux + Phusion Passenger). Passenger starts the app, assigns the port, and restarts it when needed.
- The admin login cookie is set by `api.shiftlk.lk` with `Domain=.shiftlk.lk` so the frontend middleware on `shiftlk.lk` can see it.
- **Builds happen on GitHub Actions (or your laptop), never on the server.** Shared hosting has low CPU/RAM limits and `next build` will usually be killed.

---

## 2. Before you start — hosting checklist

| Item | Why | Where |
|---|---|---|
| Node.js **20.x or 22.x** available | Next.js 16 needs Node ≥ 20.9 | cPanel → *Setup Node.js App* → version dropdown |
| SSH access enabled | Needed for `npm ci`, migrations, restarts, and CI/CD | Namecheap support chat (disabled by default on shared plans) |
| Domain DNS pointed to Namecheap hosting | Site must resolve to the server | Domain → Nameservers / DNS |
| Cloudflare R2 bucket + **rotated** API token | Media storage | Cloudflare dashboard |
| Plan resources | Two Node apps on **Stellar** may hit memory/process limits under load | Consider **Stellar Plus / Business** if you see 503 / "Resource limit reached" |

> **Note on Cloudflare DNS:** If the domain uses Cloudflare as DNS/proxy, set SSL mode to **Full (strict)** and make sure AutoSSL on cPanel can still issue certificates (or use a Cloudflare Origin Certificate).

---

## 3. Required code changes before first deploy

These changes are needed for this hosting setup. Make them in a branch, test locally, then merge.

### 3.1 Frontend — enable standalone output

`frontend/next.config.ts`:

```ts
import path from "path";

const nextConfig: NextConfig = {
  output: "standalone",
  // Prevents Next from picking the monorepo root as the tracing root
  outputFileTracingRoot: path.join(__dirname),
  // ...existing config
};
```

`standalone` produces a small self-contained server (`.next/standalone/server.js`) with only the `node_modules` it needs — ideal for uploading to shared hosting.

Also restrict `images.remotePatterns` to your real media hosts (see `SECURITY_REVIEW.md` #7).

### 3.2 Backend — remove the monorepo self-dependency

`backend/package.json` contains:

```json
"shiftlk-monorepo": "file:..",
```

On the server, the backend folder is deployed **alone**, so `npm ci` will fail trying to resolve `..`. Remove this line and regenerate `package-lock.json` (`npm install` in `backend/`).

### 3.3 Backend — make Prisma CLI available in production

`prisma migrate deploy` and `prisma generate` must run on the server. Move `prisma` from `devDependencies` to `dependencies` in `backend/package.json`.

### 3.4 Backend — Prisma engine for the server OS

Namecheap shared servers run CloudLinux (RHEL-based). The Prisma query engine must match the server's OpenSSL. After SSH is enabled, run:

```bash
openssl version
```

Then add the matching target in `backend/prisma/schema.prisma`:

```prisma
generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "rhel-openssl-1.1.x"]  // use 1.0.x / 1.1.x / 3.0.x to match `openssl version`
}
```

### 3.5 Backend — trust the hosting proxy

Passenger/Apache sits in front of the app. Add to `backend/src/app.ts` right after `const app = express();`:

```ts
app.set('trust proxy', 1);
```

Without this, rate limiting treats every visitor as the same IP and secure cookies may misbehave (see `SECURITY_REVIEW.md` #1 and #2).

### 3.6 Backend — check migrations are in sync

The repo has one migration (`20261022000000_init`) but the project has also used `prisma db push`. Before production, confirm the migration matches `schema.prisma`:

```bash
cd backend
npx prisma migrate diff \
  --from-migrations prisma/migrations \
  --to-schema-datamodel prisma/schema.prisma \
  --shadow-database-url "mysql://root:password@localhost:3306/shadow_db"
```

If it prints any SQL, create a new migration locally (`npx prisma migrate dev --name sync_schema`) and commit it. Production must use **`prisma migrate deploy`**, never `db push`.

### 3.7 Recommended (from the security review)

- Disable Swagger (`/api/docs`) when `NODE_ENV === 'production'`.
- Remove default fallbacks for `INITIAL_ADMIN_PASSWORD` and JWT secrets.

---

## 4. Create the MySQL database

1. cPanel → **MySQL® Databases**.
2. **Create New Database:** `shiftlk` → cPanel names it `CPUSER_shiftlk`.
3. **Add New User:** `shiftlk` → becomes `CPUSER_shiftlk`. Use the password generator (long, random). Save it in a password manager.
4. **Add User to Database** → select both → tick **ALL PRIVILEGES** → *Make Changes*.
5. (Optional) cPanel → **phpMyAdmin** → select the DB → *Operations* → set collation to `utf8mb4_unicode_ci`.

Your connection string:

```
DATABASE_URL="mysql://CPUSER_shiftlk:PASSWORD@localhost:3306/CPUSER_shiftlk?charset=utf8mb4"
```

> If the password contains special characters (`@ : / ? # %`), **URL-encode** them (e.g. `@` → `%40`), or generate one with only letters and numbers.
>
> Namecheap may run **MariaDB** instead of MySQL. Prisma's `mysql` provider works with MariaDB 10.x; check the version in phpMyAdmin.

---

## 5. Create the subdomain & SSL

1. cPanel → **Domains** (or *Subdomains*) → create `api.shiftlk.lk`. Let cPanel choose its document root (e.g. `~/api.shiftlk.lk`).
2. cPanel → **SSL/TLS Status** → *Run AutoSSL* → confirm both `shiftlk.lk` and `api.shiftlk.lk` show a valid certificate.
3. Force HTTPS: cPanel → **Domains** → toggle *Force HTTPS Redirect* for both.

---

## 6. Enable SSH access

1. Ask Namecheap support to enable SSH for your account.
2. SSH details: host `SERVER_HOST`, port **`21098`**, user `CPUSER`.
3. Set up key-based login (needed for CI/CD):

   ```bash
   # On your computer
   ssh-keygen -t ed25519 -C "shiftlk-deploy" -f ~/.ssh/shiftlk_deploy
   ```

   cPanel → **SSH Access** → *Manage SSH Keys* → *Import Key* → paste the contents of `shiftlk_deploy.pub` → then click **Manage → Authorize**.

4. Test:

   ```bash
   ssh -i ~/.ssh/shiftlk_deploy -p 21098 CPUSER@SERVER_HOST
   ```

> If you get a host key algorithm error with newer OpenSSH, add to `~/.ssh/config`:
> ```
> Host SERVER_HOST
>   Port 21098
>   HostKeyAlgorithms +ssh-rsa
>   PubkeyAcceptedAlgorithms +ssh-rsa
> ```

---

## 7. Deploy the backend (Node.js app)

### 7.1 Create the app in cPanel

cPanel → **Setup Node.js App** → **Create Application**:

| Field | Value |
|---|---|
| Node.js version | `20.x` (or `22.x`) |
| Application mode | `Production` |
| Application root | `shiftlk-api` |
| Application URL | `api.shiftlk.lk` |
| Application startup file | `dist/server.js` |

Click **Create**. cPanel creates `~/shiftlk-api` and a virtual environment. At the top of the app page it shows a command like:

```bash
source /home/CPUSER/nodevenv/shiftlk-api/20/bin/activate && cd /home/CPUSER/shiftlk-api
```

**Copy this command** — you'll use it over SSH and in CI/CD.

### 7.2 Environment variables

In the same app page → **Environment variables** → add:

| Name | Value |
|---|---|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | `mysql://CPUSER_shiftlk:PASSWORD@localhost:3306/CPUSER_shiftlk?charset=utf8mb4` |
| `FRONTEND_ORIGIN` | `https://shiftlk.lk` |
| `ADMIN_ORIGIN` | `https://shiftlk.lk` |
| `COOKIE_DOMAIN` | `.shiftlk.lk` |
| `JWT_SECRET` | 64+ random hex chars (`node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`) |
| `JWT_REFRESH_SECRET` | a **different** 64+ random hex string |
| `JWT_ACCESS_EXPIRES_IN` | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | `7d` |
| `LOCKOUT_MAX_ATTEMPTS` | `5` |
| `LOCKOUT_MINUTES` | `10` |
| `MAX_FILE_SIZE_MB` | `5` |
| `R2_ACCOUNT_ID` | from Cloudflare |
| `R2_ACCESS_KEY_ID` | from Cloudflare (new rotated token) |
| `R2_SECRET_ACCESS_KEY` | from Cloudflare (new rotated token) |
| `R2_BUCKET_NAME` | your bucket |
| `R2_PUBLIC_DOMAIN` | e.g. `https://media.shiftlk.lk` |

> Don't set `PORT` — Passenger handles it.
> Don't put a `.env` file in the repo. Variables set here are stored only on the server.

### 7.3 Build and upload (first time, manually)

On your computer:

```bash
cd backend
npm ci
npx prisma generate
npm run build            # outputs dist/
```

Upload to `~/shiftlk-api` (via SFTP/rsync, **not** plain FTP):

```
shiftlk-api/
├── dist/
├── prisma/              # schema.prisma + migrations/
├── package.json
└── package-lock.json
```

> **Do not upload `node_modules`.** CloudLinux keeps dependencies in the virtual environment and symlinks `node_modules` for you.

Example with rsync:

```bash
rsync -avz -e "ssh -i ~/.ssh/shiftlk_deploy -p 21098" \
  dist prisma package.json package-lock.json \
  CPUSER@SERVER_HOST:~/shiftlk-api/
```

### 7.4 Install dependencies & start

Over SSH:

```bash
source /home/CPUSER/nodevenv/shiftlk-api/20/bin/activate && cd /home/CPUSER/shiftlk-api
npm ci --omit=dev
npx prisma generate
```

(You can also click **Run NPM Install** in cPanel, but SSH shows errors more clearly.)

Then in cPanel click **Restart** on the app (or `touch tmp/restart.txt` — see §12).

---

## 8. Deploy the frontend (Node.js app)

### 8.1 Create the app in cPanel

cPanel → **Setup Node.js App** → **Create Application**:

| Field | Value |
|---|---|
| Node.js version | same as backend |
| Application mode | `Production` |
| Application root | `shiftlk-web` |
| Application URL | `shiftlk.lk` |
| Application startup file | `server.js` |

> The application root must **not** be `public_html`. Use `shiftlk-web`.

### 8.2 Environment variables (runtime)

| Name | Value |
|---|---|
| `NODE_ENV` | `production` |
| `HOSTNAME` | `0.0.0.0` |
| `NEXT_PUBLIC_SITE_URL` | `https://shiftlk.lk` |
| `NEXT_PUBLIC_API_URL` | `https://api.shiftlk.lk/api/v1` |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | `947XXXXXXXX` |
| `NEXT_PUBLIC_ADMIN_URL` | `https://shiftlk.lk/admin` |

> ⚠️ **`NEXT_PUBLIC_*` variables are baked in at build time.** They must also be set when running `next build` (locally or in GitHub Actions). Setting them only in cPanel is not enough. The `/api/v1` rewrite in `next.config.ts` is also computed at build time.

### 8.3 Build and upload (first time, manually)

On your computer:

```bash
cd frontend
npm ci

NEXT_PUBLIC_SITE_URL=https://shiftlk.lk \
NEXT_PUBLIC_API_URL=https://api.shiftlk.lk/api/v1 \
NEXT_PUBLIC_WHATSAPP_NUMBER=947XXXXXXXX \
NEXT_PUBLIC_ADMIN_URL=https://shiftlk.lk/admin \
npm run build

# Assemble the standalone bundle
cp -r public .next/standalone/
mkdir -p .next/standalone/.next
cp -r .next/static .next/standalone/.next/
```

Check that `.next/standalone/server.js` exists. (If it's at `.next/standalone/frontend/server.js`, the tracing root wasn't set — see §3.1.)

Upload the **contents** of `.next/standalone/` to `~/shiftlk-web`:

```bash
rsync -avz --delete --exclude 'tmp/' \
  -e "ssh -i ~/.ssh/shiftlk_deploy -p 21098" \
  .next/standalone/ CPUSER@SERVER_HOST:~/shiftlk-web/
```

Resulting layout:

```
shiftlk-web/
├── server.js
├── package.json
├── node_modules/        # bundled by Next standalone (do NOT run npm install here)
├── public/
└── .next/
    ├── static/
    └── server/ ...
```

> **Do not click "Run NPM Install" for the frontend.** The standalone build already contains its dependencies.

Restart the app in cPanel.

---

## 9. Initialize the database (migrations & admin user)

### 9.1 Run migrations (every deploy that changes the schema)

Over SSH:

```bash
source /home/CPUSER/nodevenv/shiftlk-api/20/bin/activate && cd /home/CPUSER/shiftlk-api
npx prisma migrate deploy
```

### 9.2 Create the first admin user (one time only)

`prisma/seed.ts` runs with `tsx` (a dev tool) and also inserts **sample categories, brands, delivery zones, and demo products**. Options:

**Option A — run the seed from your computer through Remote MySQL (simplest):**

1. cPanel → **Remote MySQL®** → add **your current public IP**.
2. On your computer:
   ```bash
   cd backend
   DATABASE_URL="mysql://CPUSER_shiftlk:PASSWORD@SERVER_HOST:3306/CPUSER_shiftlk?charset=utf8mb4" \
   INITIAL_ADMIN_EMAIL="owner@yourdomain.lk" \
   INITIAL_ADMIN_PASSWORD="<strong unique password>" \
   INITIAL_ADMIN_NAME="Store Owner" \
   npm run prisma:seed
   ```
3. **Remove your IP from Remote MySQL** afterwards.

**Option B —** write a small production seed that creates only the admin user, order counter, and delivery zones (no demo products), compile it, and run it once over SSH.

> ⚠️ **Never re-run the seed on production.** The admin `upsert` **resets the admin password** and re-activates the account. Delete demo products after seeding if you don't want them live.
>
> ⚠️ **Never run `npm run db:clear` on production** — it deletes all orders, order items, and stock movements.

After the first login, change the admin password from the admin panel.

---

## 10. Verify the deployment

| Check | Expected |
|---|---|
| `https://api.shiftlk.lk/health` | `{"status":"healthy",...}` |
| `https://api.shiftlk.lk/api/v1/products` | JSON list of products (no `cost_price`) |
| `https://shiftlk.lk` | Storefront loads, redirects to locale if needed |
| `https://shiftlk.lk/si`, `/ta` | Sinhala/Tamil pages render with correct fonts |
| `https://shiftlk.lk/robots.txt` | Disallows `/admin` and `/api/` |
| `https://shiftlk.lk/admin` | Redirects to `/admin/login` |
| Log in → `/admin/dashboard` | Dashboard loads; no redirect loop |
| Browser DevTools → Cookies | `access_token` has `HttpOnly`, `Secure`, `Domain=.shiftlk.lk` |
| Upload a product image | Image appears with the R2 public URL |
| Place a test order | Order appears in `/admin/orders` as `PENDING` |

---

## 11. CI/CD with GitHub Actions

### 11.1 How it works

```
push to main
  ├─ test      → install backend deps, start MySQL service, run Vitest
  ├─ deploy-api (needs: test)
  │     build backend → rsync to ~/shiftlk-api → SSH: npm ci, prisma generate,
  │     prisma migrate deploy → restart
  └─ deploy-web (needs: deploy-api)
        build Next.js standalone → rsync to ~/shiftlk-web → restart
```

### 11.2 GitHub repository secrets & variables

Repo → **Settings → Secrets and variables → Actions**.

**Secrets:**

| Name | Value |
|---|---|
| `SSH_HOST` | `SERVER_HOST` |
| `SSH_USER` | `CPUSER` |
| `SSH_PORT` | `21098` |
| `SSH_PRIVATE_KEY` | contents of `~/.ssh/shiftlk_deploy` (private key) |
| `SSH_KNOWN_HOSTS` | output of `ssh-keyscan -p 21098 SERVER_HOST` |

**Variables** (not secret — they end up in the public JS bundle anyway):

| Name | Value |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://shiftlk.lk` |
| `NEXT_PUBLIC_API_URL` | `https://api.shiftlk.lk/api/v1` |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | `947XXXXXXXX` |
| `NEXT_PUBLIC_ADMIN_URL` | `https://shiftlk.lk/admin` |
| `NODE_VENV_API` | `/home/CPUSER/nodevenv/shiftlk-api/20/bin/activate` |

> Runtime secrets (DB password, JWT secrets, R2 keys) stay **only** in cPanel environment variables. CI never needs them.

### 11.3 Workflow file

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Namecheap

on:
  push:
    branches: [main]
  workflow_dispatch:

concurrency:
  group: production-deploy
  cancel-in-progress: false

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: root
          MYSQL_DATABASE: shiftlk_test
        ports: ['3306:3306']
        options: >-
          --health-cmd="mysqladmin ping -h localhost -proot"
          --health-interval=5s --health-timeout=5s --health-retries=20
    env:
      NODE_ENV: test
      DATABASE_URL: mysql://root:root@127.0.0.1:3306/shiftlk_test?charset=utf8mb4
      JWT_SECRET: ci_test_jwt_secret_value_1234567890
      JWT_REFRESH_SECRET: ci_test_refresh_secret_value_1234567890
      R2_ACCOUNT_ID: test
      R2_ACCESS_KEY_ID: test
      R2_SECRET_ACCESS_KEY: test
      R2_BUCKET_NAME: test
    defaults:
      run:
        working-directory: backend
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
          cache-dependency-path: backend/package-lock.json
      - run: npm ci
      - run: npx prisma migrate deploy
      - run: npm test

  deploy-api:
    needs: test
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: backend
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
          cache-dependency-path: backend/package-lock.json

      - run: npm ci
      - run: npx prisma generate
      - run: npm run build

      - name: Set up SSH
        run: |
          mkdir -p ~/.ssh
          echo "${{ secrets.SSH_PRIVATE_KEY }}" > ~/.ssh/id_ed25519
          chmod 600 ~/.ssh/id_ed25519
          echo "${{ secrets.SSH_KNOWN_HOSTS }}" > ~/.ssh/known_hosts

      - name: Upload backend
        run: |
          rsync -az --delete \
            --exclude 'node_modules' --exclude 'tmp/' --exclude '.env' \
            -e "ssh -p ${{ secrets.SSH_PORT }}" \
            dist prisma package.json package-lock.json \
            ${{ secrets.SSH_USER }}@${{ secrets.SSH_HOST }}:~/shiftlk-api/

      - name: Install, migrate, restart
        run: |
          ssh -p ${{ secrets.SSH_PORT }} ${{ secrets.SSH_USER }}@${{ secrets.SSH_HOST }} '
            set -e
            source ${{ vars.NODE_VENV_API }}
            cd ~/shiftlk-api
            npm ci --omit=dev
            npx prisma generate
            npx prisma migrate deploy
            mkdir -p tmp && touch tmp/restart.txt
          '

      - name: Health check
        run: |
          sleep 10
          curl --fail --retry 5 --retry-delay 5 https://api.shiftlk.lk/health

  deploy-web:
    needs: deploy-api
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: frontend
    env:
      NEXT_PUBLIC_SITE_URL: ${{ vars.NEXT_PUBLIC_SITE_URL }}
      NEXT_PUBLIC_API_URL: ${{ vars.NEXT_PUBLIC_API_URL }}
      NEXT_PUBLIC_WHATSAPP_NUMBER: ${{ vars.NEXT_PUBLIC_WHATSAPP_NUMBER }}
      NEXT_PUBLIC_ADMIN_URL: ${{ vars.NEXT_PUBLIC_ADMIN_URL }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
          cache-dependency-path: frontend/package-lock.json

      - run: npm ci
      - run: npm run build

      - name: Assemble standalone bundle
        run: |
          cp -r public .next/standalone/
          mkdir -p .next/standalone/.next
          cp -r .next/static .next/standalone/.next/
          test -f .next/standalone/server.js

      - name: Set up SSH
        run: |
          mkdir -p ~/.ssh
          echo "${{ secrets.SSH_PRIVATE_KEY }}" > ~/.ssh/id_ed25519
          chmod 600 ~/.ssh/id_ed25519
          echo "${{ secrets.SSH_KNOWN_HOSTS }}" > ~/.ssh/known_hosts

      - name: Upload frontend
        run: |
          rsync -az --delete --exclude 'tmp/' \
            -e "ssh -p ${{ secrets.SSH_PORT }}" \
            .next/standalone/ \
            ${{ secrets.SSH_USER }}@${{ secrets.SSH_HOST }}:~/shiftlk-web/

      - name: Restart
        run: |
          ssh -p ${{ secrets.SSH_PORT }} ${{ secrets.SSH_USER }}@${{ secrets.SSH_HOST }} \
            'mkdir -p ~/shiftlk-web/tmp && touch ~/shiftlk-web/tmp/restart.txt'

      - name: Health check
        run: |
          sleep 10
          curl --fail --retry 5 --retry-delay 5 -o /dev/null https://shiftlk.lk/
```

### 11.4 Notes

- **If `rsync` is not available** on the server's limited shell, replace the rsync steps with `scp -r -P 21098 ...` or an SFTP action. As a last resort, `SamKirkland/FTP-Deploy-Action` with **FTPS** (`protocol: ftps`) works, but then migrations and restarts must be done manually in cPanel.
- **If integration tests need extra setup** (seed data, etc.), adjust the `test` job; to start simpler, run only unit tests with `npx vitest run tests/unit`.
- **Branch protection:** require the `test` job to pass and require PR reviews on `main`, so broken code can't deploy.
- **Brief downtime:** `rsync --delete` replaces files while the app is running; a deploy typically causes a few seconds of errors. Acceptable for a small store; for zero-downtime you'd need release folders + symlink switching.

---

## 12. Day-to-day operations

| Task | How |
|---|---|
| Restart an app | cPanel → *Setup Node.js App* → **Restart**, or SSH: `touch ~/shiftlk-api/tmp/restart.txt` |
| Change an env variable | cPanel → app → *Environment variables* → Save → **Restart** |
| View logs | `~/shiftlk-api/stderr.log` / `~/shiftlk-web/stderr.log` (Passenger), plus cPanel → **Errors** |
| Roll back | GitHub → *Actions* → re-run the deploy workflow for an earlier commit, or `git revert` and push |
| Database backup | cPanel → **Backup** → *Download a MySQL Database Backup*, or JetBackup if your plan includes it. Do this **before** every deploy with new migrations. |
| Check resource usage | cPanel → **Resource Usage** (CPU, memory, entry processes) |

---

## 13. Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| **503 / "Incomplete response received from application"** | App crashed on start. Check `stderr.log`. Common causes: missing env var (`env.ts` exits on invalid env), wrong startup file, Node version too old. |
| `Invalid environment variables` in log | A required variable (e.g. `R2_*`, `JWT_*`, `DATABASE_URL`) is missing in cPanel. |
| `PrismaClientInitializationError ... Query engine library ... not found` | `binaryTargets` doesn't match server OpenSSL (§3.4). Fix, redeploy, run `npx prisma generate` on the server. |
| `Can't reach database server at localhost:3306` | Wrong DB name/user (remember the `CPUSER_` prefix), user not added to DB, or unencoded special characters in password. |
| `npm ci` fails with `file:..` | Monorepo self-dependency still in `backend/package.json` (§3.2). |
| `Cloudlinux NodeJS Selector demands to store node modules ... in separate folder` | A real `node_modules` folder was uploaded to `shiftlk-api`. Delete it and run `npm ci` inside the virtual env. (The frontend standalone `node_modules` is expected — don't run NPM Install for the frontend.) |
| Admin login works but `/admin` keeps redirecting to login | Cookie not visible to the frontend: check `COOKIE_DOMAIN=.shiftlk.lk`, both sites on HTTPS, and you're using the custom domain. |
| `CORS blocked for origin` | `FRONTEND_ORIGIN` doesn't exactly match the site URL (scheme + host, no trailing slash). |
| Everyone gets "Too many requests" | `trust proxy` not set (§3.5). |
| Frontend shows old API URL / `localhost:4000` | `NEXT_PUBLIC_*` weren't set at **build** time (§8.2). Rebuild. |
| Images don't load | `images.remotePatterns` doesn't include the R2 domain, or `R2_PUBLIC_DOMAIN` is wrong. |
| "Resource limit reached" / slow site | Plan limits exceeded. Check *Resource Usage*; upgrade plan if it happens regularly. |

---

## 14. Security checklist for production

- [ ] R2 token rotated; old one deleted
- [ ] New strong admin password; default credentials not used anywhere
- [ ] Unique random `JWT_SECRET` and `JWT_REFRESH_SECRET` (64+ chars, different from each other)
- [ ] `NODE_ENV=production` on both apps
- [ ] HTTPS forced on both domains; AutoSSL valid
- [ ] `trust proxy` configured
- [ ] Swagger disabled in production
- [ ] `images.remotePatterns` restricted to media domains
- [ ] Remote MySQL has **no** IPs left after seeding
- [ ] SSH uses keys; deploy key is used only by GitHub Actions
- [ ] Only SFTP/FTPS used — no plain FTP accounts
- [ ] Database backups scheduled / taken before migrations
- [ ] Remaining items in `docs/SECURITY_REVIEW.md` planned
