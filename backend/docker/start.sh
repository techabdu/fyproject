#!/bin/sh
# Container start: ensure the storage skeleton exists (a freshly-mounted
# persistent volume starts empty and would otherwise hide these folders),
# apply migrations, then serve.
set -e

mkdir -p \
  storage/app/private/projects \
  storage/app/public \
  storage/framework/cache/data \
  storage/framework/sessions \
  storage/framework/views \
  storage/logs

# First deploy / recovery: set DB_RESET_ON_DEPLOY=true to WIPE the database and
# rebuild it cleanly with demo data (fixes a half-applied/inconsistent schema),
# then REMOVE that variable so subsequent deploys only apply new migrations and
# never wipe data.
if [ "$DB_RESET_ON_DEPLOY" = "true" ]; then
  echo ">> DB_RESET_ON_DEPLOY=true — running migrate:fresh --seed (this wipes the database)"
  php artisan migrate:fresh --seed --force
else
  php artisan migrate --force
fi

exec php artisan serve --host=0.0.0.0 --port="${PORT:-8080}"
