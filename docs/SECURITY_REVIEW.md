# ShiftLK Spares — Security Review

**Date:** 2026-11-16
**Scope:** `backend/` (Express + Prisma API) and `frontend/` (Next.js storefront + admin)
**Type:** Static code review + dependency audit (`npm audit`). No code was changed.

---

## Summary

The project already has a solid foundation: bcrypt password hashing, HTTP-only auth cookies, Prisma (no raw SQL injection risk), server-side order pricing, `helmet`, and cost prices stripped from public product DTOs.

The issues below are the remaining gaps, ordered by priority. Each item lists **where** the problem is, **why** it matters, an example **attack scenario**, and a **recommended fix**.

| # | Issue | Severity |
|---|---|---|
| 1 | Login brute-force lockout can be bypassed | 🟠 High |
| 2 | Rate limiting broken behind a reverse proxy | 🟠 High |
| 3 | Sessions / refresh tokens cannot be revoked | 🟠 High |
| 4 | `hideProfitFromStaff` not enforced on products & orders | 🟠 High |
| 5 | Vulnerable dependencies | 🟠 High |
| 6 | Unauthenticated translation proxy | 🟡 Medium |
| 7 | Next.js image optimizer allows any host | 🟡 Medium |
| 8 | Order lookup allows order-code enumeration | 🟡 Medium |
| 9 | No size limits on order payloads | 🟡 Medium |
| 10 | Upload file type trusts the client | 🟡 Medium |
| 11 | Public media proxy serves any bucket key | 🟡 Medium |
| 12 | Missing input validation on several admin endpoints | 🟡 Medium |
| 13 | CSV export injection / broken escaping | 🟡 Medium |
| 14 | Swagger docs public in production | 🟡 Medium |
| 15 | Hardening items | 🟢 Low |

---

## 🟠 1. Login brute-force lockout can be bypassed

**Where:** `backend/src/modules/auth/auth.controller.ts` (login), `backend/src/modules/auth/auth.service.ts`

**Problem:**
- The client IP used for the lockout key is taken from the `X-Forwarded-For` header, which **the client controls**:
  ```ts
  (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || req.ip ...
  ```
- The lockout key is `IP + email`. An attacker sending a different fake `X-Forwarded-For` value per request gets a fresh counter every time, so the lock never triggers.
- The lockout store is an in-memory `Map`: it is wiped on every restart/deploy and not shared between multiple server instances.
- The same spoofable IP is written to audit logs, so audit IPs can't be trusted either.

**Attack scenario:** An attacker scripts password guesses against `admin@shiftlk.lk`, rotating the `X-Forwarded-For` header. The only remaining limit is `authLimiter` (30 / 10 min per real IP), which is easily spread across a few IPs.

**Recommended fix:**
1. Configure Express to trust exactly the proxy in front of it, then use `req.ip` everywhere (see #2):
   ```ts
   app.set('trust proxy', 1); // or the specific proxy IPs / 'loopback'
   ```
2. Add a **per-account** lockout (independent of IP), e.g. after 10 failures in 15 min lock that account for some minutes, or require increasing delays.
3. Persist lockout counters in the DB (e.g. `failedLoginCount`, `lockedUntil` on `User`) or Redis.
4. Use the same trusted `req.ip` in audit logs.

## 🟠 2. Rate limiting broken behind a reverse proxy

**Where:** `backend/src/app.ts`, `backend/src/middlewares/rateLimiter.ts`

**Problem:** `trust proxy` is not set. When deployed behind Cloudflare, Nginx, a load balancer, or the Next.js rewrite (`/api/v1/*` → backend), `req.ip` is the **proxy's** IP for every visitor. All customers then share a single rate-limit bucket.

**Impact:**
- `orderPlacementLimiter` (15 per 15 min) would block **all** customers after 15 orders store-wide — a self-inflicted denial of service.
- Conversely, limits become meaningless for distinguishing attackers.

**Recommended fix:**
- Set `app.set('trust proxy', …)` to match the real deployment topology (number of hops or proxy IP list). Do **not** use `true` blindly, or `X-Forwarded-For` becomes spoofable again.
- If traffic goes through the Next.js rewrite, make sure the original client IP is forwarded (or call the API directly from the browser).
- If running more than one API instance, use a shared store for `express-rate-limit` (e.g. `rate-limit-redis`).

## 🟠 3. Sessions / refresh tokens cannot be revoked

**Where:** `backend/src/modules/auth/auth.service.ts`, `auth.controller.ts`

**Problem:**
- Refresh tokens are stateless JWTs valid for 7 days and are not stored anywhere.
- `logout` only clears cookies in the browser; the token itself remains valid.
- `changePassword`, admin `resetPassword`, and deactivating a user do **not** invalidate existing tokens. (Refresh does check `isActive`, which helps for deactivation, but not for password changes.)
- Access tokens (15 min) are never re-checked against the DB, so a deactivated user keeps access for up to 15 minutes.

**Attack scenario:** An admin's refresh token is stolen (e.g. shared computer, malware). The admin notices and changes the password — the attacker can still mint new access tokens for up to 7 days.

**Recommended fix:**
- Store refresh tokens (hashed) in a `RefreshToken` / `Session` table with `userId`, `expiresAt`, `revokedAt`.
- **Rotate** on every `/refresh`: issue a new refresh token, revoke the old one. If a revoked token is reused, revoke the whole session family (token theft detection).
- On logout → revoke that session. On password change/reset or deactivation → revoke all sessions for the user.
- Alternative lightweight approach: add a `tokenVersion` integer on `User`, include it in JWTs, and increment it on password change/logout-all; reject tokens with an old version.

## 🟠 4. `hideProfitFromStaff` not enforced on products & orders

**Where:**
- Enforced: `backend/src/modules/analytics/analytics.service.ts` (`shouldHideProfitForUser`)
- **Not enforced:** `backend/src/modules/products/admin.products.controller.ts`, `backend/src/modules/orders/admin.orders.controller.ts`

**Problem:** When the admin enables "hide profit from staff", STAFF users still receive:
- `costPrice`, `profitMarginPercent`, `profitPerUnit` from product list/detail endpoints
- `totalStockValueAtCost`, `expectedProfitIfAllSold` from `/admin/products/stock/overview`
- `costPrice` column in `/admin/products/export-csv`
- `unitCost` per order item from `/admin/orders` and `/admin/orders/:id`
- Cost price in the `restock` response

Hiding it in the UI is not enough — STAFF can read it in browser DevTools.

**Recommended fix:** Create one shared helper (e.g. `shouldHideProfit(req.user.role)`) and apply it in a serializer for every admin product/order response. Strip the fields server-side, and consider making `export-csv` ADMIN-only or omitting cost columns for STAFF.

## 🟠 5. Vulnerable dependencies

Output of `npm audit --omit=dev`:

| Project | Package | Severity | Notes |
|---|---|---|---|
| backend | `tar` (via `bcrypt` → `@mapbox/node-pre-gyp`) | Critical | Mostly install-time; fix by upgrading `bcrypt` (v6) or switching to `bcryptjs` / `argon2` |
| backend | `body-parser` (via `express`) | High | Upgrade `express` to latest 4.x |
| backend | `zod` < 4.6.6 | High | Memory exhaustion on oversized collections — breaking upgrade to v4 |
| frontend | `zod` < 4.6.6 | High | Same as above |

**Recommended fix:** Run `npm audit fix` in both projects, then plan the `zod` v3 → v4 migration (API changes, needs testing). Add `npm audit` (or Dependabot / Renovate) to CI.

---

## 🟡 6. Unauthenticated translation proxy

**Where:** `frontend/src/app/api/translate/route.ts`

**Problem:** `POST /api/translate` needs no login and has no input length limit or rate limit. It forwards any text to the unofficial Google Translate endpoint (twice per request).

**Impact:** Anyone on the internet can use the server as a free translation proxy. Google may rate-limit or block the server IP, breaking the feature for admins, and it adds outbound load.

**Recommended fix:** This is only used from the admin product editor, so:
- Require a valid admin session (verify the `access_token` cookie, or move the endpoint into the backend under `/api/v1/admin/...` with `requireAuth`).
- Cap input length (e.g. 2,000 chars) and add a rate limit.

## 🟡 7. Next.js image optimizer allows any host

**Where:** `frontend/next.config.ts` → `images.remotePatterns`

**Problem:** `{ protocol: "https", hostname: "**" }` lets `/_next/image?url=...` fetch and resize images from **any** HTTPS site.

**Impact:** Attackers can use the server as an open image proxy, consuming CPU, memory, bandwidth, and cache storage (cost / DoS). It also makes the server fetch arbitrary URLs.

**Recommended fix:** Restrict to the actual media hosts:
```ts
remotePatterns: [
  { protocol: 'https', hostname: 'media.shiftlk.lk' },
  { protocol: 'https', hostname: 'pub-<id>.r2.dev' },
],
```
Keep the `localhost` entries only in development.

## 🟡 8. Order lookup allows order-code enumeration

**Where:** `backend/src/modules/orders/orders.service.ts` → `getOrderByCodeAndPhone`, `backend/src/utils/orderCode.ts`

**Problem:**
- Order codes are sequential and predictable (`SLK-000125`, `SLK-000126`, …).
- The lookup returns `404 ORDER_NOT_FOUND` when the code doesn't exist but `403 PHONE_MISMATCH` when it exists with a different phone. This tells an attacker which codes are real.
- A successful lookup returns the customer's **name, phone, and full address** (personal data).

**Attack scenario:** An attacker enumerates valid codes, then focuses phone-number guessing on them, spreading requests across IPs to bypass the 30 / 15 min limit.

**Recommended fix:**
- Return the **same** generic error (e.g. `404 "Order not found or phone does not match"`) for both cases.
- Add a random component to the public tracking code (e.g. `SLK-000125-7KQ2`) or use a separate random tracking token.
- Consider masking the address/phone in the public response (e.g. show only district and last 3 digits of phone).
- Add a per-order-code failed-attempt limit.

## 🟡 9. No size limits on order payloads

**Where:** `backend/src/modules/orders/orders.schema.ts`, `orders.service.ts`

**Problem:**
- `items` has `.min(1)` but no `.max()`; `qty` has no maximum. Each item triggers a separate DB query, so one request with thousands of items creates thousands of queries.
- `phone`, `district`, and `productId` have no `.max()` length.
- The global JSON body limit is `10mb` (`app.ts`), which is far more than any order needs.
- Duplicate `productId` entries are each checked against stock separately.

**Recommended fix:**
```ts
items: z.array(...).min(1).max(50),
qty: z.coerce.number().int().min(1).max(100),
phone: z.string().min(9).max(20),
district: z.string().min(2).max(50),
productId: z.string().min(1).max(50),
```
- Merge duplicate product IDs before checking stock, and fetch all products in one `findMany`.
- Lower `express.json({ limit })` to e.g. `100kb` globally (uploads use multer, which has its own limits).

## 🟡 10. Upload file type trusts the client

**Where:** `backend/src/modules/uploads/uploads.controller.ts`

**Problem:**
- `fileFilter` checks `file.mimetype`, which is the value **sent by the client**, not the real file type.
- The stored extension comes from the uploaded filename (`getCleanExtension(originalname)`) with no allowlist, so a file named `payload.html` declared as `image/png` is accepted and stored as `.html`.
- The presigned URL endpoint has the same extension issue.

**Impact:** Arbitrary file content can be hosted on the media domain. Combined with any content-type misconfiguration on the CDN, this could enable stored XSS or phishing pages hosted under the ShiftLK domain.

**Recommended fix:**
- Detect the real type from the file bytes (e.g. the `file-type` package) and reject anything that isn't JPEG/PNG/WEBP/GIF/AVIF.
- Derive the extension **from the verified MIME type**, never from the filename.
- Optionally re-encode images with `sharp` (also strips EXIF metadata such as GPS location).
- Restrict the `folder` parameter to an allowlist (e.g. `products`, `brands`, `categories`).

## 🟡 11. Public media proxy serves any bucket key

**Where:** `backend/src/modules/uploads/uploads.routes.ts` → `GET /api/v1/media/*`

**Problem:** Any object key in the R2 bucket can be read without authentication through the backend proxy, and the response gets `Access-Control-Allow-Origin: *`. The content type is taken from object metadata.

**Impact:** Safe today only if nothing private is ever stored in the bucket. If backups, invoices, or exports are added to the same bucket later, they would become public.

**Recommended fix:**
- Allow only known public prefixes (`products/`, `brands/`, `categories/`) and image content types.
- Add `X-Content-Type-Options: nosniff` and `Content-Disposition: inline` with a safe filename.
- Keep any private files in a **separate** bucket.

## 🟡 12. Missing input validation on several admin endpoints

**Where:**
- `backend/src/modules/settings/settings.routes.ts` — `PUT /admin/settings`, `PUT /admin/settings/delivery-zones/:id`
- `backend/src/modules/products/admin.products.routes.ts` — `POST /bulk`, `POST /:id/restock`, `PATCH /:id/stock`
- `backend/src/modules/uploads/uploads.routes.ts` — `presigned-url`, `DELETE /admin/uploads`

**Problem:** These handlers read `req.body` directly without a zod schema. Examples:
- A delivery zone `baseFee` can be set negative or to a non-number, producing wrong order totals.
- `whatsappNumber` can be set to any string (it is used to build the customer WhatsApp link — could redirect customer orders to someone else's number if an admin account is compromised or misused).
- `restock` accepts `quantity: 1e12`.

**Recommended fix:** Add zod schemas with types, ranges, and max lengths for every admin write endpoint, consistent with the rest of the codebase (`validateBody(...)`). Validate `whatsappNumber` with the existing Sri Lankan phone validator.

## 🟡 13. CSV export injection / broken escaping

**Where:** `backend/src/modules/products/admin.products.controller.ts` → `exportProductsCsv`

**Problem:**
- Only `name_en` has quotes escaped; `slug`, `partNumber`, and `brand.name` are inserted raw, so a `"` or newline in those fields breaks the CSV.
- Values starting with `=`, `+`, `-`, `@` are executed as formulas when opened in Excel/Google Sheets (CSV / formula injection). A STAFF user could craft a product name that runs a formula on the ADMIN's machine.

**Recommended fix:** Use one escape helper for every field:
```ts
function csvCell(v: unknown) {
  let s = String(v ?? '');
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}
```
Also see #4 regarding cost price in this export for STAFF.

## 🟡 14. Swagger docs public in production

**Where:** `backend/src/app.ts` → `app.use('/api/docs', ...)`

**Problem:** The full API map (including all admin endpoints) is publicly browsable, which helps attackers plan attacks. Helmet's CSP is also disabled globally just to support Swagger.

**Recommended fix:** Only mount Swagger when `NODE_ENV !== 'production'` (or behind admin auth), and re-enable `contentSecurityPolicy` for the API.

---

## 🟢 15. Hardening items (low priority)

1. **Access token in response body** — `login` and `refresh` return `accessToken` in JSON in addition to the HTTP-only cookie. If the frontend doesn't need it, remove it so it can't be stolen by XSS.
2. **CSRF** — protection relies only on `SameSite=Lax`. CORS also trusts **every** `*.shiftlk.lk` subdomain with credentials. If any subdomain is ever compromised or taken over, it could make authenticated admin requests. Restrict CORS to an explicit list of origins and consider a CSRF token or checking the `Origin` header on state-changing admin requests.
3. **Password policy** — minimum 8 chars (6 at login schema). Recommend ≥ 10–12 chars and checking against breached passwords (e.g. Have I Been Pwned k-anonymity API). Consider optional 2FA (TOTP) for ADMIN accounts.
4. **Frontend security headers** — no CSP, `X-Frame-Options` / `frame-ancestors`, `Strict-Transport-Security`, `Referrer-Policy`, or `Permissions-Policy`. Add them via `headers()` in `next.config.ts`. At minimum, prevent `/admin` from being framed (clickjacking).
5. **Error message leakage** —
   - `frontend/src/app/api/orders/route.ts` returns raw `err.message` to clients on 500.
   - Backend `errorHandler` shows internal error messages unless `NODE_ENV === 'production'`; make sure production always sets it.
   - `INSUFFICIENT_STOCK` reveals exact stock counts (minor business info).
6. **Login is limited to ADMIN/STAFF, but route guards mention `SUPER_ADMIN`** — harmless, but the role list is inconsistent; clean up to avoid future authorization mistakes.
7. **Docker** — `docker-compose.yml` publishes MySQL `3306` to the host. In production, don't expose the DB port; keep it on the internal Docker network. The API container also runs as root — add `USER node` in the `Dockerfile`.
8. **Logging** — `pino-http` logs full request objects by default; make sure cookies and `Authorization` headers are redacted (`redact: ['req.headers.cookie', 'req.headers.authorization']`).
9. **Audit log of failed logins** stores the attempted email as `entityId`; fine, but combined with #1 the IP isn't trustworthy until fixed.

---

## ✅ Things already done well

- Passwords hashed with **bcrypt**; login uses a dummy hash to reduce user-enumeration timing differences.
- Auth cookies are **HTTP-only**, `SameSite=Lax`, and `Secure` in production.
- **Prisma** used throughout — no unsafe raw SQL (`$queryRawUnsafe`) found.
- Order totals and delivery fees are **calculated server-side**; client prices are never trusted.
- Public product DTO (`toPublicProductDto`) correctly **excludes cost price**.
- `helmet` enabled; global and per-route rate limiters exist.
- Admin login redirect only allows `/admin/...` paths (no open redirect).
- `robots.ts` disallows `/admin` and `/api`.
- `.env` files are git-ignored and not currently tracked.
- Role-based guards (`requireAuth` + `requireRole`) are applied on every admin router.

---

## Suggested order of work

1. Fix `trust proxy` + login lockout (#1, #2)
2. Refresh token storage / revocation (#3)
3. Enforce `hideProfitFromStaff` everywhere (#4)
4. `npm audit fix` and plan the zod upgrade (#5)
5. Lock down `/api/translate` and `images.remotePatterns` (#6, #7)
6. Order lookup + payload limits (#8, #9)
7. Upload validation + media proxy restrictions (#10, #11)
8. Admin input validation, CSV export, Swagger (#12–#14)
9. Hardening items (#15)
