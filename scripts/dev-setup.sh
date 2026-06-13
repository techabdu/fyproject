#!/usr/bin/env bash
#
# Reproducible dev provisioning for the FYP platform.
# Idempotent: safe to run on a fresh (ephemeral) container.
#
#   - ensures MariaDB is installed and running
#   - creates the app + test databases and the app user
#   - installs backend (composer) and frontend (npm) dependencies
#   - runs migrations + seeders
#
# Usage:  bash scripts/dev-setup.sh
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DB_NAME="fyp"; DB_TEST="fyp_test"; DB_USER="fyp"; DB_PASS="fyp_secret"

echo "==> [1/5] MariaDB server"
if ! command -v mariadbd >/dev/null 2>&1 && ! command -v mysqld >/dev/null 2>&1; then
  echo "    installing mariadb-server ..."
  export DEBIAN_FRONTEND=noninteractive
  apt-get update -y && apt-get install -y mariadb-server mariadb-client
fi

# Initialise the data directory if needed, then start the daemon if not running.
if [ ! -d /var/lib/mysql/mysql ]; then
  mariadb-install-db --user=mysql --datadir=/var/lib/mysql >/dev/null
fi
mkdir -p /var/run/mysqld && chown mysql:mysql /var/run/mysqld
if ! mariadb-admin ping >/dev/null 2>&1; then
  echo "    starting mariadbd ..."
  nohup mariadbd-safe --user=mysql >/tmp/mariadb.log 2>&1 &
  for _ in $(seq 1 30); do mariadb-admin ping >/dev/null 2>&1 && break; sleep 1; done
fi
mariadb-admin ping

echo "==> [2/5] Databases and user"
mariadb -u root <<SQL
CREATE DATABASE IF NOT EXISTS ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS ${DB_TEST} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${DB_USER}'@'127.0.0.1' IDENTIFIED BY '${DB_PASS}';
CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';
GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'127.0.0.1';
GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'localhost';
GRANT ALL PRIVILEGES ON ${DB_TEST}.* TO '${DB_USER}'@'127.0.0.1';
GRANT ALL PRIVILEGES ON ${DB_TEST}.* TO '${DB_USER}'@'localhost';
FLUSH PRIVILEGES;
SQL

echo "==> [3/5] Backend dependencies"
cd "$REPO_ROOT/backend"
[ -f .env ] || cp .env.example .env
export COMPOSER_ALLOW_SUPERUSER=1
composer install --no-interaction
grep -q '^APP_KEY=base64' .env || php artisan key:generate

echo "==> [4/5] Migrate + seed"
php artisan migrate:fresh --seed --force

echo "==> [5/5] Frontend dependencies"
if [ -d "$REPO_ROOT/frontend" ]; then
  cd "$REPO_ROOT/frontend"
  [ -f .env.local ] || echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
  npm install
fi

cat <<'DONE'

Setup complete. Start the two dev servers in separate shells:

  (backend)   cd backend  && php artisan serve --host=127.0.0.1 --port=8000
  (frontend)  cd frontend && npm run dev

Then open http://localhost:3000 — log in with a seeded account (password: password).
DONE
