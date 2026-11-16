# CLAUDE.md

Guia para quem (pessoa ou agente) for trabalhar neste repositório. O `README.md` explica o que o sistema faz e como
rodar; este arquivo resume as regras e convenções a seguir antes de mexer no código, e não repete o README.

## Propósito

MineRecycle: plataforma **temporária** (cerca de 6 meses a partir de 2026-11) que conecta vendedores e compradores dos
ativos de um projeto de mineração paralisado. São ~25 pacotes de venda, ~10 vendedores, site em inglês (português
como opção) e **sem preço público**. Dois tipos de pacote: a granel (`bulk`, vendido em bloco) e equipamento
(`equipment`, por equipamento ou conjunto). Locais: Conceição do Araguaia, Uberaba e Niquelândia.

Por ser temporário e pequeno, prefira o simples: nada de fila, cache distribuído, microsserviço ou camada nova
sem necessidade concreta.

## Restrições permanentes

- **Dados do cliente são confidenciais.** `_sample-data/` (planilhas e PDFs reais) está no `.gitignore` e nos
  `.dockerignore` e **nunca** vai para commit, imagem Docker ou log. Só é lido localmente por
  `backend/scripts/seed-sample.js`, que imprime apenas contagens. Em teste, exemplo ou documentação, use **dados
  fictícios**.
- **No servidor, dados reais entram só pelas telas** (importação de planilha e envio de arquivos da área do vendedor),
  nunca por repositório, imagem ou pasta copiada.
- **O seed fictício (`npm run seed:demo`) não é seeder do sequelize** e nunca roda no deploy. Seeders
  (`database/seeders/`) guardam só dado estrutural (admin inicial, configuração padrão), porque o deploy roda
  `db:seed`.
- **Nada de push, deploy ou alteração no servidor sem pedido explícito do usuário.** Antes de mexer no servidor, mostre
  exatamente o que vai mudar.
- **`C:\Source\FinMind` e `C:\Source\servidor02-infra` são só referência (leitura).** O MineRecycle usa a mesma stack,
  o mesmo servidor e o mesmo padrão de CI/CD do FinMind, sem interferir nele: projeto Compose, porta, domínio,
  database e volumes próprios.
- **Nenhum campo de preço** no modelo, na API ou na tela.
- Logs não levam cookie, token, senha, conteúdo nem nome de arquivo enviado (redação no `shared/logger.js`; o log de
  requisição só guarda método, caminho e status).

## Decisões do usuário (2026-11-16)

| Tema | Decisão |
|---|---|
| Repositório | Público no GitHub (mantém gratuito o runner ARM do build, como no FinMind). Por isso, nada confidencial no código. |
| Domínio | `minerecycle.weslab.com.br`, pelo Nginx Proxy Manager da `servidor02`, frontend em `127.0.0.1:8085` (8084 é a porta do ambiente local). |
| Prévia | Site inteiro protegido por Basic Auth, ligada por `SITE_PASSWORD` no nginx do frontend (vazio = aberto). |
| Vitrine | O admin escolhe na tela Settings quais situações aparecem (padrão: só `active`). |
| Reimportação | Substitui todos os itens do pacote; anexos ligados a itens são religados pelo nº do item. |
| Vendedores | Uma equipe só: todos editam todos os pacotes, cada um com login próprio. Papéis `seller` e `admin`. |
| Idioma | Inglês padrão, português opcional, bandeirinha na barra superior; a escolha fica no navegador. O conteúdo cadastrado (nomes, descrições, itens) não é traduzido. |
| Publicação | Começa já com dados reais, entrados pelas telas, atrás da senha da prévia. |
| Backup | Banco: coberto pelo `backup.sh` do `servidor02-infra` (todos os databases). Arquivos: `scripts/backup-files.sh`, tar diário local (7 diários + 4 semanais), cópia externa opcional. Em aberto: o usuário vai confirmar o snapshot semanal da Oracle e se o bucket de backup está em uso. |

Decisão nova do usuário: registre aqui, com a data.

## Arquitetura

- **Backend** (`backend/`): Node 22, Express 5, Sequelize 6, PostgreSQL 16, `sharp` (fotos), SheetJS (planilhas).
  - `src/domain/`: regras puras. `access-policy.js` decide **quem vê o quê** (pacote e anexo, para público, comprador e
    vendedor). Toda regra de visibilidade nova entra aqui, com teste em `access-policy.test.js`.
  - `src/import/`: leitura de planilha, detecção do cabeçalho, sugestão de mapeamento, quantidades (formato brasileiro
    primeiro) e unidades (`units.js`, tabela de sinônimos). Também puras.
  - O ESLint impede `src/domain` e `src/import` de importar models, services, storage ou config.
  - `src/storage/`: **único** ponto de gravação e leitura de arquivos (interface `put/get/open/remove/removePrefix`,
    driver local). Nunca use `fs` para arquivo de usuário fora daqui; trocar por S3 deve ser só um driver novo. As
    chaves são geradas pelo servidor (`keys.*`), nunca a partir do nome enviado.
  - `src/services/`: casos de uso, que falam direto com os models (não há camada de repository nem de controller, ao
    contrário do FinMind). `dto.js` define o formato das respostas.
  - `src/routes/`: `public.routes.js` (vitrine, link do comprador, arquivos) e `seller.routes.js` (tudo sob
    `/api/v1/seller`, exige vendedor logado; administração exige `admin`).
  - `src/shared/middlewares.js`: `resolveViewer` monta `req.viewer = { seller, link }` a partir dos cookies e
    **revalida no banco a cada requisição** (vendedor ativo, link válido e escopo atual).
- **Frontend** (`frontend/`): Vue 3, Vite, Bootstrap 5, bootstrap-icons e vue-i18n. Sem PrimeVue e sem Pinia; o estado
  da sessão fica em `stores/session.js`. Toda chamada à API passa por `services/api.js`.
- **Arquivos**: nunca há pasta pública. Tudo sai por `GET /api/v1/files/:id/:variant` (`original`, `web`, `thumb`)
  depois de `canReadAttachment`. Sem permissão, a resposta é 404, igual a arquivo inexistente.

## Convenções

- **Idioma do código:** identificadores, mensagens da API e rótulos em inglês; comentários e documentação em português.
- **Erros da API:** `{ error: { code, message, details } }`. O `code` é estável e o frontend traduz por ele
  (`errors.<CODE>` em `i18n/en.js` e `i18n/pt.js`). Erro novo pede código novo e a tradução nos dois arquivos.
- **Textos de tela:** nunca escreva texto fixo no template. Use chave de i18n e acrescente-a em **en.js e pt.js**.
  Formate números e datas com `composables/useFormat.js`. Número digitado pelo usuário segue o idioma da tela
  (`parseLocaleNumber`).
- **Banco:** migrations em `backend/database/migrations/`; nunca altere uma migration já aplicada, crie outra. As
  colunas são `snake_case` (`underscored: true`). Valores de domínio também viram `CHECK` no banco (tipo, local,
  situação, tipo e visibilidade de anexo, proposta sempre restrita). A tabela de usuários é `app_user` (`user` é
  palavra reservada no Postgres).
- **Chave de item:** pacote + nº do item (`item_no`, texto: "1", "1.2", "10A"). O código STOR pode se repetir.
  Kit = item pai (`parent_line_id`); "1.2" é filho de "1" na importação.
- **Link do comprador:** o token vai no fragmento (`/access#<token>`) e o banco guarda só o SHA-256. Validade máxima
  de 365 dias. Rascunho e inativo não podem ser compartilhados nem são vistos pelo comprador.
- **Fotos:** no upload saem a versão web (até 1600 px, WebP) e a miniatura (480x360), sem metadados. O público nunca
  recebe o original de uma foto (pode ter GPS).
- **Segurança de entrada:** o tipo do arquivo vem da extensão (lista fechada em `attachment.service.js`), nunca do
  Content-Type do navegador. Busca com `ILIKE` escapa `%` e `_`.

## Como executar

Veja o README. Resumo:

```bash
docker compose -f docker/compose.dev.yml up -d --build          # tudo em Docker: http://localhost:8084
docker compose -f docker/compose.dev.yml exec backend npm run seed:demo
```

Ou só o Postgres no Docker, com backend e frontend em `npm run dev` (Vite em 5173, proxy de `/api` para a porta 3000);
o `.env` precisa de `NODE_ENV=development`.

## Testes, lint e build

```bash
cd backend && npm run lint && npm test         # unitários (regras puras, sem banco)
cd backend && POSTGRES_HOST=localhost POSTGRES_PORT=5434 POSTGRES_USER=minerecycle POSTGRES_PASSWORD=minerecycle \
  npm run test:integration                     # Postgres real, database minerecycle_test
cd frontend && npm run lint && npm test && npm run build
```

- O script de integração recusa rodar num database cujo nome não contenha "test".
- Mudança em importação, link do comprador ou visibilidade de anexos pede teste de integração em
  `backend/test/integration/`. Regra pura nova pede teste unitário ao lado do arquivo (`*.test.js`).
- Antes de dizer que algo funciona, rode lint e testes dos dois lados. Em mudança visual, abra a tela.

## CI/CD e servidor

- `.github/workflows/ci.yml`: lint, testes unitários, testes de integração (Postgres de serviço) e build do frontend,
  em todo push e PR.
- **Publicação (etapa 3): ainda não feita, aguardando o usuário.** O plano segue o FinMind:
  - `deploy.yml` com build arm64 no runner `ubuntu-24.04-arm`, imagens `ghcr.io/<owner>/minerecycle-backend` e
    `minerecycle-frontend`, e SSH na `servidor02` rodando `scripts/deploy.sh` (pull, up, migrate, seed).
  - App em `/opt/apps/minerecycle/app`, projeto Compose `minerecycle`.
  - Database e usuário criados por `servidor02-infra/postgres/scripts/criar-app.sh minerecycle`, alcançados pela rede
    Docker externa `db`.
  - Volume `minerecycle_file_storage` para os arquivos.
  - Proxy host no NPM: `minerecycle.weslab.com.br` → `127.0.0.1:8085`.
  - Uma linha nova no cron do usuário `deploy` para `scripts/backup-files.sh`.

## Status

- Etapa 1 (plano) e etapa 2 (versão local) concluídas em 2026-11-16: vitrine, área do vendedor, importação de
  planilha, link do comprador, Settings, usuários, i18n, seeds, testes, README e backup de arquivos.
- `_sample-data/` ainda vazia: `seed:sample` pronto, mas não validado com os arquivos reais do cliente.
- Próximo passo: etapa 3 (publicação), só com aprovação do usuário.
