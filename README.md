# MineRecycle

Plataforma temporária (cerca de 6 meses) que conecta vendedores e compradores dos ativos de um projeto de mineração
paralisado. Os ativos estão organizados em pacotes de venda:

- **A granel** (`bulk`): vendido em bloco (por peso ou lote fechado). A página mostra resumo, totais e a lista de itens.
- **Equipamento** (`equipment`): vendido por equipamento ou conjunto. Cada item pode ter fotos e documentos.

O site é em inglês (com português como opção, pela bandeirinha na barra superior) e não tem preço público.

## O que existe

| Área | Função |
|---|---|
| Vitrine pública | Pacotes da vitrine, filtro por tipo, local e situação. Página do pacote com fotos públicas, documentos públicos e itens paginados com busca. |
| Área do vendedor (login) | Criar e editar pacotes, mudar a situação (ativo, em negociação, vendido, inativo, rascunho), itens manuais, fotos e anexos. |
| Importação de planilha | `.xlsx`/`.xls` por pacote: o vendedor confere o cabeçalho, mapeia as colunas e vê o relatório antes de gravar. Unidades normalizadas (UN, pç, PEÇ → PC; MT, m → M…). A reimportação **substitui** os itens do pacote. |
| Link do comprador | O vendedor gera um link com validade e escopo de pacotes. Por ele o comprador vê os anexos restritos e a proposta. Cada acesso fica registrado. O link pode ser editado ou revogado na hora. |
| Pedidos de informação | Na página do pacote, o comprador envia um pedido (formulário) ou chama a equipe por e-mail ou WhatsApp. Os pedidos chegam na aba Pedidos da área do vendedor, com responsável, situação e nota interna. |
| Configuração (admin) | Quais situações aparecem na vitrine pública (padrão: só ativos). |
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
  scripts/           seed-demo (fictício), seed-sample (amostra local), testes de integração
  test/integration/  importação, link do comprador e visibilidade de anexos, contra Postgres real
frontend/
  src/views/         vitrine, pacote, acesso do comprador, login, área do vendedor
  src/components/    tabela de itens, galeria, assistente de importação, painéis de anexos e links
  src/i18n/          en.js e pt.js
docker/compose.dev.yml   ambiente local completo
scripts/backup-files.sh  backup diário da pasta de arquivos (para o servidor)
```

## Rodando localmente

Pré-requisito: Docker Desktop. Não precisa de `.env`.

```bash
docker compose -f docker/compose.dev.yml up -d --build
docker compose -f docker/compose.dev.yml exec backend npm run seed:demo
```

- Site: http://localhost:8084
- Área do vendedor: http://localhost:8084/login, com `admin@minerecycle.local` / `admin-dev-password` (só no ambiente local)
- O `seed:demo` imprime um link de comprador de demonstração (pacotes 103, 201 e 202, válido por 30 dias).
- Postgres local: `127.0.0.1:5434` (usuário e senha `minerecycle`). As portas não colidem com o FinMind local.

Para recarregar os dados fictícios do zero: `npm run seed:demo -- --reset` (recusado com `NODE_ENV=production`).

Para testar a senha da fase de prévia: `SITE_PASSWORD=algumasenha docker compose -f docker/compose.dev.yml up -d frontend`
(usuário `preview`). Sem a variável, o site fica aberto.

Para parar: `docker compose -f docker/compose.dev.yml down`. Acrescente `-v` para apagar também banco e arquivos.

### Backend e frontend com `npm run dev` (recarga automática)

O Postgres continua no compose; backend e frontend rodam na máquina.

```bash
docker compose -f docker/compose.dev.yml up -d postgres
cp .env.example .env    # e ajuste: NODE_ENV=development, POSTGRES_PORT=5434, JWT_SECRET, ADMIN_*,
                        # PUBLIC_BASE_URL=http://localhost:5173, LOG_PRETTY=true
cd backend && npm install && npm run db:migrate && npm run db:seed && npm run dev   # porta 3000
cd frontend && npm install && npm run dev                                           # http://localhost:5173
```

O Vite repassa `/api` para `localhost:3000` (mesma origem, como o nginx em produção). Banco e arquivos são os mesmos
nos dois modos: o compose de desenvolvimento monta `backend/storage` (fora do git) no contêiner, a mesma pasta que o
`npm run dev` usa. Em produção os arquivos ficam num volume Docker.

### Dados de amostra do cliente (confidenciais)

A pasta `_sample-data/` guarda planilhas e PDFs reais do cliente. Ela está no `.gitignore` e no `.dockerignore` e
**nunca** vai para commit, imagem Docker ou log. Uso só local:

```bash
docker compose -f docker/compose.dev.yml --profile sample run --rm sample-seed
```

- Cada `.xlsx` vira um pacote a granel (rascunho), pela mesma rotina da importação de planilha.
- Cada PDF tem as imagens extraídas (`pdfimages`, num contêiner descartável). As imagens grandes, sem repetição, viram as fotos (restritas) de um pacote de equipamento em rascunho.
- Os pacotes da amostra usam os números 901 em diante e são recriados a cada execução. O script imprime só contagens.

No servidor, dados reais entram **só pelas telas** da área do vendedor (importação de planilha e envio de fotos).

## Testes

```bash
cd backend && npm test                 # regras puras (importação, unidades, quantidades, política de acesso, storage)
cd frontend && npm test                # formatação e idioma
```

Testes de integração (Postgres real, database `minerecycle_test`, criado pelo compose de desenvolvimento):

```bash
cd backend
POSTGRES_HOST=localhost POSTGRES_PORT=5434 POSTGRES_USER=minerecycle POSTGRES_PASSWORD=minerecycle npm run test:integration
```

Cobrem a importação (cabeçalho detectado, erros por linha do Excel, recusa com erros, substituição dos itens,
religação dos anexos pelo nº do item, kits), o link do comprador (hash, escopo, expiração, revogação, registro de
acessos) e a visibilidade dos anexos (público, comprador, vendedor, proposta, original das fotos, configuração da
vitrine, vendedor desativado). O CI (`.github/workflows/ci.yml`) roda lint, testes unitários, testes de integração e
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
