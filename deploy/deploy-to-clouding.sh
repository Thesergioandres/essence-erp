#!/usr/bin/env bash
set -euo pipefail
if [ "$#" -lt 1 ]; then
  echo "Uso: $0 user@host:/ruta/destino"
  exit 1
fi

REMOTE_FULL="$1"
HOST="$(echo "$REMOTE_FULL" | cut -d: -f1)"
REMOTE_DIR="$(echo "$REMOTE_FULL" | cut -d: -f2-)"

if [ -z "$REMOTE_DIR" ]; then
  echo "Formato: user@host:/ruta/destino"
  exit 1
fi

EXCLUDES=(--exclude node_modules --exclude .git --exclude client/node_modules --exclude server/node_modules)

echo "Sincronizando proyecto a $HOST:$REMOTE_DIR..."
rsync -avz --delete "${EXCLUDES[@]}" ./ "$HOST:$REMOTE_DIR"

echo "Conectando a $HOST y arrancando contenedores..."
ssh "$HOST" "cd '$REMOTE_DIR' && docker compose pull || true && docker compose up -d --build"

echo "Despliegue completado."
