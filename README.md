# MineRecycle

Plataforma temporária (cerca de 6 meses) que conecta vendedores e compradores dos ativos de um projeto de mineração
paralisado. Os ativos estão organizados em pacotes de venda:

- **A granel** (`bulk`): vendido em bloco (por peso ou lote fechado). A página mostra resumo, totais e a lista de itens.
- **Equipamento** (`equipment`): vendido por equipamento ou conjunto. Cada item pode ter fotos e documentos.

O site é em inglês (com português como opção, pela bandeirinha na barra superior) e não tem preço público.

## O que existe

| Área | Função |
|---|---|
| Catálogo público | Pacotes ativos (em negociação com a caixa marcada), busca e filtros por tipo, origem e local. Página do pacote com fotos públicas, documentos públicos e itens paginados com busca. |
| Área do vendedor (login) | Criar e editar pacotes, mudar a situação (ativo, em negociação, vendido, inativo, rascunho), itens manuais, fotos e anexos. |
| Importação de planilha | `.xlsx`/`.xls` por pacote: o vendedor confere o cabeçalho, mapeia as colunas e vê o relatório antes de gravar. Unidades normalizadas (UN, pç, PEÇ → PC; MT, m → M…). A reimportação **substitui** os itens do pacote. |
| Link do comprador | O vendedor gera um link com validade e escopo de pacotes. Por ele o comprador vê os anexos restritos e a proposta. Cada acesso fica registrado. O link pode ser editado ou revogado na hora. |
| Pedidos de informação | Na página do pacote, o comprador envia um pedido (formulário) ou chama a equipe por e-mail ou WhatsApp. Os pedidos chegam na aba Pedidos da área do vendedor, com responsável, situação e nota interna. |
| Configuração (admin) | Origens dos pacotes e contato comercial da equipe (e-mail e WhatsApp). |
| Usuários (admin) | Vendedores com login próprio. Todos editam todos os pacotes (uma equipe só). |

### Regras de visibilidade

- **Público** vê só pacotes com situação marcada na Configuração. Rascunho e inativo nunca aparecem.
- **Comprador com link válido** vê os pacotes do escopo do link (menos rascunho e inativo), com todos os anexos, inclusive restritos e propostas.
- **Vendedor logado** vê tudo.
- **Proposta** é sempre restrita, mesmo que alguém tente marcá-la como pública (regra no código e no banco).
- **Fotos públicas**: o público recebe só a versão web (até 1600 px) e a miniatura, ambas sem metadados (EXIF/GPS). O original fica para vendedor e comprador.
- **Arquivos não são servidos de pasta pública**: tudo sai por `GET /api/v1/files/:id/:variant`, depois da checagem. Arquivo sem permissão responde 404, igual a inexistente.
- O token do link vai no fragmento da URL (`/access#<token>`): o navegador não o envia ao servidor, então ele não aparece em log. O banco guarda só o hash SHA-256.
- Desativar um vendedor, revogar um link ou mudar o escopo vale na requisição seguinte.

## Stack

A mesma do FinMind: Node 22, Express 5, Sequelize 6 e PostgreSQL 16 no backend; Vue 3, Vite e Bootstrap 5 no
frontend (sem PrimeVue: as tabelas aqui são simples), com vue-i18n para os idiomas. Nginx no frontend faz proxy de
`/api`. Imagens redimensionadas com `sharp`; planilhas lidas com SheetJS.

```
backend/
  src/domain/        regras puras: constantes e política de acesso (quem vê o quê)
  src/import/        leitura de planilha, mapeamento, quantidades e unidades (puras, testadas sem banco)
  src/storage/       ÚNICO módulo que grava e lê arquivos (driver local; trocar por S3 = driver novo)
  src/media/         versões web e miniatura das fotos
  src/services/      casos de uso (pacotes, linhas, anexos, importação, links, usuários)
  src/routes/        API pública (/api/v1/...) e do vendedor (/api/v1/seller/...)
  database/          migration inicial e seeders estruturais (admin, configuração padrão)
  scripts/           import-lots (planilha local), testes de integração
  test/integration/  importação, link do comprador e visibilidade de anexos, contra Postgres real
frontend/
  src/views/         catálogo, pacote, acesso do comprador, login, área do vendedor
  src/components/    tabela de itens, galeria, assistente de importação, painéis de anexos e links
  src/i18n/          en.js e pt.js
docker/compose.dev.yml   backend e frontend em Docker, com o Postgres do infra
scripts/backup-files.sh  backup diário da pasta de arquivos (para o servidor)
```

## Rodando localmente

O banco é o **Postgres compartilhado da máquina** (`C:\Source\infra`, container `postgres` na porta 5432, rede
`db`), no mesmo modelo do servidor (`servidor02-infra`): um usuário e um database por app. O MineRecycle não sobe
banco próprio, nem local nem no servidor.

Uma vez só, no Postgres do infra: o usuário `minerecycle` (senha em `C:\Source\infra\apps.env`,
`POSTGRES_MINERECYCLE_PASSWORD`) e os databases `minerecycle` e `minerecycle_test`, com `REVOKE CONNECT ... FROM
PUBLIC`, como os outros apps.

```bash
cd C:\Source\infra && docker compose up -d     # bancos compartilhados
cp .env.example .env    # e ajuste: NODE_ENV=development, POSTGRES_PORT=5432, POSTGRES_PASSWORD (do apps.env),
                        # JWT_SECRET, ADMIN_*, PUBLIC_BASE_URL=http://localhost:5173, LOG_PRETTY=true
cd backend && npm install && npm run db:migrate && npm run db:seed && npm run dev   # porta 3000
cd frontend && npm install && npm run dev                                           # http://localhost:5173
```

O Vite repassa `/api` para `localhost:3000` (mesma origem, como o nginx em produção). O `npm run dev` não roda
migrations: depois de um pull com migration nova, `npm run db:migrate`.

### Tudo em Docker (opcional)

```bash
docker compose -f docker/compose.dev.yml up -d --build     # http://localhost:8084
```

Backend e frontend em contêiner, ligados ao mesmo Postgres do infra (rede `db`) e lendo o mesmo `.env` da raiz. Banco
e arquivos são os mesmos nos dois modos: o compose monta `backend/storage` (fora do git), a pasta que o `npm run dev`
usa. Em produção os arquivos ficam num volume Docker.

Para testar a senha da fase de prévia: `SITE_PASSWORD=algumasenha docker compose -f docker/compose.dev.yml up -d frontend`
(usuário `preview`). Sem a variável, o site fica aberto.

### Lotes da planilha do cliente (confidencial)

A pasta `_sample-data/` guarda a planilha real do cliente. Ela está no `.gitignore` e no `.dockerignore` e **nunca**
vai para commit, imagem Docker ou log. Para carregar os lotes no banco local, pelo mesmo importador da tela:

```bash
cd backend && npm run import:lots -- "../_sample-data/<planilha>.xlsm"
```

Lê a aba "Matriz de lotes", cria ou atualiza os lotes e os pacotes automáticos, e imprime só contagens. Rodar de novo
com o mesmo arquivo não muda nada. No servidor, os lotes entram **só pela tela** de importação.

## Testes

```bash
cd backend && npm test                 # regras puras (lotes, importação, venda, política de acesso, storage)
cd frontend && npm test                # formatação e idioma
```

Testes de integração (Postgres real, database `minerecycle_test` no Postgres do infra, com o usuário e a senha do
`.env`; o script recusa database cujo nome não tenha "test"):

```bash
cd backend && npm run test:integration            # todos
cd backend && npm run test:integration -- lot     # só os arquivos que começam com "lot"
```

O CI (`.github/workflows/ci.yml`) roda lint, testes unitários, testes de integração (com um Postgres de serviço) e
build do frontend.

## Backup

- **Banco:** já coberto pelo `backup.sh` do `servidor02-infra`, que faz `pg_dump` diário de todos os databases da VM
  (7 diários + 4 semanais). O database `minerecycle` entra sozinho.
- **Arquivos:** `scripts/backup-files.sh` gera um `.tar.gz` diário do volume (7 diários + 4 semanais), conferido antes
  de entrar na rotação. A cópia externa por `rclone` é opcional (`BACKUP_RCLONE_DESTINO`).
- O snapshot semanal do disco da VM (Oracle) cobre a perda do disco inteiro.

## Publicação

Ainda não preparada: é a próxima etapa, e depende de aprovação. Vai seguir o padrão do FinMind (imagens arm64 no
GHCR, deploy por SSH na `servidor02`, Postgres compartilhado, Nginx Proxy Manager em `minerecycle.weslab.com.br`,
porta `127.0.0.1:8085`), começando protegida por senha (`SITE_PASSWORD`).
