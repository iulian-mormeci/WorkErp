#!/bin/bash
# Da lanciare sul VPS, nella cartella che contiene docker-compose.prod.yml
# e .env (vedi README/istruzioni di deploy). Scarica l'ultima immagine
# pubblicata su GHCR e riavvia i servizi.
set -euo pipefail
cd "$(dirname "$0")"

docker compose -f docker-compose.prod.yml pull app
docker compose -f docker-compose.prod.yml up -d
docker image prune -f
