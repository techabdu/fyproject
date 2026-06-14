#!/bin/sh
# Container start: apply pending migrations, then serve.
# (Seed the demo data once, manually, via the host's console — see docs/deployment.md.)
set -e

php artisan migrate --force

exec php artisan serve --host=0.0.0.0 --port="${PORT:-8080}"
