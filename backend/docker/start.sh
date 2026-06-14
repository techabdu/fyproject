#!/bin/sh
# Container start: ensure the storage skeleton exists (a freshly-mounted
# persistent volume starts empty and would otherwise hide these folders),
# apply pending migrations, then serve.
# (Seed the demo data once, manually, via the host's console — see docs/deployment.md.)
set -e

mkdir -p \
  storage/app/private/projects \
  storage/app/public \
  storage/framework/cache/data \
  storage/framework/sessions \
  storage/framework/views \
  storage/logs

php artisan migrate --force

exec php artisan serve --host=0.0.0.0 --port="${PORT:-8080}"
