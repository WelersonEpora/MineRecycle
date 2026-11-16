#!/usr/bin/env bash
# Backup diário da pasta de arquivos (fotos e anexos) do MineRecycle: um .tar.gz do volume Docker.
# O banco NÃO entra aqui: o backup.sh do servidor02-infra já faz o pg_dump de todos os databases, inclusive o
# minerecycle.
#
# - Destino: $BACKUP_DESTINO (padrão /opt/backups/minerecycle-files), em diario/ e, aos domingos (UTC), semanal/.
# - Retenção: 7 diários e 4 semanais.
# - Cada arquivo é conferido (tar -tzf) antes de entrar na rotação.
# - Com BACKUP_RCLONE_DESTINO definido, COPIA o destino para lá no fim (copy, nunca sync), como o backup do banco.
#
# Uso (cron do usuário deploy, depois do backup do banco):
#   30 10 * * * /opt/apps/minerecycle/app/scripts/backup-files.sh >> /opt/backups/minerecycle-files/backup.log 2>&1
# Restaurar (volume vazio, contêineres parados):
#   docker run --rm -v minerecycle_file_storage:/data -v /opt/backups/minerecycle-files/diario:/b:ro alpine \
#     sh -c 'cd /data && tar -xzf /b/files-AAAA-MM-DD.tar.gz'
set -euo pipefail

VOLUME="${BACKUP_VOLUME:-minerecycle_file_storage}"
DESTINO="${BACKUP_DESTINO:-/opt/backups/minerecycle-files}"
DIARIOS=7
SEMANAIS=4
HOJE="$(date -u +%F)"

log() { echo "$(date -u +'%F %T') $*"; }

mkdir -p "$DESTINO/diario" "$DESTINO/semanal"

if ! docker volume inspect "$VOLUME" >/dev/null 2>&1; then
  log "ERRO: volume $VOLUME não existe."
  exit 1
fi

arquivo="$DESTINO/diario/files-$HOJE.tar.gz"
temporario="$arquivo.parcial"

# Volume montado só para leitura num contêiner descartável.
if ! docker run --rm -v "$VOLUME":/data:ro -v "$DESTINO/diario":/out alpine:3.20 \
  tar -czf "/out/$(basename "$temporario")" -C /data .; then
  log "ERRO: tar do volume $VOLUME falhou."
  rm -f "$temporario"
  exit 1
fi
if ! tar -tzf "$temporario" >/dev/null; then
  log "ERRO: o arquivo gerado não passou na conferência."
  rm -f "$temporario"
  exit 1
fi
mv "$temporario" "$arquivo"
log "OK: $(basename "$arquivo") ($(du -h "$arquivo" | cut -f1))"

if [ "$(date -u +%u)" = "7" ]; then
  cp "$arquivo" "$DESTINO/semanal/"
fi

# Rotação: mantém os N mais recentes de cada pasta.
ls -1t "$DESTINO"/diario/files-*.tar.gz 2>/dev/null | tail -n +$((DIARIOS + 1)) | xargs -r rm -f
ls -1t "$DESTINO"/semanal/files-*.tar.gz 2>/dev/null | tail -n +$((SEMANAIS + 1)) | xargs -r rm -f

if [ -n "${BACKUP_RCLONE_DESTINO:-}" ]; then
  rclone copy "$DESTINO" "$BACKUP_RCLONE_DESTINO" --exclude "*.parcial" --exclude "backup.log"
  log "OK: copiado para $BACKUP_RCLONE_DESTINO"
fi
