"use strict";

const XLSX = require("xlsx");

// Leitura da planilha de lotes (aba "Matriz de lotes", decisão de 2026-11-19). Regra pura: recebe o arquivo em memória.
//
// Só as colunas desta lista são lidas, achadas pelo nome do cabeçalho (podem mudar de lugar). Todas as outras colunas
// da aba são ignoradas, inclusive as de preço e valor, que nunca entram no sistema.

const MAX_ROWS = 20000;
const HEADER_SCAN_ROWS = 30;

// Sinônimos comparados com o cabeçalho normalizado (sem acento, caixa, espaço ou pontuação). Todas obrigatórias: coluna
// ausente impede a importação (senão o campo seria apagado em todos os lotes e os pacotes automáticos esvaziados).
const LOT_COLUMNS = [
  { key: "lotNumber", exact: ["lotnumber", "lotno", "lot", "lote", "numerodolote"] },
  { key: "siteName", exact: ["sitename", "site"] },
  { key: "title", exact: ["titleequipmentdescription", "titleequipamentdescription", "title", "equipmentdescription"] },
  { key: "masterSupplier", exact: ["mastersupplier", "supplier", "fornecedor"] },
  { key: "linkedSystem", exact: ["equipamentoousistemavinculado", "linkedequipmentorsystem", "linkedsystem"] },
  { key: "commercialFamily", exact: ["familiacomercial", "commercialfamily"] },
  { key: "subfamily", exact: ["subfamilia", "subfamily"] },
  { key: "status", exact: ["status", "situacao"] }
];
const LOT_FIELDS = LOT_COLUMNS.map((c) => c.key);

// Aba aberta por padrão.
const SHEET_NAMES = ["matrizdelotes", "lotmatrix", "lots"];

function normalizeHeader(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function readWorkbook(buffer) {
  try {
    return XLSX.read(buffer, { type: "buffer", cellDates: true, cellFormula: false, cellHTML: false });
  } catch (_err) {
    return null;
  }
}

function defaultLotSheet(sheetNames) {
  return sheetNames.find((n) => SHEET_NAMES.includes(normalizeHeader(n))) ?? sheetNames[0];
}

// Valor da célula como texto. O nº do lote às vezes é número no Excel (123456): vira "123456", sem ".0".
function cellText(value) {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  const text = String(value).trim();
  return text === "" ? null : text;
}

// -> { col: { key: índice } , recognized }
function matchColumns(headerRow) {
  const normalized = (headerRow || []).map(normalizeHeader);
  const columns = {};
  for (const { key, exact } of LOT_COLUMNS) {
    // A primeira coluna com o nome (a aba tem nomes repetidos, como "Subpackage").
    const idx = normalized.findIndex((h, i) => h && exact.includes(h) && !Object.values(columns).includes(i));
    if (idx >= 0) columns[key] = idx;
  }
  return columns;
}

// -> { headerRow (nº da linha no Excel, ou null), columns, missing: [chaves], rows: [{ rowNumber, values }], truncated }
// Linhas totalmente vazias (nas colunas lidas) são puladas; o rowNumber bate com o Excel.
function readLotSheet(workbook, sheetName) {
  const sheet = workbook?.Sheets?.[sheetName];
  if (!sheet || !sheet["!ref"]) return { headerRow: null, columns: {}, missing: [...LOT_FIELDS], rows: [], truncated: false };
  const firstRowNumber = XLSX.utils.decode_range(sheet["!ref"]).s.r + 1;
  const all = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true, defval: null, blankrows: true });

  // Cabeçalho: a linha, entre as primeiras, em que mais colunas são reconhecidas (a aba tem título e notas antes).
  let best = { index: -1, columns: {}, count: 0 };
  for (let i = 0; i < Math.min(all.length, HEADER_SCAN_ROWS); i += 1) {
    const columns = matchColumns(all[i]);
    const count = Object.keys(columns).length;
    if (columns.lotNumber !== undefined && count > best.count) best = { index: i, columns, count };
  }
  if (best.index < 0) return { headerRow: null, columns: {}, missing: [...LOT_FIELDS], rows: [], truncated: false };

  const missing = LOT_FIELDS.filter((k) => best.columns[k] === undefined);
  const body = all.slice(best.index + 1);
  const rows = [];
  body.slice(0, MAX_ROWS).forEach((row, i) => {
    const values = Object.fromEntries(LOT_FIELDS.map((k) => [k, best.columns[k] === undefined ? null : cellText(row?.[best.columns[k]])]));
    if (Object.values(values).every((v) => v === null)) return;
    rows.push({ rowNumber: firstRowNumber + best.index + 1 + i, values });
  });
  return { headerRow: firstRowNumber + best.index, columns: best.columns, missing, rows, truncated: body.length > MAX_ROWS };
}

module.exports = { LOT_COLUMNS, LOT_FIELDS, MAX_ROWS, readWorkbook, defaultLotSheet, readLotSheet, normalizeHeader, cellText };
