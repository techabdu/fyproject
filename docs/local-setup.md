# Local setup guide

How to run the **FYP Repository & Supervisor Matching Platform** on your own
computer. There are two options:

- **[Option A — Docker](#option-a--docker-recommended)** — one command, nothing
  to install but Docker. Best for trying the project or demoing it.
- **[Option B — Manual](#option-b--manual-php--node--database)** — install PHP,
  Node and a database yourself. Best if you want to edit the code with
  live-reloading dev servers.

When it's running:

| Part | URL |
|---|---|
| App (use this) | <http://localhost:3000> |
| API | <http://localhost:8000> |

Log in with any seeded account — the password for all of them is `password`.
A few to start with (full list in [`seed-data.md`](./seed-data.md)):

| Role | Email |
|---|---|
| Super Admin (Faculty) | `superadmin@abu.edu.ng` |
| Department Admin | `cs.admin@abu.edu.ng` |
| Supervisor | `aisha.bello@abu.edu.ng` |
| Student | `ahmad.dalhat@student.abu.edu.ng` |

---

## Option A — Docker (recommended)

### 1. Install Docker Desktop

Download and install **Docker Desktop**, then start it (the whale icon should
say "Docker Desktop is running"):

- Windows / macOS: <https://www.docker.com/products/docker-desktop/>
- Linux: install Docker Engine + the Compose plugin from
  <https://docs.docker.com/engine/install/>

Check it works:

```bash
docker --version
docker compose version
```

### 2. Get the code

```bash
git clone https://github.com/techabdu/fyproject.git
cd fyproject
```

(Or download the repo as a ZIP from GitHub, unzip it, and `cd` into the folder.)

### 3. Start everything

From the repo root (the folder with `compose.yaml`):

```bash
docker compose up --build
```

The first run takes a few minutes — it downloads the base images, installs
dependencies, builds the frontend, then starts three services:

- `db` — MariaDB 10.11 (the same engine the tests use)
- `backend` — Laravel API; it waits for the database, runs the migrations, and
  **seeds demo data on the first run**
- `frontend` — Next.js

When you see the Laravel server (`http://0.0.0.0:8000`) and the Next.js server
(`Ready`) reported in the logs, open **<http://localhost:3000>** and log in.

### 4. Stop / start / reset

```bash
# Stop the stack (Ctrl-C if it's running in the foreground, or:)
docker compose down            # keeps your data (DB + uploaded PDFs)

# Start again later (no --build needed unless the code changed)
docker compose up

# Start in the background instead
docker compose up -d
docker compose logs -f         # follow the logs

# Wipe everything and start fresh (re-seeds demo data on the next start)
docker compose down -v
```

> **Why `-v` re-seeds:** demo data is only seeded when the database is empty.
> `docker compose down -v` removes the database and uploads volumes, so the next
> `up` starts clean and seeds again.

---

## Option B — Manual (PHP + Node + database)

Use this if you don't want Docker or you're developing the code.

### Prerequisites

- **PHP 8.3+** (8.4 recommended) with extensions `pdo_mysql`, `mbstring`,
  `openssl`, `zip`, `gd`
- **Composer**
- **Node 20+** and npm (required by Next.js 16)
- **MySQL 8** or **MariaDB 10.4+**

On Windows, **XAMPP** or **Laragon** is the easiest way to get MySQL/MariaDB
(both bundle MariaDB). Start MySQL from its control panel, then use the steps
below for PHP/Node. PHP and Node still need to be installed separately (or use
the PHP that ships with Laragon).

### 1. Create the database

Run this in your MySQL/MariaDB client (defaults match `backend/.env.example`):

```sql
CREATE DATABASE fyp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE fyp_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'fyp'@'127.0.0.1' IDENTIFIED BY 'fyp_secret';
GRANT ALL PRIVILEGES ON fyp.* TO 'fyp'@'127.0.0.1';
GRANT ALL PRIVILEGES ON fyp_test.* TO 'fyp'@'127.0.0.1';
FLUSH PRIVILEGES;
```

### 2. Backend (Laravel API → http://localhost:8000)

```bash
cd backend
cp .env.example .env          # Windows: copy .env.example .env
composer install
php artisan key:generate
php artisan migrate:fresh --seed
php artisan serve --host=127.0.0.1 --port=8000
```

Leave this running.

### 3. Frontend (Next.js → http://localhost:3000)

In a **second terminal**:

```bash
cd frontend
cp .env.example .env.local    # Windows: copy .env.example .env.local
npm install
npm run dev
```

Open <http://localhost:3000>.

### Run the tests (optional)

```bash
cd backend
php artisan test
```

---

## How it fits together

```
 Browser ──► http://localhost:3000  (Next.js)
    │
    └── fetch ──► http://localhost:8000/api, /sanctum  (Laravel API) ──► MySQL/MariaDB
                                                              └─► storage/app/private (PDFs)
```

The browser talks to the API directly. The two run on different ports but the
same host (`localhost`), so with CORS enabled and the session cookie scoped to
`localhost` (`SESSION_DOMAIN`), Laravel Sanctum's SPA cookie authentication works
as a first-party session — no reverse proxy needed. The allowed origins live in
`backend/config/cors.php` and `SANCTUM_STATEFUL_DOMAINS`.

---

## Troubleshooting

**"port is already allocated" / "address already in use" (3000, 8000 or 3306).**
Something else is using that port (another dev server, or a local MySQL on 3306).
Stop the other program, or change the host port in `compose.yaml` (e.g.
`"3307:3306"`) and restart.

**`docker compose` says it can't connect to the Docker daemon.** Docker Desktop
isn't running — start it and wait until it reports "running", then try again.

**The app loads but login fails / the next request is 401.** Make sure you opened
**http://localhost:3000** (not `127.0.0.1:3000` mixed with `localhost:8000`).
Both are allow-listed, but stick to one host. If you changed ports, update
`SANCTUM_STATEFUL_DOMAINS` / `FRONTEND_URL` (Docker: in `compose.yaml`; manual:
in `backend/.env`) to match.

**First Docker build is slow or seems stuck.** It's downloading images and
building the frontend. Give it a few minutes; subsequent starts are fast.

**I want a clean database again.** `docker compose down -v` then
`docker compose up` (Docker), or `php artisan migrate:fresh --seed` (manual).

**Manual setup on MySQL 8 — `1215 Cannot add foreign key constraint`.** This was
fixed: the `active_lock` integrity column is a *virtual* generated column, which
MySQL 8 accepts alongside the cascade foreign key. Pull the latest code and run
`php artisan migrate:fresh --seed` again.

**Apple Silicon (M1/M2/M3).** The images are multi-arch and run natively — no
extra flags needed.
