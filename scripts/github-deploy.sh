#!/usr/bin/env bash
# Chamado pelo deploy.yml via SSH: login no GHCR (o PAT chega pelo stdin) e deploy.
set -euo pipefail

GHCR_USERNAME="$1"

docker login ghcr.io -u "$GHCR_USERNAME" --password-stdin

"$(dirname "$0")/deploy.sh"
