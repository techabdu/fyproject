# Deployment (CI/CD)

Frontend → **Vercel**, backend → a container host (**Railway** recommended;
Render works too), MySQL + a storage volume on the same host. Pushing to the
**`deploy`** branch runs CI (`.github/workflows/ci.yml`) and triggers each
platform's auto-deploy.

```
 Browser ──► Vercel (Next.js)  ──/api,/sanctum (proxy)──►  Railway (Laravel) ──► MySQL
                                                                  └─► /storage volume (PDFs)
```

The repo is already prepared: a backend `Dockerfile`, a Next.js proxy
(`next.config.ts` rewrites), trusted-proxy config, and env templates. You only
need to do the dashboard steps below.

---

## A. Backend on Railway  *(≈10 min, dashboard)*

1. **New Project → Deploy from GitHub repo** → pick `techabdu/fyproject`.
2. In the service **Settings**:
   - **Root Directory**: `backend`  (so it builds the `backend/Dockerfile`)
   - **Branch**: `deploy`  → enable **auto-deploy**.
3. **Add a MySQL database**: Project → **New → Database → MySQL**. Copy its
   connection details.
4. **Add a volume to the BACKEND service** (not MySQL — MySQL manages its own
   storage). Click your **Laravel app service → Volumes → New Volume**, mount path
   **`/app/storage`**, so uploaded PDFs survive redeploys. (`docker/start.sh`
   recreates the storage folders on boot, so an empty volume is fine.)
5. **Variables** (service → Variables) — from `backend/.env.production.example`:
   - `APP_KEY` → generate one locally with `php artisan key:generate --show`
   - `APP_ENV=production`, `APP_DEBUG=false`, `APP_URL=https://<your-railway-domain>`
   - `DB_CONNECTION=mysql`, `DB_HOST/DB_PORT/DB_DATABASE/DB_USERNAME/DB_PASSWORD`
     from the Railway MySQL plugin
   - `SESSION_DRIVER=database`, `SESSION_SECURE_COOKIE=true`, `SESSION_SAME_SITE=lax`,
     `SESSION_DOMAIN=null`
   - `SANCTUM_STATEFUL_DOMAINS=<your-vercel-domain>` (fill in after step B)
   - `FRONTEND_URL=https://<your-vercel-domain>`
   - `CACHE_STORE=database`, `QUEUE_CONNECTION=database`, `LOG_CHANNEL=stderr`
6. Railway exposes the container's port 8080 automatically and gives you a
   public URL (service → Settings → **Generate Domain**). Note it as your
   **backend URL**.
7. **Build the schema + demo data on the first deploy.** Add the variable
   **`DB_RESET_ON_DEPLOY=true`**, then redeploy. On boot the container runs
   `migrate:fresh --seed` — a clean wipe + migrate + seed. Once it's healthy,
   **remove `DB_RESET_ON_DEPLOY`** so future deploys only apply new migrations
   and never wipe your data. (Normal deploys run `migrate --force`; seeding is a
   one-time thing.)

> **Render instead?** New **Web Service** → repo → **Root Directory `backend`**,
> **Runtime: Docker**, **Branch `deploy`**; add a **MySQL** (or external) DB and a
> **Disk** mounted at `/app/storage`; set the same env vars; first deploy then run
> `php artisan db:seed --force` in the Render Shell.

## B. Frontend on Vercel  *(≈5 min, dashboard)*

1. **Add New → Project** → import `techabdu/fyproject`.
2. **Root Directory**: `frontend`.
3. **Production Branch**: `deploy`  (Settings → Git). Vercel auto-deploys it and
   builds preview deployments for PRs.
4. **Environment Variables**:
   - `BACKEND_URL` = your backend URL from A.6 (e.g. `https://fyp-backend.up.railway.app`)
   - `NEXT_PUBLIC_API_URL` = *(leave empty)* — so the client calls relative
     `/api` + `/sanctum`, which the proxy forwards to the backend.
5. Deploy. Note your Vercel domain (e.g. `https://fyproject.vercel.app`).

## C. Tie them together

1. Back in **Railway → Variables**, set `SANCTUM_STATEFUL_DOMAINS` and
   `FRONTEND_URL` to your **Vercel domain** (no scheme for stateful domains,
   e.g. `fyproject.vercel.app`). Redeploy the backend.
2. Open the Vercel URL → log in with a seeded account (password `password`).

That's it. From now on: **push to `deploy` → GitHub Actions runs the tests/build
→ Vercel + Railway redeploy automatically.**

> Want CI to *gate* the deploy? In Vercel: Settings → Git → enable **"Wait for CI
> before deploying."** Railway has a similar **"Check status before deploy"** option.

---

## Notes & troubleshooting

- **Login works but the next request is 401 / not authenticated.** The cookie
  isn't being treated as first-party. Confirm `BACKEND_URL` is set on Vercel and
  `NEXT_PUBLIC_API_URL` is *empty* (so calls go through the proxy), and that
  `SANCTUM_STATEFUL_DOMAINS` exactly matches your Vercel host.
- **419 / CSRF token mismatch.** Ensure `SESSION_SECURE_COOKIE=true` and the site
  is HTTPS (it is on Vercel/Railway), and `trustProxies` is active (it is — see
  `bootstrap/app.php`).
- **Uploaded PDFs disappear after a redeploy.** The `/app/storage` volume isn't
  mounted — add it (A.4).
- **Custom domain instead of the proxy?** Put both under one domain
  (`app.example.com` + `api.example.com`), set `SESSION_DOMAIN=.example.com` and
  `NEXT_PUBLIC_API_URL=https://api.example.com`, drop `BACKEND_URL`. Then cookies
  are first-party without the proxy.
- **`APP_KEY`** must be set or Laravel won't boot. Generate with
  `php artisan key:generate --show` and paste the `base64:...` value.
- **Deploy crashloops with `42S01 ... table 'supervision_requests' already
  exists`.** The database is half-migrated (a table exists but isn't recorded in
  `migrations`, so `migrate` keeps trying to re-create it). Fix: set
  **`DB_RESET_ON_DEPLOY=true`**, redeploy (it wipes + rebuilds + seeds), then
  remove the variable. Avoid running `migrate:fresh`/`db:seed` from the console
  at the same time as a deploy — that race is the usual cause.
