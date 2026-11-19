# Carga de dados: a planilha de lotes

Referência para carregar e atualizar os lotes do MineRecycle. Desde 2026-11-19 a fonte é a aba **"Matriz de lotes"**
da planilha de inventário da Horizonte. O STOR deixou de ser a fonte: o levantamento antigo (pastas, planilhas por
pacote, códigos de documento) está no histórico do git, na versão deste arquivo anterior a 2026-11-19.

> **Confidencialidade.** A planilha real fica só na máquina local, em `_sample-data/` (no `.gitignore` e nos
> `.dockerignore`), e nunca vai para commit, imagem Docker ou log. No servidor, ela entra só pela tela de importação.
> Este documento não traz números de lote, nomes de fornecedor, preços nem valores; mantenha assim. Testes e exemplos
> usam dados fictícios.

## O que é lido

Só 8 colunas da aba, achadas pelo nome do cabeçalho (em qualquer uma das 30 primeiras linhas, em qualquer ordem;
nomes comparados sem acento, maiúsculas ou pontuação). Todas são obrigatórias: coluna faltando impede a importação.

| Coluna na planilha | Campo | Observação |
|---|---|---|
| Lot Number | `lot_number` | Chave do lote. Não pode faltar nem se repetir. |
| Site Name | `site_name` | Mostrado como está na planilha, também ao comprador. |
| Title / Equipment Description | `title` | Obrigatório em cada linha. |
| Master Supplier | `master_supplier` | Opcional. |
| Equipamento ou sistema vinculado (AA) | `linked_system` | Cada valor vira um pacote automático. |
| Família comercial (AB) | `commercial_family` | Cada valor vira um pacote automático. |
| Subfamília (AC) | `subfamily` | Cada valor vira um pacote automático. |
| STATUS | `sheet_status` | Vazio/"Available": disponível. "Sold": vendido. "Collected by court officer": fora da venda. Outro valor impede a importação. |

Todas as outras colunas são ignoradas. **As colunas de preço e valor (N, O, X) nunca são lidas.** País também não é
usado. Sinônimos aceitos: `LOT_COLUMNS` em `backend/src/import/lot-sheet.js`.

## Como carregar

- **No servidor:** área do vendedor → Lotes → Importar lotes. A prévia mostra o que muda; nada é gravado antes de
  confirmar.
- **No local:** `cd backend && npm run import:lots -- "../_sample-data/<planilha>.xlsm"`. Usa o mesmo plano da tela,
  imprime só contagens e recusa rodar com `NODE_ENV=production`.

## O que a importação faz

1. **Lotes:** cria os novos, atualiza os alterados e marca como **retirado** (`withdrawn_at`) o lote que saiu da
   planilha. Retirado nunca é apagado (guarda anexos e histórico), some do lado público e volta se reaparecer.
2. **Situação:** "Sold" marca o lote como vendido (`sold_by_sheet`), e a planilha nunca desfaz isso. Se o sistema tem
   um lote vendido (por um pacote) que a planilha não tem, a prévia avisa e ele continua vendido.
3. **Pacotes automáticos:** um por valor de AA, AB e AC, criado como **rascunho**, com o valor como nome e o próximo
   ID. Os lotes dele acompanham a planilha, em ordem natural do nº. O que fica sem lotes sai do catálogo e pode ser
   excluído. Lote novo num automático já vendido entra vendido.
4. **Nunca mexe** na descrição do vendedor, nos anexos, nos pacotes manuais, no nome ou na situação dos pacotes.

O commit refaz o plano sob um lock e só grava se o arquivo, a aba e o banco forem os mesmos da prévia
(`IMPORT_STALE`), numa transação só.

## Pendências

- **Arquivos órfãos no servidor:** a limpeza de 2026-11-19 apagou os registros de anexos, mas os arquivos antigos
  continuam no volume `minerecycle_file_storage`. Falta o script que lista e remove arquivos sem registro.
- **Exportação para planilha** (pacotes e lotes): ainda não refeita sobre lotes.
