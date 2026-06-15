# FYP Repository & Supervisor Matching Platform

A multi-role web platform that digitises the final year project (FYP) archive
and formalises the supervisor-matching and supervision-request workflow for a
faculty, with department- and faculty-level oversight.

> Final Year Project — Department of Computer Science, Ahmadu Bello University,
> Zaria. Build brief: [`FYP_Build_Brief.md`](./FYP_Build_Brief.md).

## Modules

1. **Project Repository** — upload, moderation queue, FULLTEXT search/filter, abstract preview, controlled PDF download, duplicate-overlap advisory.
2. **Supervisor Matching** — interest-tag profiles, capacity, Jaccard keyword match score, bookmarks.
3. **Supervision Requests** — submit, one-active-request rule, accept/decline (reason on decline), transactional capacity.
4. **Role-based Dashboards** — one tailored dashboard per role, wired to live data + actions.
5. **In-app Notifications** — event-driven bell with unread count + read/unread, plus super-admin user management and faculty analytics.

Roles: **Student**, **Supervisor**, **Department Admin**, **Super Admin (Faculty)**.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (App Router) + Tailwind CSS + TypeScript |
| Backend | Laravel 13 (PHP 8.4), RESTful API |
| Database | MySQL / MariaDB (FULLTEXT search) |
| Auth | Laravel Sanctum — SPA cookie (HTTP-only session + CSRF) |
| Storage | Local private disk (`storage/app/private`), PDFs streamed via an authenticated endpoint |

## Repository layout

```
fyproject/
  backend/        # Laravel API (Dockerfile + docker/start.sh for Compose)
  frontend/       # Next.js App Router app (Dockerfile)
  docs/           # schema + ER diagram, API reference, seed-data, local setup
  scripts/        # dev-setup.sh (reproducible provisioning)
  compose.yaml    # one-command local stack (frontend + backend + MariaDB)
  FYP_Build_Brief.md
```

## Run it locally

Two ways to run the whole stack on your machine. **Docker is the easy path** —
one command, nothing to install but Docker. Use the manual path if you'd rather
run live-reloading dev servers while you work on the code. Either way, open
**http://localhost:3000** and log in with a seeded account (password `password`)
— accounts are listed in [`docs/seed-data.md`](./docs/seed-data.md). A full
step-by-step with troubleshooting is in
[`docs/local-setup.md`](./docs/local-setup.md).

### Option A — Docker (recommended)

Needs only [Docker Desktop](https://www.docker.com/products/docker-desktop/)
(Docker Engine + Compose). From the repo root:

```bash
docker compose up --build
```

This builds the frontend, backend, and a MariaDB database, applies the
migrations, and seeds demo data on the first run. Once the Laravel and Next.js
servers report ready, open http://localhost:3000.

```bash
docker compose down       # stop (your data is kept)
docker compose down -v    # stop and wipe the DB + uploads (re-seeds next time)
```

### Option B — Manual (PHP + Node + a database)

**Prerequisites**

- PHP 8.3+ (8.4 recommended) with `pdo_mysql`, `mbstring`, `openssl`, `zip`, `gd`
- Composer
- Node 20+ and npm  (required by Next.js 16)
- MySQL 8 or MariaDB 10.4+  (XAMPP and Laragon both bundle a suitable MariaDB)

**1. Database** — create the database and user (defaults match `backend/.env.example`):

```sql
CREATE DATABASE fyp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE fyp_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'fyp'@'127.0.0.1' IDENTIFIED BY 'fyp_secret';
GRANT ALL PRIVILEGES ON fyp.* TO 'fyp'@'127.0.0.1';
GRANT ALL PRIVILEGES ON fyp_test.* TO 'fyp'@'127.0.0.1';
FLUSH PRIVILEGES;
```

**2. Backend** (Laravel API → http://localhost:8000):

```bash
cd backend
cp .env.example .env
composer install
php artisan key:generate
php artisan migrate:fresh --seed
php artisan serve --host=127.0.0.1 --port=8000
```

**3. Frontend** (Next.js → http://localhost:3000) — in a second terminal:

```bash
cd frontend
cp .env.example .env.local         # sets NEXT_PUBLIC_API_URL=http://localhost:8000
npm install
npm run dev
```

## Tests

```bash
cd backend
php artisan test          # PHPUnit feature + unit (uses the fyp_test database)
```

Covers match scoring, auth/RBAC, moderation transitions, and the supervision
request state machine + one-active-request integrity rule.

## Documentation

- [`docs/local-setup.md`](./docs/local-setup.md) — step-by-step local setup (Docker + manual) and troubleshooting.
- [`docs/schema.md`](./docs/schema.md) — ER diagram + table reference.
- [`docs/api.md`](./docs/api.md) — REST endpoint reference (all modules).
- [`docs/seed-data.md`](./docs/seed-data.md) — demo accounts + seeded data.
- [`docs/testing.md`](./docs/testing.md) — test-suite summary + coverage map.
- [`docs/demo-script.md`](./docs/demo-script.md) — guided end-to-end demo.
- [`docs/security-review.md`](./docs/security-review.md) — security review + controls.

## Key design decisions (brief §12)

1. **Auth — Sanctum SPA cookie.** HTTP-only session cookie + CSRF, role resolved
   server-side. Satisfies the "JWT-in-HTTP-only-cookie" intent without hand-rolled
   tokens; `HasApiTokens` is present as a fallback.
2. **Frontend ↔ API — CORS + stateful domains.** The Next.js origin
   (`http://localhost:3000`) is allow-listed with credentials and registered in
   `SANCTUM_STATEFUL_DOMAINS`; `SESSION_DOMAIN=localhost` shares the cookie across
   ports. (Chosen over a Next.js proxy as the canonical, most reliable Sanctum SPA
   configuration.)
3. **Privileged accounts.** Super Admin and Department Admins are **seeded**;
   the Super Admin can create further admins in-app *(Phase 5)*; students and
   supervisors **self-register** and choose a department.
4. **Uploads.** `application/pdf` only, **≤ 20 MB**, stored on the private disk
   and streamed through an authenticated, permission-checked endpoint.
5. **Topic-area filter.** Derived from `project_keywords` (plus `GET /api/topics`),
   not a fixed taxonomy.

## Status

Phases 0–5 complete: auth/RBAC, repository + moderation, supervisor matching,
request workflow, role-based dashboards, and in-app notifications + super-admin
user management + faculty analytics — with seed data and a 45-test PHPUnit
suite. Phase 6 (final hardening/polish) is next.
