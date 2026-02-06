#!/bin/bash
# Ce script copie le .env racine dans le dossier plugin avant le build Docker

set -e

ROOT_ENV="$(dirname "$0")/../.env"
PLUGIN_ENV="$(dirname "$0")/.env"

if [ -f "$ROOT_ENV" ]; then
  cp "$ROOT_ENV" "$PLUGIN_ENV"
  echo ".env copié dans le dossier plugin."
else
  echo "Aucun .env trouvé à la racine."
  exit 1
fi
