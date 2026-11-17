# Carga de dados: do STOR para o MineRecycle

Referência para repetir a carga dos pacotes de venda: de onde vêm as planilhas, como baixá-las do STOR, quais
servem para importar e como o importador do MineRecycle as trata. A Parte 3 foi escrita a partir do código
(estado de 2026-11-16); onde o código diverge do esperado, a diferença está em [Pendências](#parte-4-pendências).

> **Confidencialidade.** As planilhas originais ficam só na máquina local, em
> `C:\Source\MineRecycle\_sample-data\stor`. A pasta `_sample-data/` está no `.gitignore` e nos `.dockerignore`
> (raiz, `backend/` e `frontend/`), então não vai para commit nem para imagem Docker. No servidor, os dados entram só
> pelas telas da área do vendedor. Este documento não traz usuários, senhas, preços, valores nem nomes de compradores
> ou proponentes; mantenha assim.

---

## Parte 1: Origem dos dados

**Fonte:** STOR Global, sistema de gestão de documentos e materiais do cliente. Acesso web em
`stor.storglobal.com/storweb`, projeto **ANM - Araguaia Nickel Project**. Peça o acesso ao cliente; credenciais não
ficam neste repositório.

O que se sabe do STOR:

- O **Mestre de Materiais** tem cerca de 61 mil itens e a árvore da **Planta de Processo** cerca de 60 mil linhas.
  Isso é o **projetado**, não o que está à venda.
- O que está à venda está organizado em **pacotes**, em pastas do módulo Documento:
  `Suprimentos/Supply > Projeto Araguaia - ANM > Assets Sales > Packages`.
- Cada pacote tem **sua própria planilha**, feita à mão, cada uma num formato. Não há lista mestra única, e a maioria
  não tem código que permita cruzar com o cadastro do STOR.
- Três locais físicos principais: **Conceição do Araguaia**, **Porto Seco de Uberaba** e **Niquelândia**. Há também
  itens em Belo Horizonte (móveis) e itens ainda no fornecedor (ver abaixo).
- Dois tipos de pacote: **a granel** (vendido por peso ou lote fechado; `bulk` no sistema) e **equipamentos**
  (`equipment`).

### Pacotes, numeração e locais (levantamento de 2026-11-16)

Não há documento de controle de pacotes no STOR. A lista de pacotes saiu das **pastas** de `Packages` (24 pastas) e
foi conferida com a planilha **Asset Sale Strategy Plan - WIP - Jan25** (1810547), liberada pelo cliente. A 1810547
tem valores de avaliação e de aquisição e uma aba de compradores com contatos: **nunca importar nem anexar**; fica só
em `_sample-data`.

**Campos de identificação do pacote** (migration `20261116210000-package-stor-folder`):

| Campo | O que é | Quem vê |
|---|---|---|
| Nome público (`name`) | Nome em inglês, editável pelo vendedor | Todos (vitrine, link do comprador) |
| Pasta no STOR (`stor_folder`) | Nome da pasta, grafia original (inclusive "28-Pipping"). **Chave estável** dos scripts de dados; única | Só vendedores |
| Números do pacote (`stor_numbers`) | IDs dos ativos na planilha de estratégia | Só vendedores (coluna "Nº STOR") |
| Documentos STOR (`stor_documents`) | Códigos das planilhas do pacote | Só vendedores |
| Pendentes de validação (`stor_documents_pending`) | Códigos que ainda não devem ser importados | Só vendedores |
| Nº do catálogo (`number`) | Sequência própria, gerada sozinha; só aparece no endereço da página pública | Ninguém na tela pública |

**Regra dos números.** A fonte é a planilha de estratégia (aba "Cash Flow_Lenders Presentation"), não o nome da pasta.
O hífen no nome da pasta quer dizer **"e"**: "1-6 Refractories" são os IDs 1 e 6 (os IDs 2 a 5 são o forno elétrico).
Um número só entra no pacote quando o nome do ativo na planilha corresponde claramente ao pacote; nos casos duvidosos,
a lista fica vazia (ver "Números a confirmar"). Os números não são chave: o mesmo ID aparece em mais de um pacote (10
e 12 em Dryer e Kiln; 20 nos dois de Construction Materials).

**Ordenação** (vitrine, lista do vendedor e link do comprador): menor número do pacote, depois o nome público;
pacotes sem número vão para o fim. O comprador não vê os números.

**Locais: só com fonte em documento.** Locais aceitos: Conceição do Araguaia, Uberaba, Niquelândia, Belo Horizonte,
No fornecedor e A confirmar. "A confirmar" pode ficar junto de locais conhecidos ("está aqui, e pode haver partes em
outro lugar").

**Uma planilha por pacote.** A importação substitui todos os itens do pacote, então cada planilha precisa do seu
próprio pacote. Quando uma pasta do STOR tem uma planilha por local (caso de "1-6 Refractories"), ela vira um pacote
por local, com a pasta "<pasta> – <local>".

**Não viram pacote:** 18-20-Superbid (contrato de leilão), 32-Project (venda do projeto inteiro) e 32-BULK Sale
(negociação de vários pacotes juntos, com pastas de proponentes). Pick-Ups entra como vendido.

#### Cadastro dos pacotes

Feito pela migration de dados `20261116210100-data-package-catalog` (ver "Pendente de publicação"). Todos em
rascunho, menos Pick-Ups (vendido). Na ordem da lista:

| Nº | Pasta no STOR | Nome público | Tipo | Locais | Fonte do local | Documentos (pendentes em **negrito**) |
|---|---|---|---|---|---|---|
| 1-6 | 1-6 Refractories – Conceição do Araguaia | Refractories – Conceição do Araguaia | a granel | Conceição do Araguaia | título da planilha 1809438 | 1809438 |
| 1-6 | 1-6 Refractories – Porto Seco de Uberaba | Refractories – Uberaba Dry Port | a granel | Uberaba | título da planilha 1809439 | 1809439 |
| 7-8-11 | 7-8-11 Crushers | Crushers | equipamento | A confirmar | — | — |
| 9-10-12 | 9-10-12 Dryer | Rotary Dryer | equipamento | Uberaba, A confirmar | 1808811: 4 itens "Dryer" em "9 EADI UBERABA" | — |
| 10-12-13 | 10-12-13 Kiln | Rotary Kiln | equipamento | Uberaba, No fornecedor, A confirmar | Uberaba: 1808811 (4 itens "Kiln", 8 do precipitador, 1 do transporte pneumático) e 1809514 (9 remessas do precipitador). Fornecedor: 1809514 (2 remessas "0 FORNECEDOR") | — |
| 17 | 17-Laboratory | Laboratory Equipment | equipamento | Uberaba | 1808811, linhas "Laboratory" | — |
| 19 | 19-30-Steel Structure | Steel Structure | a granel | A confirmar | antes "Conceição do Araguaia", por inferência; retirado | **1809537** |
| 20 | 20 Construction Materials_Rebar | Construction Materials – Rebar | a granel | A confirmar | — | 1809548 |
| 20 | 20 Construction Materials_tools and misc | Construction Materials – Tools and Miscellaneous | a granel | A confirmar | — | **1809564** |
| 22 | 32-ETE ETA | Water and Effluent Treatment Plants | equipamento | A confirmar | — | — |
| 24 | 24-LT 230kV | 230 kV Transmission Line | a granel | A confirmar | — | **1809565** |
| 25-26 | 25-26 Electrical Substation Equipment | Electrical Substation Equipment | equipamento | A confirmar | — | — |
| 27 | 27-Electrical Cables | Electrical Cables | a granel | A confirmar | — | 1809595 |
| 28 | 28-Pipping | Piping | a granel | A confirmar | — | 1809606 |
| 29 | 29-Conveyors | Belt Conveyors | equipamento | Conceição do Araguaia | 1809615 ("Inventario site") | 1809615 |
| 30 | 30-Niquelândia | Niquelândia Refinery Equipment | equipamento | Niquelândia | nome da pasta | **1809007** |
| — | 32-Compressed Air | Compressed Air System | equipamento | A confirmar | — | — |
| — | 27-Electrical Materials | Electrical Materials | a granel | A confirmar | — | 1809601 |
| — | TI e Escritório | IT and Office Furniture | a granel | Belo Horizonte | subpasta "Fotos Móveis BH" | 1809790 |
| — | Módulos Escritório | Office Modules | a granel | Conceição do Araguaia | planilha 1808778 (site) | 1809779 |
| — | 33-OTHER EQUIP | Other Equipment | equipamento | A confirmar | — | — |
| — | Pick-Ups | Pick-up Trucks | equipamento | A confirmar | — (situação: vendido) | — |

Correção de 2026-11-16: o Kiln tinha "Conceição do Araguaia", tirado de uma leitura de "10 ENTREGUE" como "entregue
na obra" (dedução, sem documento). Saiu. Pelo mesmo critério, Steel Structure voltou para "A confirmar".

#### Planilhas pendentes de validação

Ligadas ao pacote, mas a importação pede confirmação (erro `IMPORT_DOCUMENT_PENDING` sem ela):

| Código | Pacote | Motivo |
|---|---|---|
| 1809564 | Construction Materials – Tools and Miscellaneous | Valores, abas ocultas e linhas filtradas; o cliente vai definir o que está à venda |
| 1809565 | 230 kV Transmission Line | Quantidades de engenharia: confirmar se é o disponível ou o projetado |
| 1809007 | Niquelândia Refinery Equipment | Mais de mil linhas, com miudezas e colunas de valor. Os equipamentos principais entram à mão; não importar a planilha inteira |
| 1809537 | Steel Structure | É uma **proposta** (proponente, data, preço por tonelada e valor; uma coluna estava oculta), não lista de itens. Nunca importar. Serve só de referência para cadastrar à mão as linhas do pacote, por exemplo "já desmontada" e "a desmontar", em toneladas, depois de o cliente confirmar as quantidades |

#### Números a confirmar

Pacotes sem correspondência clara na planilha de estratégia (lista vazia, ou só o número que bate):

| Pacote | Pasta diz | Candidato na planilha | Situação |
|---|---|---|---|
| Electrical Materials | 27 | 27 é "Electric Cables" | Vazio: nenhum ID de materiais elétricos |
| Compressed Air System | 32 | 31 "Ingersoll Compressors" | Vazio: correspondência provável, não confirmada |
| Office Modules / IT and Office Furniture | — | 18 "Offices and Materials" | Vazio: o 18 também está em "18-20-Superbid" |
| Other Equipment | 33 | "OTHER EQUIPMENT & MATERIALS", sem ID | Vazio: a planilha não numera |
| Steel Structure | 19-30 | 19 "Steel Structure"; 30 é Niquelândia | Só o 19 |
| Water and Effluent Treatment Plants | 32 | 22 "WTP / WWTP" | 22 (o nome bate) |

#### Relação da planilha de estratégia (só identificação)

Aba "Cash Flow_Lenders Presentation", coluna ID e nome do ativo. Valores, situação comercial, fornecedores e
compradores ficaram de fora.

| ID | Ativo | Pacote no MineRecycle |
|---|---|---|
| 1 | Refractory Materials for Electric Furnace and Morgan Refractories | Refractories (os dois) |
| 2 | Copper Electric Furnace | **sem pacote** |
| 3 | Electric Furnace Transformer | **sem pacote** |
| 4 | Calcined Transfer System | **sem pacote** |
| 5 | Remaining of the Electric Furnace | **sem pacote** |
| 6 | Refractories | Refractories (os dois) |
| 7 | Primary Crusher | Crushers |
| 8 | Secondary Crusher | Crushers |
| 9 | Drying Furnace | Rotary Dryer |
| 10 | Calcination Furnace | Rotary Dryer e Rotary Kiln |
| 11 | Tertiary Crusher | Crushers |
| 12 | Drying and Calcination Precipitators | Rotary Dryer e Rotary Kiln |
| 13 | Pneumatic Transport System | Rotary Kiln |
| 14 | Water Pumps from the Water Capture System | **sem pacote** |
| 15 | Coal Equipment | **sem pacote** |
| 16 | Refining System (Refinery + Granulation) | **sem pacote** |
| 17 | Laboratory | Laboratory Equipment |
| 18 | Offices and Materials | pasta 18-20-Superbid (sem pacote); ver "Números a confirmar" |
| 19 | Steel Structure | Steel Structure |
| 20 | Construction Materials Leftovers - Rebar | Construction Materials – Rebar |
| 20 | Construction Materials Leftovers - tools and safety equipment | Construction Materials – Tools and Miscellaneous |
| 21 | Warehouse Shed | **sem pacote** |
| 22 | WTP / WWTP (Water Treatment Plant / Wastewater Treatment Plant) | Water and Effluent Treatment Plants |
| 23 | Cooling Tower | **sem pacote** |
| 24 | 230 kV Transmission Line | 230 kV Transmission Line |
| 25 | Transformers and Generators of Araguaia & Xinguara Substations | Electrical Substation Equipment |
| 26 | Araguaia & Xinguara Substations (Remaining) | Electrical Substation Equipment |
| 27 | Electric Cables | Electrical Cables |
| 28 | Piping | Piping |
| 29 | Conveyors | Belt Conveyors |
| 30 | Niquelândia Package | Niquelândia Refinery Equipment |
| 30.1 | Niquelândia Package - Equipment | Niquelândia Refinery Equipment |
| 31 | Ingersoll Compressors | provável Compressed Air System |
| 32 | GENERAL - Plant / Equipment | pastas 32-BULK Sale e 32-Project (sem pacote) |
| — | Other equipment & materials: Containers, Truck Scale, Electrical Hoist, Water Tanks, Skylight, Truck Washer, Heat Exchanger | provável Other Equipment |

A planilha também tem um bloco "Assets at Vendors that could be recovered/sold" (bens ainda nos fornecedores), sem
ID: forno elétrico, fornos rotativos e secadores, subestação secundária, filtros de manga, precipitador eletrostático,
STATCOM, máquina de vazamento e trilhos.

### Passo a passo da exportação

1. Abrir **Documento > Gestão de Documentos**.
2. Na árvore de pastas, selecionar **Assets Sales**.
3. Digitar o código do documento no campo de busca e clicar na lupa. A busca só funciona com uma pasta selecionada e
   é recursiva (procura nas subpastas).
4. Marcar a linha e clicar em **Download**.
5. Salvar em `C:\Source\MineRecycle\_sample-data\stor`. O nome do arquivo já vem com o código
   (`<código>_REV0_VER0_<título>.xlsx`).

**Cuidados:** usar somente **Download**. Não usar Novo, Importar, Salvar nem Enviar. Na tela de detalhes de um
documento, sair por **Cancelar**.

**Observação técnica:** grades do STOR exportadas para Excel (arquivos `DataGrid*.xlsx`) vêm com validações de dados
inválidas, que quebram a leitura por `openpyxl`. É preciso remover o bloco `dataValidations` do XML antes de ler. Isso
não afeta as planilhas baixadas pelo Download de documentos, que são as usadas na carga.

---

## Parte 2: Inventário das planilhas baixadas

### Prontas para importar

| Código | Planilha | Pacote | Linhas | Cabeçalho | Item | Descrição | Quantidade | Unidade |
|---|---|---|---|---|---|---|---|---|
| 1809601 | 17-06 Material Elétrico sem preço | 27 Electrical Materials | 561 | linha 1 | Item | Descrição dos Materiais | Qtde | U.M |
| 1809595 | Relação de Cabos | 27 Electrical Cables | 37 | linha 1 | **não tem** | Descrição | Quantidade (metros) | fixa: m |
| 1809548 | Vergalhões Peso Total Estimado | 20 Construction Materials, Rebar | ~10 | linha 3 | **não tem** | VERGALHÃO | KG | fixa: kg |
| 1809438 | Refratários - Conceição do Araguaia | 1-6 Refractories – Conceição do Araguaia | 149 | linha 1 | **não tem** | DESCRIÇÃO | QANTIDADE TOTAL | UND |
| 1809439 | Refratários - Porto Seco de Uberaba | 1-6 Refractories – Porto Seco de Uberaba | 150 | linha 1 | Cód. Item | Descrição do Item | Quantidade | UM |
| 1809615 | Correia Transportadora - MDE_Inventario site | 29 Conveyors | 23 | linha 1 | Cód. Item | Descrição do Item | Quantidade | Unidade de Medida do Stor |

Campos extras aproveitáveis:

- **1809438:** STOR (código), LOCALIZAÇÃO, CATEGORIA e FORNECEDOR.
- **1809439** e **1809615:** Cód. Item (código STOR), Parceiro (fornecedor), peso e dimensões.

Só STOR → *Código STOR* e LOCALIZAÇÃO → *Localização no almoxarifado* têm campo no sistema. Categoria, fornecedor,
peso e dimensões não têm (ver Parte 3, pergunta 4).

> As planilhas sem coluna de item (**1809595, 1809548, 1809438**) usam a opção *numerar pela ordem das linhas*
> (Parte 3, pergunta 7). Nas planilhas de unidade fixa (1809595 e 1809548), ainda é preciso inserir numa cópia local
> uma coluna "UN" com `m` ou `kg`, porque o importador não aceita unidade fixa. Na 1809438, a quantidade é a coluna
> **QUANTIDADE TOTAL** (em kg), não QTD (nº de embalagens); PACOTE é o peso da embalagem e fica sem mapear.

### Importar com atenção (têm colunas de valor que não devem ser mapeadas)

| Código | Planilha | Pacote | Aba a usar | Colunas úteis | Não mapear |
|---|---|---|---|---|---|
| 1809606 | Tubulação | 28 Piping | Master List - Tub. Hidra (cabeçalho na linha 2, 693 linhas) | ITEM, DESCRIÇÃO, Diametro, QUANT., UNID., Fornecedor | colunas de preço e total; as demais abas são equalização de propostas |
| 1808811 | Uberaba Dry Port Assets List r1 | Equipamentos em Uberaba | Uberaba Dry Port (linha 1, 85 linhas) | Supplier, Main Equipment, Item Code, Item Description, Measury Unit, Quantity, Current Location | FOB Amount |
| 1809007 | CBA Assets List r1 | 30 Niquelândia | Lista MM (cabeçalho na linha 3) | Item - description, Unity measure, Quantity, Local, Análise | colunas de valor; aba "Lista 55 itens" |
| 1809779 | Estruturas Modulares | Módulos Escritório | Módulos (linha 1, 33 linhas) | Material, Texto Breve, UM, Quantidade | Valor Total |
| 1809790 | Móveis no box | TI e Escritório | Planilha1 (linha 1, 367 linhas) | nome do imobilizado, nº de inventário | colunas contábeis |

Nestas cinco, só não mapeie as colunas de valor: elas não entram no banco. Se a opção "Guardar a planilha como arquivo
interno do pacote" ficar marcada (padrão), o arquivo inteiro, com os valores, fica guardado como anexo **interno**,
que só vendedores logados veem; o comprador com link não o recebe (Parte 3, pergunta 5).

A 1809606 é `.xlsm` e o importador só aceita `.xlsx` e `.xls`: salve uma cópia como `.xlsx` antes de enviar.

### Não importar como linhas de pacote

| Código | Planilha | Motivo | Uso |
|---|---|---|---|
| 1809516 | IT1761-23 - COMPILATED PL - IMM | Romaneio de volumes, não lista de peças | Anexo do pacote 10-12-13 Kiln |
| 1809567 | Linha Transmissão - 26-06-2025 | Lançamentos contábeis | Nenhum |
| 1809564 | Bens adquiridos_Consórcio Araguaia | Valores em todas as abas, abas ocultas, linhas filtradas | Aguardar o cliente definir quais linhas estão à venda |
| 1808777 | Lista de Equipamentos Mecânicos (Anexo 05) | Lista de engenharia, o projetado | Referência técnica: código STOR, tag, descrição em inglês |

### Pacotes sem planilha no STOR (cadastrar manualmente)

Laboratory, Superbid, Steel Structure (vendido por tonelada; a 1809537 é proposta, não lista), Electrical Substation, Crushers, Dryer, Compressed Air,
ETE/ETA, Project, Other Equip, Pick-Ups.

Na área do vendedor: criar o pacote e incluir as linhas uma a uma pelo botão de nova linha
(`LineFormModal.vue`), ou montar uma planilha local simples (Item, Descrição, Quantidade, UN) e importá-la.

---

## Parte 3: Importação no MineRecycle

> **Para o usuário:** o passo a passo de exportação do STOR e de importação está também no sistema, no menu
> **Ajuda** da área do vendedor (`/seller/help`, [`HelpView.vue`](../frontend/src/views/seller/HelpView.vue); textos
> em `help.*` de `i18n/en.js` e `i18n/pt.js`). Ao mudar o processo, atualize os dois lugares.

### Roteiro sugerido para a primeira carga (uma planilha por vez)

| Ordem | Código | Pacote | Aba / cabeçalho | O que esperar |
|---|---|---|---|---|
| 1 | 1809601 | 27 Electrical Materials | 1ª aba, linha 1 | Mapeamento automático acerta tudo (561 linhas) |
| 2 | 1809779 | Módulos Escritório | Módulos, linha 1 | Não mapear Valor Total; cerca de 9 linhas com erro |
| 3 | 1809606 | 28 Piping | Master List - Tub. Hidra, linha 2 | Não mapear preço nem total; muitas linhas com erro (cerca de 300 na simulação), verificar o motivo |
| 4 | 1809439 | 1-6 Refractories – Porto Seco de Uberaba | linha 1 | Mapear à mão "Cód. Item" como nº do item e "UM" como unidade |
| 5 | 1809615 | 29 Conveyors | linha 1 | Igual à 1809439 |
| 6 | 1808811, 1809007, 1809790 | ver Parte 2 | ver Parte 2 | O mapeamento automático não reconhece as colunas; mapear à mão |
| 7 | 1809438, 1809595, 1809548 | ver Parte 2 | ver Parte 2 | Marcar "numerar pela ordem das linhas"; nas duas últimas, acrescentar antes numa cópia a coluna de unidade |

Os números de "o que esperar" vêm de uma simulação local feita em 2026-11-16 com a primeira aba e o mapeamento
automático; com a aba e o mapeamento corretos, podem mudar.

Arquivos envolvidos:

| Camada | Arquivo | Papel |
|---|---|---|
| Tela | [`frontend/src/components/seller/ImportWizard.vue`](../frontend/src/components/seller/ImportWizard.vue) | Assistente em 3 passos |
| Tela | [`frontend/src/views/seller/PackageEditView.vue`](../frontend/src/views/seller/PackageEditView.vue) | Botão "Importar planilha" no pacote |
| Rotas | [`backend/src/routes/seller.routes.js`](../backend/src/routes/seller.routes.js) | `POST /api/v1/seller/packages/:id/imports` e `.../imports/:importId/{layout,preview,commit}`, `DELETE .../imports/:importId` (exigem vendedor logado) |
| Caso de uso | [`backend/src/services/import.service.js`](../backend/src/services/import.service.js) | Guarda o arquivo, monta o relatório, grava |
| Regras puras | [`backend/src/import/spreadsheet.js`](../backend/src/import/spreadsheet.js) | Leitura (SheetJS), detecção do cabeçalho, sugestão de mapeamento |
| Regras puras | [`backend/src/import/import-plan.js`](../backend/src/import/import-plan.js) | Validação e montagem das linhas |
| Regras puras | [`backend/src/import/quantity.js`](../backend/src/import/quantity.js), [`units.js`](../backend/src/import/units.js) | Quantidade e unidade |
| Gravação | [`backend/src/services/line.service.js`](../backend/src/services/line.service.js) (`replaceLines`) | Troca as linhas do pacote numa transação |

### 1. Passo a passo do upload

Pré-requisito: o pacote já existe (área do vendedor > Pacotes > novo pacote, com tipo, local e situação).

1. **Abrir o pacote** na área do vendedor e clicar em **Importar planilha**. Abre o assistente.
2. **Passo 1 – Arquivo.** Escolher o `.xlsx` ou `.xls` e clicar em **Ler arquivo**. O servidor confere a extensão
   (`IMPORT_EXTENSIONS`), lê a pasta de trabalho, guarda o arquivo temporariamente e devolve as abas, a linha de
   cabeçalho detectada, uma prévia e um mapeamento sugerido (`import.service.js`, `start`). Limite: 50 MB
   (`UPLOAD_MAX_MB`) e 20.000 linhas de dados (`MAX_ROWS`).
3. **Passo 2 – Colunas.** Conferir aba e linha do cabeçalho (pergunta 2), ajustar o mapeamento de colunas
   (pergunta 3) e decidir duas opções:
   - *Numerar pela ordem das linhas* (marcada sozinha quando nenhuma coluna parece ser a do item): ver pergunta 7.
   - *Montar a hierarquia pelo nº do item* (marcada): "1.2" vira filho de "1" quando "1" existe no mesmo arquivo.
   - *Guardar a planilha como arquivo interno do pacote* (marcada): ver pergunta 5.

   Clicar em **Conferir**. Nada é gravado ainda (`preview`).
4. **Passo 3 – Conferência.** A tela mostra quantas linhas são válidas, inválidas e filhas; o aviso de que as linhas
   atuais do pacote serão substituídas (e quantos anexos estão ligados a linhas); as unidades não reconhecidas; a
   lista de erros e avisos por linha do Excel (até 200 de cada); e as 15 primeiras linhas como ficarão.
   - Com erros, o botão de gravar fica bloqueado até marcar **Pular as linhas inválidas**.
   - Unidade não reconhecida e quantidade vazia ou ambígua são só avisos; a linha entra.
5. **Importar.** `commit` substitui as linhas do pacote numa transação, cria o anexo (se a opção estiver marcada) e
   apaga o arquivo temporário. Se der errado, volte e corrija; para desfazer depois, ver pergunta 10.

**Cancelar** ou fechar o assistente apaga o arquivo temporário (`DELETE .../imports/:importId`).

### 2. Aba e linha do cabeçalho

- **Aba:** a primeira da pasta de trabalho por padrão. Troque na lista *Aba*; a tela relê o layout dessa aba
  (`resolveLayout`). Abas ocultas também aparecem na lista.
- **Cabeçalho:** detectado automaticamente entre as 30 primeiras linhas (`detectHeaderRow`): vale a linha com pelo
  menos 3 células de texto e mais campos reconhecidos. Para trocar, digite o **número da linha do Excel** no campo
  *Linha do cabeçalho*; a prévia destaca a linha escolhida e mostra também as linhas acima dela.
- Tudo abaixo do cabeçalho é tratado como dado. Linhas em que todas as colunas mapeadas estão vazias são puladas e
  contadas como "vazias". Linhas de total ou subtotal no fim da planilha **não** são reconhecidas: aparecem como erro
  (sem nº de item ou sem descrição) e saem com *Pular as linhas inválidas*, ou devem ser removidas da cópia antes.

### 3. Campos que podem ser mapeados

Definidos em `MAPPABLE_FIELDS` / `REQUIRED_FIELDS` (`spreadsheet.js`) e validados por `validateMapping`
(`import-plan.js`). Cada coluna serve a um campo só.

| Campo | Obrigatório | Coluna no banco (`package_line`) | Limite | Cabeçalhos reconhecidos automaticamente (sem acento, espaço ou pontuação) |
|---|---|---|---|---|
| Nº do item | **sim** | `item_no` | 40 caracteres | item, itens, n, no, nr, num, numero, nitem, itemno, seq, pos, posicao |
| Descrição | **sim** | `description` | 4000 | descricao, description, material, materiais, desc, especificacao, discriminacao; ou começa com descricao/description/especificacao |
| Quantidade | **sim** (a coluna) | `quantity` | `DECIMAL(14,4)` | qtde, qtd, qt, quantidade, quant, qty, quantity; ou começa com qtde/quantidade |
| Unidade | **sim** (a coluna) | `unit` e `unit_raw` | 16 / 32 | um, unidade, und, unid, un, unit, uom, unidmedida, unidadedemedida |
| Código STOR | não | `stor_code` | 64 | stor, codigostor, codstor, storcode, codigo, cod, code; ou começa com stor/codigostor |
| Tag | não | `tag` | 64 | tag, tags |
| Localização no almoxarifado | não | `warehouse_location` | 128 | localizacao, local, endereco, almoxarifado, location, loc; ou começa com localizacao/endereco |

"Obrigatório" quer dizer que a coluna precisa estar mapeada. Por linha: nº do item e descrição vazios são **erro**;
quantidade e unidade vazias são só **aviso**. A sugestão automática não acerta todos os cabeçalhos do inventário
(por exemplo "QANTIDADE TOTAL", "KG", "Unidade de Medida do Stor", "Cód. Item"); nesses, escolha a coluna à mão.

### 4. Colunas não mapeadas

**Descartadas do banco.** `buildImportPlan` lê só as colunas do mapeamento e `replaceLines` grava só os campos da
tabela acima. Não há campo genérico nem JSON com "o resto da linha". Fornecedor, categoria, peso, dimensões e colunas
de valor não entram em `package_line`.

Mas o **arquivo inteiro** pode continuar guardado como anexo (pergunta 5), com todas as colunas.

### 5. O que acontece com o arquivo enviado

1. **Durante a importação:** fica em `imports/<id>.xlsx` no armazenamento de arquivos (volume
   `minerecycle_file_storage`; `storage/index.js`, `keys.importFile`). Só as rotas do vendedor o leem. É apagado no
   *commit* e no *cancelar*.
2. **Depois do commit, com "Guardar a planilha como arquivo interno do pacote" marcada (padrão):** vira um anexo do
   pacote do tipo `list`, visibilidade **`internal`**, em `packages/<pacote>/<anexo>/original.xlsx`
   (`import.service.js`, `commit` → `attachmentService.createFromBuffer`). Pela regra de `attachmentVisibleTo` /
   `canReadAttachment` (`domain/access-policy.js`):
   - **vendedores e admin logados**: veem e baixam;
   - **comprador com link**: não vê na lista e recebe 404 em `GET /api/v1/files/:id/original`;
   - **público anônimo**: idem, e o anexo não entra na contagem de "documentos restritos" da vitrine.

   Na tela de arquivos, o selo de um anexo interno não alterna para público ou restrito (o botão fica desabilitado);
   para mudar, apague e envie de novo. Pela API, um vendedor ainda pode mudar a visibilidade.
3. **Com a opção desmarcada:** nada fica guardado depois do commit.

Visibilidades de anexo (desde 2026-11-16): `public` (todos), `restricted` (vendedor e comprador com link) e
`internal` (só vendedor). Qualquer anexo pode ser enviado como interno na tela de arquivos.

Os arquivos do volume, inclusive os temporários, entram no backup diário (`scripts/backup-files.sh`).

### 6. Linhas ocultas ou filtradas

**São importadas.** `sheetRows` usa `XLSX.utils.sheet_to_json` sem `skipHidden`, e a leitura não carrega a
informação de linha oculta. Linhas ocultas à mão e linhas escondidas por filtro entram igual às visíveis, sem aviso.
Conferido com uma planilha fictícia de teste (linha 3 oculta: importada). O mesmo vale para colunas ocultas, que
aparecem na lista de mapeamento.

Se a linha oculta não deve entrar, apague-a numa cópia local antes de enviar.

### 7. Nº do item quando a planilha não tem

**Gerado pela ordem das linhas, se o vendedor pedir** (decisão de 2026-11-16). No passo 2, a opção *A planilha não
tem nº do item: numerar pela ordem das linhas* ignora a coluna de item e numera 1, 2, 3... pela posição entre as
linhas com dados (linha em branco não conta; linha com erro conta, então o número não muda quando ela é pulada). Sem
hierarquia nesse modo. A opção vem marcada quando nenhuma coluna parece ser a do item (`numberRows` em
`import-plan.js`).

Cuidado: numa reimportação, os anexos ligados a itens são religados pelo nº. Se o cliente mudar a ordem ou inserir
uma linha no meio, a foto do item 5 passa para a nova linha 5. A tela avisa.

Sem a opção, o nº do item continua obrigatório: linha sem nº dá erro `item_no_missing` e nº repetido no mesmo arquivo
dá `item_no_duplicate`. Mapear o código STOR como nº do item só funciona se ele não se repetir no arquivo.

### 8. Normalização de unidades

Tabela `UNIT_ALIASES` em [`backend/src/import/units.js`](../backend/src/import/units.js). A comparação ignora
maiúsculas, acentos, pontos e espaços, e troca `²`/`³` por 2/3 (então "pç", "PÇ.", "Peça" e "un" caem no mesmo
código). O valor original fica em `unit_raw`.

| Código gravado | Aceita |
|---|---|
| PC | PC, PCS, PCA, PECA, PECAS, PEC, UN, UND, UNID, UNIDADE, UNIDADES, U, EA, EACH, PIECE, PIECES |
| M | M, MT, MTS, METRO, METROS, MTR |
| M2 | M2, METROQUADRADO, METROSQUADRADOS |
| M3 | M3, METROCUBICO, METROSCUBICOS |
| KG | KG, KGS, QUILO, QUILOS, QUILOGRAMA, QUILOGRAMAS, KILO, KILOS |
| T | T, TON, TONS, TO, TONELADA, TONELADAS |
| L | L, LT, LTS, LITRO, LITROS |
| SET | SET, SETS, CJ, CJT, CJTO, CONJ, CONJUNTO, CONJUNTOS, JG, JOGO, JOGOS |
| KIT | KIT, KITS |
| ROLL | ROLL, ROLLS, RL, ROLO, ROLOS |
| BOX | BOX, CX, CXS, CAIXA, CAIXAS |
| PAIR | PAIR, PR, PAR, PARES |
| LOT | LOT, LOTE, LOTES, VB, VERBA |
| GAL | GAL, GL, GALAO, GALOES |
| BAG | BAG, SC, SACO, SACOS |
| CAN | CAN, LATA, LATAS |
| SHEET | SHEET, FL, FOLHA, FOLHAS, CHAPA, CHAPAS |
| BAR | BAR, BR, BARRA, BARRAS |
| TUBE | TUBE, TB, TUBO, TUBOS |

Unidade fora da tabela é gravada em maiúsculas, sem acento, ponto ou espaço (até 16 caracteres), e listada na
conferência como "não reconhecida". Unidade vazia fica nula, com aviso.

**Quantidade** (`quantity.js`): célula numérica do Excel entra como está; texto segue o formato brasileiro primeiro
("1.234,5" = 1234,5; "12,5" = 12,5). "1.500" é lido como mil e quinhentos, com aviso de ambiguidade. Aceita até 4
casas decimais (mais que isso arredonda, com aviso). Negativo, texto não numérico e valores a partir de 10¹⁰ são erro.

### 9. Reimportar o mesmo pacote

**Substitui.** `replaceLines` apaga todas as linhas do pacote e grava as novas, numa transação só; não acrescenta nem
duplica. A conferência avisa quantas linhas serão substituídas. Anexos ligados a uma linha (por exemplo, uma foto de
um item) são religados à linha nova de **mesmo nº de item**; se o nº sumiu, o anexo continua no pacote, sem linha.

Com "Guardar a planilha" marcada, cada reimportação cria **mais um** anexo de lista; os anteriores não são apagados.

### 10. Desfazer uma importação errada

Não há botão de desfazer nem histórico de versões das linhas. Caminhos:

1. **Reimportar a planilha certa** no mesmo pacote: substitui tudo (pergunta 9). Se a planilha anterior foi guardada
   como anexo de lista, baixe-a na tela de arquivos do pacote e importe de novo.
2. **Corrigir ou apagar linha a linha** na lista do pacote (`PATCH`/`DELETE /api/v1/seller/lines/:lineId`). Não há
   exclusão em massa de linhas.
3. **Apagar o anexo de lista** criado pela importação, se não for desejado, na tela de arquivos do pacote.
4. Em último caso, restaurar o backup do banco (pede intervenção no servidor).

Ligações de anexos a linhas que se perderam numa importação errada não voltam ao reimportar.

### Conferência das regras

| Regra | Situação | Onde |
|---|---|---|
| Só as colunas mapeadas entram no banco | **atende** | `import-plan.js` (`buildImportPlan`), `line.service.js` (`replaceLines`). Ressalva: o arquivo inteiro pode ficar guardado como anexo interno (regra seguinte). |
| O arquivo original não fica acessível por nenhuma rota pública nem como anexo do pacote | **atende** (com a decisão de 2026-11-16) | Com `keepFile` marcado, o original fica como anexo `list` **interno** do pacote: só vendedores logados o veem. Comprador com link e público recebem 404 (`access-policy.js`, testes em `access-policy.test.js` e `test/integration/access.test.js`). Antes de 2026-11-16 ele era gravado como restrito. |
| Nenhuma rota pública devolve preço ou valor | **atende** | O modelo, os DTOs e a API JSON não têm campo de preço; a planilha original, que pode ter colunas de valor, é interna. |
| Unidades normalizadas (UN, pç, PEÇ, PC → PC; MT, m → M; KG, kg → KG; BR, br → BR) | **não atende** | PC, M e KG atendem. BR/br vira **BAR**, não BR (`units.js`). |
| A quantidade aceita decimal | **atende** | `quantity.js` (vírgula ou ponto, até 4 casas) e coluna `DECIMAL(14,4)`. |

---

## Parte 4: Pendências

### No código (não alterado nesta tarefa)

1. **Resolvido em 2026-11-16:** a planilha original guardada na importação passou a ser anexo **interno** (só
   vendedores). Planilhas importadas antes disso, se houver, continuam como anexo restrito: confira os anexos de
   lista dos pacotes na tela de arquivos e, se forem planilhas com valores, apague-as.
2. **Linhas ocultas e filtradas são importadas sem aviso.** Decidir se o importador deve ignorá-las ou, ao menos,
   avisar na conferência.
3. ~~Nº do item não é gerado.~~ Resolvido em 2026-11-16: opção *numerar pela ordem das linhas* (Parte 3, pergunta 7).
4. **Sem unidade fixa.** Planilhas cuja unidade está só no cabeçalho ("Quantidade (metros)", "KG") pedem uma coluna
   de unidade inserida à mão. Avaliar uma opção "unidade fixa para todas as linhas".
5. **`.xlsm` é recusado.** A 1809606 (Tubulação) precisa ser salva como `.xlsx` antes. Avaliar aceitar `.xlsm`
   (a leitura é a mesma; macros não são executadas).
6. **BR → BAR.** A regra pedida era BR → BR; o código grava BAR. Decidir qual código vale.
7. **Arquivos temporários órfãos.** Se o navegador fechar no meio do assistente, sem cancelar, o arquivo fica em
   `imports/` para sempre (não há limpeza por idade) e entra no backup.
8. **Sem desfazer.** Não há histórico das linhas nem exclusão em massa; desfazer depende de reimportar.
9. **Campos sem lugar.** Fornecedor, categoria, peso, dimensões, diâmetro e nº de inventário não têm campo e são
   descartados. Decidir se algum deve virar campo (ou ir para a descrição numa cópia local).
10. **`seed:sample` não acha as planilhas.** `backend/scripts/seed-sample.js` lê só a raiz de `_sample-data`, sem
    subpastas; as planilhas estão em `_sample-data/stor`. Rodar com `SAMPLE_DATA_DIR=../_sample-data/stor` ou ajustar
    o script. Ele também importa toda planilha `.xlsx` da pasta, inclusive as que não devem virar linhas de pacote.

### Perguntas que o código não responde

- Qual aba e qual linha de cabeçalho usar em cada planilha: a detecção sugere, a escolha é do vendedor (Parte 2 traz
  as escolhas conhecidas).
- Quais colunas da 1809790 (Móveis no box) viram descrição e quantidade: a planilha tem nome do imobilizado e nº de
  inventário, sem quantidade nem unidade explícitas.

### Em aberto com o cliente

- Validar a lista provisória de pacotes (Parte 1): nomes, tipos e locais.
- "10 ENTREGUE", na planilha do precipitador, quer dizer entregue na obra?
- Onde estão os fornos rotativos? Aparecem como ativos no fornecedor.
- IDs repetidos (10 e 12 em "9-10-12 Dryer" e "10-12-13 Kiln"): o mesmo bem em dois pacotes, ou uma pasta substituiu
  a outra?
- Local dos pacotes marcados "A confirmar" (só entra local com fonte em documento).
- Números dos pacotes sem correspondência clara na planilha de estratégia (Parte 1, "Números a confirmar").
- Forno elétrico (IDs 2 a 5) e IDs 14, 15, 16, 21 e 23: viram pacote? Hoje não têm pasta em Packages.
- Planilhas pendentes de validação (Parte 1): 1809564, 1809565 e 1809007.
- Pick-Ups já foi vendido?
- Quais pacotes ainda estão à venda (alguns já receberam propostas).
- Linhas ocultas na planilha de refratários de Conceição do Araguaia (1809438): importar ou não.
- Critério de seleção na planilha de bens do Consórcio Araguaia (1809564).
- Fotos: no STOR só existem para transformadores, móveis de escritório e Niquelândia; os demais pacotes dependem de
  fotos novas.

---

## Parte 5: Pendente de publicação

O que já está no ambiente local e ainda não foi para o servidor. Atualizar esta seção a cada ajuste. **Nada é
publicado sem confirmação do usuário.**

Último commit publicado: `042f84e` (2026-11-17): migration 7
(`20261117090000-user-deleted-at`, exclusão lógica de usuário) e senha a partir de 9 caracteres. Antes: `9c63857`
(migration 6, 1809537 no Steel Structure), `b8cd8f6` (seção "Por que não são 60 mil itens"), `033a74f` (Ajuda com
Guia e Carga de planilhas) e `14847c9` (migrations 1 a 5 abaixo). Daqui para frente, acrescente aqui cada migration ou
mudança nova.

**Pendente agora** (sem migration; nada muda no banco):

- Configuração da vitrine (quais situações aparecem) liberada para qualquer vendedor logado, não só admin.

### Histórico: publicação de 2026-11-16 (`14847c9`)

Regras (decisão de 2026-11-16):

- **Estrutura** (campo novo, tipo de coluna): sempre por migration versionada.
- **Dados de cadastro dos pacotes** (nome público, pasta, números, tipo, locais, documentos STOR, pacotes criados ou
  divididos): por migration de dados versionada e idempotente, identificando o pacote pela **pasta no STOR**. Ela
  roda uma vez por banco e não sobrescreve o que o vendedor editou. Sem preço, valor ou comprador.
- **Itens**: só pelo upload na área do vendedor. As planilhas não entram no repositório.
- Nada de editar registros à mão no banco.

### Migrations, na ordem em que rodam no servidor

Todas rodam pelo `npm run db:migrate` do `scripts/deploy.sh`, depois do pull das imagens novas.

| # | Migration | O que altera no servidor |
|---|---|---|
| 1 | `20261116180000-attachment-internal-visibility` | Regras do banco passam a aceitar a visibilidade `internal` em anexo. Nenhum dado muda. |
| 2 | `20261116190000-package-locations` | `package.location` vira a lista `locations`; cada pacote existente fica com o seu local atual. |
| 3 | `20261116200000-package-stor-documents` | Coluna `stor_documents` (vazia). |
| 4 | `20261116210000-package-stor-folder` | Colunas `stor_folder`, `stor_numbers`, `stor_documents_pending` (vazias). |
| 5 | `20261116210100-data-package-catalog` | Cria os 22 pacotes da Parte 1 que não existirem (rascunho; Pick-Ups vendido). Pacote que já existir com o nome igual ao da pasta é reconhecido e completado, sem perder o que o vendedor editou. Não mexe em itens, anexos nem situação de pacote existente. Sem volta automática (`down` vazio). |

Testado em banco vazio, rodando duas vezes, no estado do banco local antes desta mudança e com pacote editado pelo
vendedor (`backend/test/integration/data-package-catalog.test.js`). Consulta ao servidor em 2026-11-16 (só a API
pública): nenhum pacote ativo na vitrine; rascunhos não são visíveis por ela.

### Código (vai junto, na mesma publicação)

- Anexo interno: a planilha guardada na importação só é vista por vendedores.
- Vários locais por pacote; locais novos (Belo Horizonte, No fornecedor, A confirmar).
- Nome público separado da pasta do STOR; números do pacote; ordenação nova na vitrine, na lista do vendedor e no link
  do comprador; o comprador não vê número nenhum.
- Documentos STOR no pacote; conferência do código do arquivo na importação; documento pendente pede confirmação.
- Menu Ajuda na área do vendedor.
- Importação: opção de numerar os itens pela ordem das linhas (planilha sem coluna de item) e mensagem de mapeamento
  que diz qual campo falta ou qual coluna está repetida.

### Ajustes feitos à mão na base local (não vão para o servidor)

- Remoção dos dados de exemplo do `seed:demo` (o servidor nunca os teve).
- Criação dos 21 pacotes, códigos STOR e divisão dos refratários: substituídos pela migration 5, que reconheceu
  esses registros na base local sem duplicar.
