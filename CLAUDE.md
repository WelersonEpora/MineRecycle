# CLAUDE.md

Guia para quem (pessoa ou agente) for trabalhar neste repositório. O `README.md` explica o que o sistema faz e como
rodar; este arquivo resume as regras e convenções a seguir antes de mexer no código, e não repete o README.

## Propósito

MineRecycle: plataforma **temporária** (cerca de 6 meses a partir de 2026-11) que conecta vendedores e compradores dos
ativos de um projeto de mineração paralisado. ~10 vendedores, site em inglês (português como opção) e **sem preço
público**. Desde 2026-11-19 a fonte é a aba "Matriz de lotes" da planilha de inventário da Horizonte: o **lote** é a
menor unidade e o **pacote** agrupa lotes (muitos para muitos) e é o que se vende (ver "Lotes e pacotes").

Por ser temporário e pequeno, prefira o simples: nada de fila, cache distribuído, microsserviço ou camada nova
sem necessidade concreta.

## Restrições permanentes

- **Dados do cliente são confidenciais.** `_sample-data/` (planilhas e PDFs reais) está no `.gitignore` e nos
  `.dockerignore` e **nunca** vai para commit, imagem Docker ou log. Só é lido localmente por
  `backend/scripts/import-lots.js` (`npm run import:lots`), que imprime apenas contagens. Em teste, exemplo ou
  documentação, use **dados fictícios**.
- **No servidor, lotes e arquivos reais entram só pelas telas** (importação da planilha de lotes e envio de arquivos
  da área do vendedor), nunca por repositório, imagem ou pasta copiada.
- **Estrutura sempre por migration.** Nada de editar registro à mão no banco, nem no local. Dados de pacotes e lotes
  vêm da importação e das telas, não de migration de dados (as do STOR, de 2026-11-16, foram anuladas pela limpeza de
  2026-11-19).
- **Seeders (`database/seeders/`) guardam só dado estrutural** (admin inicial, configuração padrão), porque o deploy
  roda `db:seed`. Não há seed fictício (saiu em 2026-11-19): localmente, os lotes vêm da planilha real por
  `npm run import:lots`.
- **Banco (decisão de 2026-11-19):** o MineRecycle nunca sobe Postgres próprio. No servidor, o compartilhado do
  `servidor02-infra` (rede `db`); no local, o de `C:\Source\infra` (porta 5432, rede `db`), com usuário `minerecycle`
  e os databases `minerecycle` e `minerecycle_test` (senha em `C:\Source\infra\apps.env`).
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
| Domínio | `minerecycle.afbridge.com.br` desde 2026-11-24 (antes `minerecycle.weslab.com.br`, que continua respondendo; links já enviados seguem valendo). Os links do comprador usam `PUBLIC_BASE_URL` do `.env` do servidor. Pelo Nginx Proxy Manager da `servidor02`, frontend em `127.0.0.1:8085` (8084 é a porta do ambiente local). |
| Prévia | Basic Auth no nginx do frontend, por `SITE_PASSWORD` (vazio = aberto). Usada só no início; desligada em 2026-11-16 a pedido do usuário. |
| Catálogo | Regra fixa desde 2026-11-17 (`PUBLIC_STATUSES`): ativos; em negociação só com a caixa "Mostrar pacotes em negociação" (a página do pacote em negociação é pública); vendidos, rascunhos e inativos nunca. A antiga escolha na tela Settings saiu. O link do comprador mostra todos os pacotes do link menos rascunho e inativo: vendidos aparecem (podem ser do comprador). |
| Vendedores | Uma equipe só: todos editam todos os pacotes, cada um com login próprio. Papéis `seller` e `admin`. |
| Idioma | Inglês padrão, português opcional, bandeirinha na barra superior; a escolha fica no navegador. O conteúdo cadastrado (nomes, descrições, lotes) não é traduzido. |
| Publicação | Começa já com dados reais, entrados pelas telas, atrás da senha da prévia. |
| Backup | Banco: coberto pelo `backup.sh` do `servidor02-infra` (todos os databases). Arquivos: `scripts/backup-files.sh`, tar diário local (7 diários + 4 semanais), cópia externa opcional. Em aberto: o usuário vai confirmar o snapshot semanal da Oracle e se o bucket de backup está em uso. |
| Visibilidade interna (2026-11-16) | Além de `public` e `restricted`, o anexo pode ser `internal`: só vendedor logado vê, nunca o comprador com link. Para arquivo que pode ter valor. |
| Senha (2026-11-17) | Mínimo de 9 caracteres (antes 10), na criação de usuário, na troca de senha e no admin inicial. Constante `MIN_PASSWORD_LENGTH` em `auth.service.js`. |
| Exclusão de usuário (2026-11-17) | Exclusão **lógica** (`app_user.deleted_at`; excluído fica também inativo, por CHECK). Some da lista, não entra e a sessão aberta cai na próxima requisição. Incluir de novo o mesmo e-mail reativa o registro com os dados novos, mantendo o histórico. Ninguém exclui a si mesmo (por isso sempre sobra um admin ativo). Desativar continua existindo, para afastamento temporário. |
| Cartão do catálogo sem foto (2026-11-17) | Variação "etiqueta de inventário": fundo na cor da **categoria** do pacote (campo `category`: refractories, electrical, piping, process_equipment, office, other; CHECK no banco), ícone da categoria ao fundo e um número em destaque em Barlow Condensed (hospedada em `frontend/public/fonts`, licença OFL junto). Desde 2026-11-19 o número é a quantidade de lotes em oferta. Foto pública substitui o cartão. Sem foto de banco de imagens. |
| Origem e filtros (2026-11-17, revista em 2026-11-19) | Origem = de onde vieram os ativos. Tabela `origin` (nome, sigla, ativa), **opcional** no pacote desde 2026-11-19. Cadastro em Settings, só admin; sem exclusão, só desativar. Catálogo e link do comprador: busca (nome e descrição do pacote; nº, descrição, fornecedor e descrição do vendedor dos lotes em oferta), chips de **Agrupamento** (nível do pacote), Origem (só com mais de uma origem visível) e **Site** (dos lotes, como está na planilha), com contagens que consideram os outros filtros; filtros na URL; regra pura em `domain/catalog-filter.js`. Tipo e Local saíram. |
| Pedidos dos compradores (2026-11-17) | Na página do pacote: formulário de pedido (tabela `inquiry`) e o contato comercial da equipe (e-mail e WhatsApp, em Settings, só admin altera; links com o pacote já preenchido). Um pacote por pedido. Campos nome, empresa, e-mail, telefone, país e "mais informações", nenhum obrigatório sozinho, mas exige e-mail ou telefone. Sem campo de preço ou oferta. Visitante e comprador com link pedem; pacote vendido, ou sem nenhum lote disponível, não recebe pedido (`canSendInquiry` em `access-policy.js`). Atendimento só no painel (aba Pedidos), sem e-mail de aviso por enquanto: responsável ("Assumir"), situação (novo, em atendimento, concluído, descartado), nota interna e quem alterou por último. Anti-spam: campo isca e limite por IP. |
| Pedidos: contato direto, desfecho e "Como funciona" (2026-11-17) | Contato que chegou por e-mail, WhatsApp, telefone ou outro é registrado à mão pelo vendedor ("Novo pedido", campo `channel`; "form" é só o do site), nasce em atendimento com quem registrou como responsável. Responsável é sempre um usuário ativo do sistema (quem não usa o sistema não atualiza o pedido; pessoa de fora vai na nota). Desfecho (`outcome`: vendido para este comprador, não avançou, sem resposta) só em pedido concluído: escolher o desfecho conclui, sair de concluído apaga (regra pura em `domain/inquiry-state.js`, CHECK no banco). Ajuda ganhou a aba "Como funciona" (processo de ponta a ponta e o que cada situação do pacote libera), primeira aba da Ajuda. |
| Termo "catálogo" (2026-11-17) | A página pública de pacotes se chama **catálogo** em todo lugar (tela, Ajuda, documentação, comentários), como no menu e no código (`catalog`). Não use "vitrine" (só sobrou em migrations já aplicadas). O link do comprador não é o catálogo: é a lista de pacotes que o link libera. |
| Lista de pacotes do vendedor (2026-11-17, revista em 2026-11-19) | Situação em chips com contagem (considera os outros filtros, não a própria situação); Agrupamento, Origem e Site em select; filtros na URL; a busca olha também os lotes (inclusive retirados e fora da venda). |
| Logo da Horizonte Minerals (2026-11-18) | MineRecycle continua a marca principal; a Horizonte entra como dona dos ativos, no rodapé ("Asset sale of" + logo colorida). SVGs em `frontend/public/brand/` (colorida e branca, esta para fundo escuro, ainda sem uso). O SVG atual é um redesenho: trocar pelo arquivo oficial quando a empresa enviar. |
| Largura das páginas (2026-11-18) | Uma largura só para o site todo, inclusive a área do vendedor (a área larga, em tela cheia, foi testada e rejeitada): `container-xl`, com teto de 1560 px a partir de 1680 px de janela (no Bootstrap, 1320); nessa faixa o catálogo mostra 5 cartões por linha. Barra superior e rodapé (fixo no pé da tela, com sombra) acompanham. |
| Edição dos dados do pacote (2026-11-18) | A aba Detalhes do vendedor só mostra os dados; "Editar" abre um modal com o formulário (o mesmo `PackageForm` de Novo pacote), Cancelar e Salvar. O modal é persistente (clique fora e Esc não fecham) e rolável (botões sempre à vista); cada abertura parte do que está gravado; erro mantém o modal aberto. Nada de edição pendente fora do modal. |
| Envio de fotos e arquivos (2026-11-18) | Mesmo princípio: a aba "Fotos e arquivos" tem só o botão "Adicionar arquivos" e a lista do que já foi enviado (alterações na lista gravam na hora). O formulário de envio e a fila ficam num modal persistente com Cancelar e Enviar; enquanto envia, nada fecha o modal. Arrastar arquivos para a aba ou colar imagem (Ctrl+V) abre o modal já com eles (só documentos: tipo ficha técnica). |
| Dicas dos campos do pacote (2026-11-18) | No `PackageForm` (Novo pacote e Editar), as dicas de preenchimento saíram de baixo dos campos e viraram o "?" do `HelpTip` (balão próprio, nunca o `title` do navegador), ao lado do rótulo. "Novo pacote" ficou igual ao modal de edição: largo, persistente e rolável. As outras telas ainda usam texto de ajuda embaixo do campo; padronizar só se o usuário pedir. |
| ID do pacote (2026-11-19) | O nº do catálogo (`number`) aparece para o vendedor como **ID**: primeira coluna da lista de pacotes e no cabeçalho da página do pacote. Também é **público**: "#12" no cartão do catálogo e na página pública do pacote (para todos, a pedido do usuário). É gerado ao criar (editável só em "Novo pacote"; a importação numera os automáticos em sequência) e **fixo depois** (o backend recusa a troca com `NUMBER_LOCKED`), porque é o endereço público. |
| Lotes e pacotes (2026-11-19) | **Mudança de rota:** o STOR deixou de ser a fonte. A fonte é a aba "Matriz de lotes" da planilha de inventário (`_sample-data/`, confidencial). O **lote** é a menor unidade (tabela `lot`, chave `lot_number`); o **pacote** agrupa lotes, muitos para muitos (`package_lot`, com posição). Saíram: itens (`package_line`), tipo (bulk/equipment), locais, campos STOR (pasta, Ativos, Doc.), importação de itens e de pacotes, exportação e o importador com IA (este nunca chegou a ser implementado). Todos os pacotes, itens, anexos, pedidos e links foram apagados em produção e no local (migration `20261119100000`, aprovada pelo usuário). |
| Campos do lote (2026-11-19) | Lidos da planilha, pelo nome do cabeçalho (8 colunas, todas obrigatórias; coluna faltando impede a importação): Lot Number, Site Name (mostrado como está, também ao comprador), Title / Equipment Description, Master Supplier, Equipamento ou sistema vinculado (AA), Família comercial (AB), Subfamília (AC) e STATUS. País não é usado. **Colunas de preço (N, O, X) nunca são lidas.** O vendedor acrescenta só a descrição dele (`description`), que a importação não apaga. |
| Pacotes automáticos e manuais (2026-11-19) | A importação cria um pacote **automático** por valor de AA, AB e AC (`source` = linked_system, family, subfamily; `source_value` único por nível, sem diferença de maiúsculas), como **rascunho**, com o valor como nome; os lotes dele seguem a planilha (o vendedor não mexe; ordem natural do nº). Automático que fica sem lotes não aparece no catálogo e só então pode ser excluído. O 4º nível (pacote de um lote só, com o nome do lote) é criado sob demanda ("Criar pacote deste lote"). O vendedor monta pacotes **manuais** com os lotes que quiser. Pacote e lote têm anexos próprios; o anexo do lote acompanha o lote em todos os pacotes, com o melhor acesso entre eles (`bestPackageAccess`). |
| Situação do lote e venda (2026-11-19) | STATUS "Sold" = vendido; "Collected by court officer" = fora da venda (some do público, o vendedor vê); vazio/"Available" = disponível; outro valor impede a importação. A planilha **só promove** a vendido, nunca desfaz (`sold_by_sheet`). **Quem é vendido é o pacote**: marcar Vendido grava `lot_sale` para os lotes dele e os marca vendidos em todos os pacotes; se algum já estava vendido, pede confirmação (`PACKAGE_SALE_CONFIRM`). Desfazer libera só os lotes vendidos por aquele pacote. Pacote vendido sai do catálogo, não muda de lotes e não é excluído. Lote novo num automático já vendido entra vendido. Regras puras em `domain/lot-status.js` e `domain/package-sale.js`. |
| Reimportação de lotes (2026-11-19) | Prévia e confirmação; nada gravado antes. O commit refaz o plano sob `pg_advisory_xact_lock` e só grava se a impressão digital (arquivo, aba e banco) for a mesma (`IMPORT_STALE`); uma transação. Lote que sai da planilha fica **retirado** (`withdrawn_at`, nunca apagado) e volta se reaparecer. A prévia avisa quando o sistema tem lote vendido que a planilha não tem. Regra pura em `import/lot-plan.js` e `domain/auto-packages.js`. |
| Exportação de lotes (2026-11-19) | Só vendedores: "Exportar lotes" na tela Lotes. Uma aba, "Matriz de lotes", no **formato da importação** (as 8 colunas com os nomes da planilha do cliente, depois colunas informativas no idioma da tela: situação no sistema, pacotes, descrição do vendedor, nº de arquivos), para poder importar de volta. STATUS sai como a planilha disse (`sheet_status`), nunca a situação do sistema (senão o lote vendido por pacote ficaria vendido pela planilha). **Sempre todos os lotes não retirados, sem filtro** (lote fora do arquivo vira retirado na importação). Nome: "MineRecycle - Lotes - <data>.xlsx", data no fuso do Brasil. Regra pura em `export/lot-export.js`, com teste de ida e volta. |
| Abas do vendedor (2026-11-19) | Ordem pelo fluxo: **Lotes** antes de **Pacotes** (depois Pedidos, Links...). A área do vendedor abre em Lotes (`/seller` → `/seller/lots`; a lista de pacotes fica em `/seller/packages`), por escolha do usuário. |
| Página do lote (2026-11-19) | Mesmo arranjo da página do pacote: abas **Dados** (planilha e descrição do vendedor, só leitura), **Pacotes (n)** (onde o lote está, com "Criar pacote deste lote") e **Fotos e arquivos (n)**; aba aberta no endereço (`?tab=`). A descrição do vendedor é editada num modal persistente (Cancelar/Salvar), como os dados do pacote. |
| Tabelas (2026-11-19) | Padrão "tabela-card" do FinMind (`components/table/DataTableCard.vue`): filtros dentro do cartão, paginação em cima e embaixo, itens por página, botão de atualizar, cabeçalhos ordenáveis (`SortHeader`) e linha clicável com seta. |
| Origem escondida (2026-11-19) | A origem é do pacote, a planilha não a traz e ninguém a preenche; o Site já diz onde os lotes estão. Por enquanto, **escondida só na tela** (`SHOW_ORIGIN = false` em `frontend/src/utils/features.js`): some o card Origens de Configuração, o campo do pacote, o filtro e a sigla na lista do vendedor e os chips do catálogo. Banco, API e o que já estiver gravado ficam (voltar = `true`). Remover de vez só se o usuário pedir. |
| Limpeza geral (2026-11-19) | Para recomeçar a carga do zero sem Portainer: seção "Limpeza geral" em Configuração, **só admin** (o usuário aceitou que qualquer admin possa fazer; serão poucos). Modal persistente com aviso grande, contagem do que será apagado, atalho para Exportar lotes, a frase digitada (`APAGAR TUDO` ou `DELETE ALL`, conforme o idioma) e a senha do admin. Apaga, numa transação (com a trava da importação), lotes, pacotes, anexos, pedidos, links e log de acesso, e a numeração recomeça; depois remove os arquivos (`packages/` e `lots/`). Ficam usuários, contato comercial e origens. Registra quem fez e quando (`setting` "data_reset"). Regra em `domain/data-reset.js`, serviço em `data-reset.service.js`. |
| Ajuste manual da situação do lote (2026-11-24) | Negociações vão e vêm: na página do lote (aba Dados, "Ajustar situação", modal persistente) qualquer vendedor fixa a situação (disponível, vendido, fora da venda) ou volta a "seguir a planilha", com nota opcional; grava quem e quando (`lot.manual_status*`, CHECK no banco). O ajuste vale sobre a planilha, inclusive sobre o "Sold" de mão única, **até uma reimportação trazer outro STATUS para o lote** (aí a planilha volta a mandar e o "vendido pela planilha" é recalculado só pelo STATUS novo; a prévia lista os ajustes substituídos). **Venda por pacote continua acima**: lote vendido por pacote não aceita ajuste (`LOT_SOLD_BY_PACKAGE`), nem lote retirado. A exportação mantém STATUS da planilha e mostra o ajuste numa coluna informativa. Regras puras em `domain/lot-status.js` (`planManualStatus`, `reimportStatus`). |
| Tipos de anexo (2026-11-24) | Lista **fechada** (`MIME_BY_EXT` em `attachment.service.js`), nunca "qualquer tipo": `.html`, `.svg`, scripts e executáveis rodariam a partir do domínio do site. Depois de uma planilha `.xlsm` recusada, entraram `.xlsm`, `.xlsb`, `.docm`, `.ppt`, `.pptm`, `.ods`, `.odt`, `.odp`, `.rar`, `.7z`, `.msg`, `.eml` e `.heic` (só como documento). Tipo recusado devolve `ATTACHMENT_FILE_TYPE` e a tela lista os aceitos. Tipo novo: só acrescentar à lista. |

Decisão nova do usuário: registre aqui, com a data.

## Arquitetura

- **Backend** (`backend/`): Node 22, Express 5, Sequelize 6, PostgreSQL 16, `sharp` (fotos), SheetJS (planilhas).
  - `src/domain/`: regras puras. `access-policy.js` decide **quem vê o quê** (pacote e anexo, para público, comprador e
    vendedor). Toda regra de visibilidade nova entra aqui, com teste em `access-policy.test.js`.
  - `src/import/`: leitura da planilha de lotes (`lot-sheet.js`: aba, cabeçalho e colunas por sinônimo) e o plano da
    importação (`lot-plan.js`). Também puras.
  - `src/export/`: planilha da exportação de lotes (`lot-export.js`, regra pura).
  - O ESLint impede `src/domain`, `src/import` e `src/export` de importar models, services, storage ou config.
  - `src/storage/`: **único** ponto de gravação e leitura de arquivos (interface `put/get/open/remove/removePrefix`,
    driver local). Nunca use `fs` para arquivo de usuário fora daqui; trocar por S3 deve ser só um driver novo. As
    chaves são geradas pelo servidor (`keys.*`), nunca a partir do nome enviado.
  - `src/services/`: casos de uso, que falam direto com os models (não há camada de repository nem de controller, ao
    contrário do FinMind). `dto.js` define o formato das respostas.
  - `src/routes/`: `public.routes.js` (catálogo, link do comprador, arquivos) e `seller.routes.js` (tudo sob
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
  colunas são `snake_case` (`underscored: true`). Valores de domínio também viram `CHECK` no banco (situação do
  pacote e do lote, nível do pacote, tipo e visibilidade de anexo, dono do anexo, proposta nunca pública). A tabela de usuários é `app_user` (`user` é
  palavra reservada no Postgres).
- **Chave do lote:** `lot_number` (texto, único). Anexo pertence a um pacote **ou** a um lote (`ck_attachment_owner`);
  chaves de arquivo por dono (`packages/<id>/...`, `lots/<id>/...`).
- **Link do comprador:** o token vai no fragmento (`/access#<token>`) e o banco guarda só o SHA-256. Validade máxima
  de 365 dias. Rascunho e inativo não podem ser compartilhados nem são vistos pelo comprador.
- **Fotos:** no upload saem a versão web (até 1600 px, WebP) e a miniatura (480x360), sem metadados. O público nunca
  recebe o original de uma foto (pode ter GPS).
- **Segurança de entrada:** o tipo do arquivo vem da extensão (lista fechada em `attachment.service.js`), nunca do
  Content-Type do navegador. Busca com `ILIKE` escapa `%` e `_`.

## Como executar

Veja o README. Resumo:

Banco: o Postgres de `C:\Source\infra` (`docker compose up -d` lá). Backend e frontend em `npm run dev` (Vite em 5173,
proxy de `/api` para a porta 3000); o `.env` da raiz precisa de `NODE_ENV=development` e `POSTGRES_PORT=5432`. O
`npm run dev` não roda migrations (`npm run db:migrate`).

```bash
cd backend && npm run import:lots -- "../_sample-data/<planilha>.xlsm"   # lotes da planilha real, só no local
docker compose -f docker/compose.dev.yml up -d --build                   # opcional: tudo em Docker, :8084
```

## Testes, lint e build

```bash
cd backend && npm run lint && npm test         # unitários (regras puras, sem banco)
cd backend && npm run test:integration        # Postgres real (infra), database minerecycle_test, usuário do .env
cd backend && npm run test:integration -- lot  # só os arquivos que começam com "lot"
cd frontend && npm run lint && npm test && npm run build
```

- O script de integração recusa rodar num database cujo nome não contenha "test".
- Mudança em importação, link do comprador ou visibilidade de anexos pede teste de integração em
  `backend/test/integration/`. Regra pura nova pede teste unitário ao lado do arquivo (`*.test.js`).
- Antes de dizer que algo funciona, rode lint e testes dos dois lados. Em mudança visual, abra a tela.

## CI/CD e servidor

- `.github/workflows/ci.yml`: lint, testes unitários, testes de integração (Postgres de serviço) e build do frontend,
  em todo push e PR. Na `main`, roda de dentro do `deploy.yml` (job `ci`, `workflow_call`), e o deploy tem `needs: ci`:
  nada é publicado sem a CI verde (desde 2026-11-25, como no Personal-Assistant).
- **Publicado em 2026-11-16** em https://minerecycle.weslab.com.br; desde 2026-11-24 o endereço oficial é https://minerecycle.afbridge.com.br. A senha da prévia foi desligada no mesmo dia (`SITE_PASSWORD` vazio no `.env` do servidor): o catálogo é público, e o NPM força HTTPS. Push na `main` publica sozinho (variável `DEPLOY_ENABLED=true`). Como está montado:
  - `deploy.yml` com build arm64 no runner `ubuntu-24.04-arm`, imagens `ghcr.io/<owner>/minerecycle-backend` e
    `minerecycle-frontend`, e SSH na `servidor02` rodando `scripts/deploy.sh` (pull, up, migrate, seed).
  - App em `/opt/apps/minerecycle/app`, projeto Compose `minerecycle`.
  - Database e usuário criados por `servidor02-infra/postgres/scripts/criar-app.sh minerecycle`, alcançados pela rede
    Docker externa `db`.
  - Volume `minerecycle_file_storage` para os arquivos.
  - Proxy host no NPM: `minerecycle.afbridge.com.br` (e o antigo `minerecycle.weslab.com.br`) → `127.0.0.1:8085`.
  - Uma linha nova no cron do usuário `deploy` para `scripts/backup-files.sh`.

## Status

- Etapa 1 (plano) e etapa 2 (versão local) concluídas em 2026-11-16: catálogo, área do vendedor, importação de
  planilha, link do comprador, Settings, usuários, i18n, seeds, testes, README e backup de arquivos.
- 2026-11-19: mudança de rota para lotes (aba "Matriz de lotes"). Feito: modelo, migrations, regras puras, services e
  rotas; banco local no Postgres do infra, com a planilha real importada (1.089 lotes, 85 pacotes automáticos).
  Depois, no mesmo dia: telas do vendedor (Lotes, pacotes, importação) e públicas, tabelas no padrão do FinMind,
  testes de integração sobre lotes (CI verde), Ajuda e decisões nesta página. Script dos arquivos órfãos
  (`npm run files:orphans`). Limpeza rodada no servidor em
  2026-11-19 (20 arquivos, 4,5 MB, todos dos pacotes antigos). Exportação de lotes para planilha.
- Etapa 3 (publicação) concluída em 2026-11-16. Catálogo público desde 2026-11-16; dados reais entram pelas telas.
