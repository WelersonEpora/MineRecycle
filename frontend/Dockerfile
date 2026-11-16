# O build gera só estáticos: roda na plataforma do runner, sem emulação (mesmo padrão do FinMind).
FROM --platform=$BUILDPLATFORM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine

# openssl: gera o hash da senha da Basic Auth na subida do contêiner (docker/site-auth.sh).
RUN apk add --no-cache openssl

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY docker/40-site-auth.sh /docker-entrypoint.d/40-site-auth.sh
RUN chmod +x /docker-entrypoint.d/40-site-auth.sh && mkdir -p /etc/nginx/snippets && : > /etc/nginx/snippets/site-auth.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1/nginx-health || exit 1
