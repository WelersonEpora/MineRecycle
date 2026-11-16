FROM node:22-alpine

WORKDIR /app

# Fonte para o texto das fotos fictícias do seed:demo (o sharp desenha SVG com texto; sem fonte saem quadrados).
RUN apk add --no-cache fontconfig font-dejavu

COPY --chown=node:node package*.json ./
RUN npm ci --omit=dev

COPY --chown=node:node . .

# Diretório do volume de arquivos (fotos e anexos) já com dono "node" antes do mount: sem isso o Docker cria o ponto
# de montagem como root e o processo (não-root) não grava. Mesmo cuidado do FinMind.
RUN mkdir -p storage/files && chown -R node:node storage

ARG GIT_COMMIT=local
ENV GIT_COMMIT=$GIT_COMMIT

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "src/server.js"]
