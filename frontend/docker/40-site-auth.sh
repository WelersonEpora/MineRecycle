#!/bin/sh
# Proteção do site inteiro por senha (Basic Auth) na fase de prévia.
#   SITE_PASSWORD vazio  -> site aberto (nenhuma diretiva de auth).
#   SITE_PASSWORD="..."  -> pede usuário SITE_USER (padrão "preview") e a senha.
# Roda a cada subida do contêiner (entrypoint da imagem nginx): trocar a senha ou desligar é só mudar o .env e
# recriar o contêiner, sem build.
set -eu

SNIPPET=/etc/nginx/snippets/site-auth.conf
HTPASSWD=/etc/nginx/.htpasswd
mkdir -p /etc/nginx/snippets

if [ -n "${SITE_PASSWORD:-}" ]; then
  HASH="$(printf '%s' "$SITE_PASSWORD" | openssl passwd -apr1 -stdin)"
  printf '%s:%s\n' "${SITE_USER:-preview}" "$HASH" > "$HTPASSWD"
  chmod 644 "$HTPASSWD"
  printf 'auth_basic "MineRecycle";\nauth_basic_user_file %s;\n' "$HTPASSWD" > "$SNIPPET"
  echo "site-auth: password protection ON (user ${SITE_USER:-preview})"
else
  : > "$SNIPPET"
  rm -f "$HTPASSWD"
  echo "site-auth: password protection OFF"
fi
