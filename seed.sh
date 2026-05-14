#!/bin/bash
set -euo pipefail

docker compose up -d db backend

for tentativa in {1..10}; do
  if docker compose exec -T backend python -m app.seed_data; then
    exit 0
  fi

  sleep 5
done

echo "Falha ao executar a carga inicial de dados apos aguardar o backend." >&2
exit 1
