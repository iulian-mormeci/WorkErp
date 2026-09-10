#!/bin/sh
set -e

echo "Applico le migration Prisma..."
npx prisma migrate deploy

exec "$@"
