# CLAUDE.md

Guia para quem (pessoa ou agente) for trabalhar neste repositório. O `README.md` explica o que o sistema faz e como
rodar; este arquivo resume as regras e convenções a seguir antes de mexer no código, e não repete o README.

## Propósito

MineRecycle: plataforma **temporária** (cerca de 6 meses a partir de 2026-11) que conecta vendedores e compradores dos
ativos de um projeto de mineração paralisado. São 22 pacotes de venda, ~10 vendedores, site em inglês (português
como opção) e **sem preço público**. Dois tipos de pacote: a granel (`bulk`, vendido em bloco) e equipamento
(`equipment`, por equipamento ou conjunto). Locais principais: Conceição do Araguaia, Uberaba e Niquelândia; um pacote
pode ter vários locais (ver decisão de 2026-11-16).

Por ser temporário e pequeno, prefira o simples: nada de fila, cache distribuído, microsserviço ou camada nova
sem necessidade concreta.

## Restrições permanentes

- **Dados do cliente são confidenciais.** `_sample-data/` (planilhas e PDFs reais) está no `.gitignore` e nos
  `.dockerignore` e **nunca** vai para commit, imagem Docker ou log. Só é lido localmente por
  `backend/scripts/seed-sample.js`, que imprime apenas contagens. Em teste, exemplo ou documentação, use **dados
  fictícios**.
- **No servidor, itens e arquivos reais entram só pelas telas** (importação de planilha e envio de arquivos da área do
  vendedor), nunca por repositório, imagem ou pasta copiada.
- **Cadastro dos pacotes (decisão de 2026-11-16):** nome público, pasta no STOR, números, tipo, locais e códigos STOR
  entram por **migration de dados versionada e idempotente**, que identifica o pacote pela pasta no STOR e não
  sobrescreve o que o vendedor editou. Estrutura sempre por migration. Nada de editar registro à mão no banco, nem no
  local. Sem preço, valor ou comprador nos scripts. O que ainda não foi publicado fica listado em
  `docs/carga-de-dados.md`, seção "Pendente de publicação", atualizada a cada ajuste.
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
| Prévia | Basic Auth no nginx do frontend, por `SITE_PASSWORD` (vazio = aberto). Usada só no início; desligada em 2026-11-16 a pedido do usuário. |
| Catálogo | Regra fixa desde 2026-11-17 (`PUBLIC_STATUSES`): ativos; em negociação só com a caixa "Mostrar pacotes em negociação" (a página do pacote em negociação é pública); vendidos, rascunhos e inativos nunca. A antiga escolha na tela Settings saiu. O link do comprador mostra todos os pacotes do link menos rascunho e inativo: vendidos aparecem (podem ser do comprador). |
| Reimportação | Substitui todos os itens do pacote; anexos ligados a itens são religados pelo nº do item. |
| Vendedores | Uma equipe só: todos editam todos os pacotes, cada um com login próprio. Papéis `seller` e `admin`. |
| Idioma | Inglês padrão, português opcional, bandeirinha na barra superior; a escolha fica no navegador. O conteúdo cadastrado (nomes, descrições, itens) não é traduzido. |
| Publicação | Começa já com dados reais, entrados pelas telas, atrás da senha da prévia. |
| Backup | Banco: coberto pelo `backup.sh` do `servidor02-infra` (todos os databases). Arquivos: `scripts/backup-files.sh`, tar diário local (7 diários + 4 semanais), cópia externa opcional. Em aberto: o usuário vai confirmar o snapshot semanal da Oracle e se o bucket de backup está em uso. |

| Planilha da importação (2026-11-16) | A planilha original guardada na importação só pode ser vista por vendedor logado, nunca pelo comprador com link: visibilidade de anexo `internal` (além de `public` e `restricted`). |

| Pacotes e locais (2026-11-16) | Nome do pacote (`name`) = **nome público** em inglês. A pasta do STOR fica em `stor_folder`, grafia original, só para vendedores; é a chave estável dos scripts de dados. Números do pacote (`stor_numbers`) = IDs da planilha de estratégia de vendas, não do nome da pasta (o hífen é "e": "1-6" = [1, 6]); não são chave. Catálogo, lista do vendedor e link do comprador ordenam pelo menor número e depois pelo nome; o comprador não vê número nenhum (o nº do catálogo só fica na URL). Um pacote tem uma lista de locais (`locations`), só com fonte em documento; "a confirmar" pode ficar junto de outros. Uma planilha por pacote. Superbid, 32-Project e 32-BULK Sale não viram pacote. Detalhes em `docs/carga-de-dados.md`. |
| Documentos STOR (2026-11-16) | O pacote guarda os códigos (7 dígitos) das suas planilhas no STOR (`stor_documents`), visíveis só para vendedores. A importação lê o código no nome do arquivo e confirma, avisa (outro pacote, exige confirmação) ou oferece ligar o código ao pacote. Códigos em `stor_documents_pending` estão pendentes de validação: a importação deles exige confirmação. |

| Escopo e Steel Structure (2026-11-16) | São 22 pacotes (não "cerca de 25"). O Guia explica por que o site mostra pacotes, e não os ~60 mil itens do projeto (seção "Por que não são 60 mil itens", pública por decisão do usuário). A planilha 1809537 existe, mas é uma **proposta** (preço e valor): fica ligada ao Steel Structure como pendente, nunca é importada; os itens desse pacote entram à mão. |

| Senha (2026-11-17) | Mínimo de 9 caracteres (antes 10), na criação de usuário, na troca de senha e no admin inicial. Constante `MIN_PASSWORD_LENGTH` em `auth.service.js`. |

| Exclusão de usuário (2026-11-17) | Exclusão **lógica** (`app_user.deleted_at`; excluído fica também inativo, por CHECK). Some da lista, não entra e a sessão aberta cai na próxima requisição. Incluir de novo o mesmo e-mail reativa o registro com os dados novos, mantendo o histórico. Ninguém exclui a si mesmo (por isso sempre sobra um admin ativo). Desativar continua existindo, para afastamento temporário. |

| Cartão do catálogo sem foto (2026-11-17) | Variação "etiqueta de inventário": fundo na cor da **categoria** do pacote (campo `category`: refractories, electrical, piping, process_equipment, office, other; CHECK no banco), ícone da categoria ao fundo e um número em destaque em Barlow Condensed (hospedada em `frontend/public/fonts`, licença OFL junto). Número: equipamento = unidades (soma de PC/SET/KIT dos itens principais); a granel = peso total quando todos os itens estão em KG ou T; senão, número de itens (regra pura em `domain/card-highlight.js`). Foto pública substitui o cartão. Sem foto de banco de imagens. |

| Origem e filtros (2026-11-17) | Origem (de onde vieram os ativos) ≠ Local (onde estão). Tabela `origin` (nome, sigla, ativa), referência obrigatória no pacote; ANM para todos, VTM para "30-Niquelândia" (migration de dados). Cadastro em Settings, só admin; sem exclusão, só desativar. Catálogo e link do comprador: busca (nome, descrição, itens), chips de Tipo, Origem (só com mais de uma origem visível) e Local (sem "A confirmar"), com contagens que consideram os outros filtros; filtros na URL; regra pura em `domain/catalog-filter.js`. |
| Pedidos dos compradores (2026-11-17) | Na página do pacote: formulário de pedido (tabela `inquiry`) e o contato comercial da equipe (e-mail e WhatsApp, em Settings, só admin altera; links com o pacote já preenchido). Um pacote por pedido. Campos nome, empresa, e-mail, telefone, país e "mais informações", nenhum obrigatório sozinho, mas exige e-mail ou telefone. Sem campo de preço ou oferta. Visitante e comprador com link pedem; pacote vendido não recebe pedido (`canSendInquiry` em `access-policy.js`). Atendimento só no painel (aba Pedidos), sem e-mail de aviso por enquanto: responsável ("Assumir"), situação (novo, em atendimento, concluído, descartado), nota interna e quem alterou por último. Anti-spam: campo isca e limite por IP. |
| Pedidos: contato direto, desfecho e "Como funciona" (2026-11-17) | Contato que chegou por e-mail, WhatsApp, telefone ou outro é registrado à mão pelo vendedor ("Novo pedido", campo `channel`; "form" é só o do site), nasce em atendimento com quem registrou como responsável. Responsável é sempre um usuário ativo do sistema (quem não usa o sistema não atualiza o pedido; pessoa de fora vai na nota). Desfecho (`outcome`: vendido para este comprador, não avançou, sem resposta) só em pedido concluído: escolher o desfecho conclui, sair de concluído apaga (regra pura em `domain/inquiry-state.js`, CHECK no banco). Ajuda ganhou a aba "Como funciona" (processo de ponta a ponta e o que cada situação do pacote libera), primeira aba da Ajuda. |
| Termo "catálogo" (2026-11-17) | A página pública de pacotes se chama **catálogo** em todo lugar (tela, Ajuda, documentação, comentários), como no menu e no código (`catalog`). Não use "vitrine" (só sobrou em migrations já aplicadas). O link do comprador não é o catálogo: é a lista de pacotes que o link libera. |
| IA no importador: provedor e chave (2026-11-18) | Google Gemini, pelo SDK oficial, isolado em `backend/src/ai/`. Como no FinMind (ADR 0156 de lá): **uma** chave para o sistema, cadastrada pelo admin em Settings e guardada na tabela `setting` **cifrada** (AES-256-GCM, segredo mestre `CONFIG_ENCRYPTION_KEY` só no `.env`); a chave nunca volta para o frontend (só "cadastrada", os 4 últimos caracteres, quem e quando) e é testada no Gemini antes de gravar. Modelo em `GEMINI_MODEL`, no `.env`. Sem chave, o sistema sobe normalmente e só as funções de IA falham, com erro claro ao usar. |
| Importador com IA: decisões de desenho (2026-11-18) | Modo "adicionar": os itens novos do nível de cima continuam a partir do maior nº inteiro do pacote e os filhos levam o novo prefixo ("5.1" vira "N.1"). Fotos continuam em WebP (não PNG). O resultado da extração fica só em memória; o `extraction_job` guarda situação, erro e consumo, e se uma publicação reiniciar o backend o usuário refaz a extração. `.doc` e `.ppt` não são aceitos para extração: pedir PDF. Prévia: grade completa e editável (paginada), em qualquer caminho (planilha ou IA); nada é gravado antes da confirmação. |
| Lista de pacotes do vendedor (2026-11-17) | Situação em chips com contagem (considera os outros filtros, não a própria situação); Tipo, Origem e Local em select; filtros na URL; a busca olha também a descrição dos itens, como o catálogo. |

| Logo da Horizonte Minerals (2026-11-18) | MineRecycle continua a marca principal; a Horizonte entra como dona dos ativos, no rodapé ("Asset sale of" + logo colorida). SVGs em `frontend/public/brand/` (colorida e branca, esta para fundo escuro, ainda sem uso). O SVG atual é um redesenho: trocar pelo arquivo oficial quando a empresa enviar. |
| Largura das páginas (2026-11-18) | Uma largura só para o site todo, inclusive a área do vendedor (a área larga, em tela cheia, foi testada e rejeitada): `container-xl`, com teto de 1560 px a partir de 1680 px de janela (no Bootstrap, 1320); nessa faixa o catálogo mostra 5 cartões por linha. Barra superior e rodapé (fixo no pé da tela, com sombra) acompanham. |
| Edição dos dados do pacote (2026-11-18) | A aba Detalhes do vendedor só mostra os dados; "Editar" abre um modal com o formulário (o mesmo `PackageForm` de Novo pacote), Cancelar e Salvar. O modal é persistente (clique fora e Esc não fecham) e rolável (botões sempre à vista); cada abertura parte do que está gravado; erro mantém o modal aberto. Nada de edição pendente fora do modal. |

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
  colunas são `snake_case` (`underscored: true`). Valores de domínio também viram `CHECK` no banco (tipo, local,
  situação, tipo e visibilidade de anexo, proposta nunca pública). A tabela de usuários é `app_user` (`user` é
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
- **Publicado em 2026-11-16** em https://minerecycle.weslab.com.br. A senha da prévia foi desligada no mesmo dia (`SITE_PASSWORD` vazio no `.env` do servidor): o catálogo é público, e o NPM força HTTPS. Push na `main` publica sozinho (variável `DEPLOY_ENABLED=true`). Como está montado:
  - `deploy.yml` com build arm64 no runner `ubuntu-24.04-arm`, imagens `ghcr.io/<owner>/minerecycle-backend` e
    `minerecycle-frontend`, e SSH na `servidor02` rodando `scripts/deploy.sh` (pull, up, migrate, seed).
  - App em `/opt/apps/minerecycle/app`, projeto Compose `minerecycle`.
  - Database e usuário criados por `servidor02-infra/postgres/scripts/criar-app.sh minerecycle`, alcançados pela rede
    Docker externa `db`.
  - Volume `minerecycle_file_storage` para os arquivos.
  - Proxy host no NPM: `minerecycle.weslab.com.br` → `127.0.0.1:8085`.
  - Uma linha nova no cron do usuário `deploy` para `scripts/backup-files.sh`.

## Status

- Etapa 1 (plano) e etapa 2 (versão local) concluídas em 2026-11-16: catálogo, área do vendedor, importação de
  planilha, link do comprador, Settings, usuários, i18n, seeds, testes, README e backup de arquivos.
- `_sample-data/` ainda vazia: `seed:sample` pronto, mas não validado com os arquivos reais do cliente.
- Etapa 3 (publicação) concluída em 2026-11-16. Catálogo público desde 2026-11-16; dados reais entram pelas telas.
