"use strict";

// Registro único das colunas das planilhas: a exportação monta as abas por aqui e o importador tira daqui os
// sinônimos dos campos que reconhece (import/spreadsheet.js). Campo novo no item = migration, model e uma entrada
// em LINE_COLUMNS; o teste de ida e volta (columns.test.js) cobre todas as colunas importáveis.
//
// Cada coluna:
//   key      identificador estável (para itens importáveis, o nome do campo no importador e no model)
//   label    cabeçalho em en e pt; o cabeçalho de uma coluna importável precisa ser reconhecido pelos sinônimos
//   type     "string" | "number" | "date"
//   width    largura sugerida (caracteres)
//   value    (registro, contexto) -> valor da célula
//   import   só nos itens importáveis: { exact, prefix?, required? }, comparados com o cabeçalho normalizado
//            (sem acento, sem espaço, sem pontuação). A ordem de LINE_COLUMNS é a ordem de prioridade do mapeamento.
//   read     só nos pacotes: (célula) -> campos do formulário do pacote (domain/package-input.js), o caminho de volta
//            do "value". Coluna de pacote sem "read" é só de leitura e é ignorada na importação.
//   role     "id" (chave do pacote), "status" e "updatedAt": lidas à parte pela importação de pacotes.

const { enumLabel, enumValue, word } = require("./labels");

const numberOrNull = (v) => (v === null || v === undefined || v === "" ? null : Number(v));
const textOrNull = (v) => (v === null || v === undefined || v === "" ? null : String(v));

// Texto de uma célula na importação: número inteiro sem ".0", espaços das pontas fora; vazio -> null.
// keepLines: mantém as quebras de linha (descrição do pacote).
function cellString(v, { keepLines = false } = {}) {
  if (v === null || v === undefined) return null;
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === "number") return Number.isInteger(v) ? String(v) : String(Number(v.toFixed(6)));
  const s = keepLines ? String(v).replace(/\r\n?/g, "\n").trim() : String(v).replace(/\s+/g, " ").trim();
  return s || null;
}
const listOf = (v, sep) => (cellString(v) || "").split(sep).map((x) => x.trim()).filter(Boolean);
// Valor de domínio: o rótulo em qualquer idioma vira o valor do sistema; desconhecido segue como veio, para a
// validação do pacote recusar com o campo certo.
const enumOrRaw = (group, v) => enumValue(group, v) ?? cellString(v);

// "1000001, 1000002 (pendente)" -> códigos e pendentes.
function readDocuments(v) {
  const docs = [];
  const pending = [];
  for (const token of listOf(v, /[,;\n]+/)) {
    const code = token.replace(/\(.*\)/g, "").trim();
    if (!code) continue;
    docs.push(code);
    if (/\((pending|pendente)\)/i.test(token)) pending.push(code);
  }
  return { storDocuments: docs, storDocumentsPending: pending };
}

const LINE_COLUMNS = [
  {
    key: "packageNumber",
    label: { en: "Package ID", pt: "ID do pacote" },
    type: "number",
    width: 12,
    value: (_l, { pkg }) => pkg.number
  },
  {
    key: "packageName",
    label: { en: "Package", pt: "Pacote" },
    type: "string",
    width: 34,
    value: (_l, { pkg }) => pkg.name
  },
  {
    key: "itemNo",
    label: { en: "Item", pt: "Item" },
    type: "string",
    width: 9,
    value: (l) => l.itemNo,
    import: { exact: ["item", "itens", "n", "no", "nr", "num", "numero", "nitem", "itemno", "seq", "pos", "posicao"], required: true }
  },
  {
    key: "description",
    label: { en: "Description", pt: "Descrição" },
    type: "string",
    width: 60,
    value: (l) => l.description,
    import: {
      exact: ["descricao", "description", "material", "materiais", "desc", "especificacao", "discriminacao"],
      prefix: ["descricao", "description", "especificacao"],
      required: true
    }
  },
  {
    key: "quantity",
    label: { en: "Qty", pt: "Qtde" },
    type: "number",
    width: 10,
    value: (l) => numberOrNull(l.quantity),
    import: { exact: ["qtde", "qtd", "qt", "quantidade", "quant", "qty", "quantity"], prefix: ["qtde", "quantidade"], required: true }
  },
  {
    key: "unit",
    label: { en: "Unit", pt: "Unidade" },
    type: "string",
    width: 9,
    value: (l) => textOrNull(l.unit ?? l.unitRaw),
    import: { exact: ["um", "unidade", "und", "unid", "un", "unit", "uom", "unidmedida", "unidadedemedida"], required: true }
  },
  {
    key: "storCode",
    label: { en: "STOR code", pt: "Código STOR" },
    type: "string",
    width: 16,
    value: (l) => textOrNull(l.storCode),
    import: { exact: ["stor", "codigostor", "codstor", "storcode", "codigo", "cod", "code"], prefix: ["stor", "codigostor"] }
  },
  {
    key: "tag",
    label: { en: "Tag", pt: "Tag" },
    type: "string",
    width: 14,
    value: (l) => textOrNull(l.tag),
    import: { exact: ["tag", "tags"] }
  },
  {
    key: "warehouseLocation",
    label: { en: "Location", pt: "Localização" },
    type: "string",
    width: 20,
    value: (l) => textOrNull(l.warehouseLocation),
    import: {
      exact: ["localizacao", "local", "endereco", "almoxarifado", "location", "loc", "localizacaoalmoxarifado"],
      prefix: ["localizacao", "endereco"]
    }
  }
];

// Aba de pacotes: só leitura por enquanto (a reimportação é de itens). Nada de preço, valor ou comprador.
const PACKAGE_COLUMNS = [
  { key: "number", role: "id", label: { en: "ID", pt: "ID" }, type: "number", width: 7, value: (p) => p.number },
  {
    key: "name",
    label: { en: "Public name", pt: "Nome público" },
    type: "string",
    width: 40,
    value: (p) => p.name,
    read: (v) => ({ name: cellString(v) })
  },
  {
    key: "type",
    label: { en: "Type", pt: "Tipo" },
    type: "string",
    width: 13,
    value: (p, { lang }) => enumLabel(lang, "type", p.type),
    read: (v) => ({ type: enumOrRaw("type", v) })
  },
  {
    key: "category",
    label: { en: "Category", pt: "Categoria" },
    type: "string",
    width: 22,
    value: (p, { lang }) => enumLabel(lang, "category", p.category),
    read: (v) => ({ category: enumOrRaw("category", v) })
  },
  {
    key: "origin",
    label: { en: "Origin", pt: "Origem" },
    type: "string",
    width: 30,
    value: (p) => (p.origin ? `${p.origin.name} (${p.origin.code})` : null),
    // Resolvida pela importação na lista de origens cadastradas (sigla entre parênteses, sigla ou nome).
    read: (v) => ({ origin: cellString(v) })
  },
  {
    key: "locations",
    label: { en: "Locations", pt: "Locais" },
    type: "string",
    width: 30,
    value: (p, { lang }) => (p.locations || []).map((l) => enumLabel(lang, "location", l)).join("; ") || null,
    read: (v) => ({ locations: listOf(v, /[;\n]+/).map((l) => enumValue("location", l) ?? l) })
  },
  // Situação: só leitura. Muda pelo menu do pacote (link do comprador, catálogo e pedidos dependem dela).
  {
    key: "status",
    role: "status",
    label: { en: "Status", pt: "Situação" },
    type: "string",
    width: 17,
    value: (p, { lang }) => enumLabel(lang, "status", p.status)
  },
  {
    key: "storNumbers",
    label: { en: "Assets", pt: "Ativos" },
    type: "string",
    width: 10,
    value: (p) => (p.storNumbers || []).join(", ") || null,
    read: (v) => ({ storNumbers: cellString(v) ?? "" })
  },
  {
    key: "storFolder",
    label: { en: "STOR folder", pt: "Pasta STOR" },
    type: "string",
    width: 40,
    value: (p) => textOrNull(p.storFolder),
    read: (v) => ({ storFolder: cellString(v) })
  },
  {
    key: "storDocuments",
    label: { en: "Doc.", pt: "Doc." },
    type: "string",
    width: 22,
    value: (p, { lang }) =>
      (p.storDocuments || []).map((d) => ((p.storDocumentsPending || []).includes(d) ? `${d} (${word(lang, "pending")})` : d)).join(", ") || null,
    read: readDocuments
  },
  { key: "lineCount", label: { en: "Items", pt: "Itens" }, type: "number", width: 8, value: (p) => numberOrNull(p.lineCount) },
  {
    key: "attachmentCount",
    label: { en: "Photos and files", pt: "Fotos e arquivos" },
    type: "number",
    width: 10,
    value: (p) => numberOrNull(p.attachmentCount)
  },
  {
    key: "description",
    label: { en: "Description", pt: "Descrição" },
    type: "string",
    width: 60,
    value: (p) => textOrNull(p.description),
    read: (v) => ({ description: cellString(v, { keepLines: true }) })
  },
  // Data da última alteração: só leitura; a importação compara com o banco para avisar mudança feita depois da
  // exportação.
  {
    key: "updatedAt",
    role: "updatedAt",
    label: { en: "Updated", pt: "Atualizado em" },
    type: "date",
    width: 17,
    value: (p) => (p.updatedAt ? new Date(p.updatedAt) : null)
  },
  {
    key: "publicUrl",
    label: { en: "Public page", pt: "Página pública" },
    type: "string",
    width: 42,
    value: (p, { baseUrl }) => `${baseUrl}/packages/${p.number}`
  }
];

const IMPORT_COLUMNS = LINE_COLUMNS.filter((c) => c.import);

module.exports = { LINE_COLUMNS, PACKAGE_COLUMNS, IMPORT_COLUMNS };
