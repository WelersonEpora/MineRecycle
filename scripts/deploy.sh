#!/usr/bin/env bash
# Deploy na servidor02 (mesmo roteiro do FinMind): baixa as imagens, sobe, migra e roda os seeders estruturais.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR"

COMPOSE_FILE="docker/compose.prod.yml"
COMPOSE_PROJECT="minerecycle"

if docker compose version >/dev/null 2>&1; then
  COMPOSE=(docker compose)
else
  COMPOSE=(docker-compose)
fi
DC=("${COMPOSE[@]}" -p "$COMPOSE_PROJECT" --project-directory . -f "$COMPOSE_FILE")

echo "========================================"
echo " MineRecycle - Deploy"
echo "========================================"

echo "[1/6] Baixando imagens..."
"${DC[@]}" pull

echo "[2/6] Atualizando containers..."
"${DC[@]}" up -d --remove-orphans

echo "[3/6] Aguardando backend iniciar..."
sleep 10

echo "[4/6] Executando migrations..."
"${DC[@]}" exec -T backend npm run db:migrate

# Só dado estrutural (admin inicial, configuração padrão). O seed fictício (seed:demo) nunca roda aqui.
echo "[5/6] Executando seeders pendentes..."
"${DC[@]}" exec -T backend npm run db:seed

echo "[6/6] Limpando imagens antigas..."
docker image prune -f

echo "========================================"
echo " Deploy concluído com sucesso!"
echo "========================================"
