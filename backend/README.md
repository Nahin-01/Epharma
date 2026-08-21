# ePharmacy Backend

Production-oriented Express.js + MongoDB REST API for the ePharmacy platform: catalogue & search, prescription upload with an OCR pipeline, cart/checkout, Bangladesh payment gateways (bKash, Nagad, Rocket, SSLCommerz, cards, COD), courier/delivery tracking, a doctor directory with appointment booking, recurring orders, notifications, and a full admin/RBAC back-office. It is the single source of business logic for the React web app, the Flutter mobile app, and the admin/doctor portals — every client talks to the same versioned REST API (`/api/v1`).

## Architecture

* **Modular monolith** — one Express process, one MongoDB database, organized into self-contained modules under `src/modules/<name>/` (`*.model.js`, `*.validation.js`, `*.repository.js`, `*.service.js`, `*.controller.js`, `*.routes.js`). Simple CRUD modules build on a shared repository/service/controller factory (`src/utils/crud.factory.js`); richer modules (auth, products, inventory, prescriptions, cart, orders, payments, delivery) have bespoke business logic.
* **MongoDB + Mongoose** for all application data.
* **Redis + BullMQ** for background jobs: prescription OCR, notification delivery (SMS/in-app), order lifecycle side-effects, payment reconciliation, courier shipment creation/tracking, inventory expiry/low-stock scans, and recurring-order refill reminders. Run the worker process separately (`npm run worker`).
* **Pluggable integrations** (`src/integrations/`) — every external dependency (payment gateways, courier providers, SMS, OCR) is implemented as a swappable adapter behind a small interface, and every payment/courier adapter automatically falls back to a working **mock** implementation when its credentials are not configured, so checkout, delivery and the prescription pipeline all work end-to-end with zero external accounts.
* **Auth** — self-contained JWT auth (register/login, phone OTP login/registration, forgot/reset password, Google Sign-In) out of the box. `AUTH_STRATEGY=supabase` in `.env` switches the `authenticate` middleware to verify Supabase-issued JWTs instead, per the original architecture spec, without changing any route or controller code.
* **RBAC** — ten roles (`SUPER_ADMIN`, `ADMIN`, `INVENTORY_MANAGER`, `ORDER_MANAGER`, `PHARMACY_MANAGER`, `DOCTOR`, `CUSTOMER_SUPPORT`, `DELIVERY_MANAGER`, `REPORT_MANAGER`, `CUSTOMER`) plus a fine-grained permission system (`src/constants/permissions.js`), enforced via `requireRole`/`requirePermission` middleware.
* **Private file storage** for prescriptions — files never touch MongoDB; they're stored on disk (or a pluggable provider) and served only through short-lived HMAC-signed URLs (`GET /api/v1/files/signed`).
* **Audit log** for every sensitive action (prescription review, order status changes, payments, role/permission changes).

See `src/routes/index.js` for the full list of mounted route groups.

## Prerequisites

* Node.js 18+
* MongoDB 6+ (standalone instance is fine — no replica set required; inventory reservation uses per-document atomic updates instead of multi-document transactions)
* Redis 6+ (for background jobs)

## Setup

```bash
cd backend
cp .env.example .env       # then fill in whatever integrations you actually have credentials for
npm install
npm run seed                # optional: creates a super admin + a few sample products/categories
npm run dev                  # starts the API on http://localhost:5000
npm run worker:dev           # in a second terminal: starts the BullMQ background workers
```

The seed script prints the generated super-admin email/password (or set `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` beforehand) — change that password immediately in a real deployment.

Everything works with **no external accounts configured**: payments fall back to a mock gateway (`/api/v1/payments/mock/:transactionId/complete` completes a mock payment the way a real gateway's redirect would), courier falls back to an in-memory mock, OCR falls back to a deterministic mock extraction, and SMS falls back to logging the message instead of sending it. Fill in the real provider credentials in `.env` as they become available — no code changes needed, see `src/integrations/`.

### Docker

```bash
docker compose up --build
```

Brings up the API, the worker, MongoDB and Redis together. See `docker-compose.yml` / `Dockerfile`.

## Project layout

```
src/
  config/        env, database, redis, supabase, storage
  constants/     roles, permissions, order/prescription status machines
  middleware/    auth, role, permission, validation, upload, rate limiting, error handling
  utils/         logger, ApiError/ApiResponse, crypto, signed URLs, sanitize, audit, pagination, crud factory
  integrations/  payments/{bkash,nagad,rocket,sslcommerz,mock}, courier/{pathao,steadfast,redx,mock}, sms, ocr
  jobs/          BullMQ queues + worker.js entrypoint
  modules/       auth, users, customers, products, categories, brands, generics, inventory, warehouses,
                 suppliers, prescriptions, ocr, cart, orders, recurringOrders, coupons, payments, delivery,
                 doctors, appointments, notifications, productRequests, support, reports, admin, health
  routes/        route aggregator (mounts every module under /api/v1) + private file-serving route
  app.js         Express app (middleware, routing, error handling)
  server.js      process entrypoint
```

## Prescription workflow

`Upload → private storage → BullMQ OCR job → OCR provider → extracted text → medicine matching against the catalogue → confidence score → pharmacist review (Under Review → Verified/Needs Clarification → Accepted/Rejected) → linked order → Fulfilled`, exactly as specified. Multiple files per prescription are supported (PDF/JPG/PNG), each gets its own OCR result.

## Order workflow

Checkout reserves stock per line item across `InventoryBatch` documents using FEFO (first-expiry-first-out) with atomic single-document updates (safe under concurrent checkouts without needing a replica set). Reservations are committed (stock actually deducted) when an order is packed, released if cancelled before packing, and restocked if cancelled/returned after packing. Order status follows a validated state machine (`src/constants/orderStatus.js`); prescription-required items block the `PROCESSING` transition until the linked prescription is reviewed and accepted.

## Testing

```bash
npm test
```

Runs the pure-logic unit tests in `tests/` (Node's built-in test runner, no external services required) covering error helpers, pagination, signed URLs, sanitization, the order/prescription status machines, and more.

## A note on how this backend was verified

This code was generated in a sandboxed environment without access to the public npm registry, so `npm install` could not be run here to do a live, real-dependency boot test. To still catch wiring mistakes before handing this over, every file was (1) syntax-checked individually, (2) statically audited so every local `require(...)` path resolves to a real file, and (3) boot-tested end-to-end against small hand-written stand-ins for Express/Mongoose/JWT/Joi that replicate their real request-handling semantics closely enough to register every route, run requests through the full middleware chain, and exercise auth, RBAC, validation, and error handling live over HTTP. That process caught and fixed real issues before delivery. It is not a substitute for running the real test suite against a real MongoDB — do that too (`npm install && npm run seed && npm run dev`) before deploying.

## Security notes

* `.env` is git-ignored; only `.env.example` (placeholders) is committed.
* Helmet, CORS allow-list, rate limiting, request sanitization (strips `$`-operators/prototype-polluting keys from `body`/`query`/`params`), Joi validation on every mutating endpoint.
* Passwords hashed with bcrypt; JWT access/refresh tokens with a `tokenVersion` claim so logout/password-change can invalidate all outstanding sessions.
* Prescription files are private by default and only reachable via short-lived signed URLs; every access is written to the audit log.
* Payment/courier webhook handlers verify with the gateway before trusting a status change.
