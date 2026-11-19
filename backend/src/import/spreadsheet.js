"use strict";

const XLSX = require("xlsx");
const { IMPORT_COLUMNS } = require("../export/columns");
const { SHEETS } = require("../export/labels");

const MAX_ROWS = 20000;
const HEADER_SCAN_ROWS = 30;

function normalizeHeader(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

// Sinônimos por campo, comparados com o cabeçalho normalizado (sem acento, sem espaço, sem pontuação).
// `prefix`: casa também quando o cabeçalho começa com o termo ("Descrição dos Materiais").
// Vêm do registro de colunas (export/columns.js), o mesmo que monta a planilha exportada: o que sai, volta.
const FIELD_SYNONYMS = Object.fromEntries(IMPORT_COLUMNS.map((c) => [c.key, { exact: c.import.exact, prefix: c.import.prefix }]));

const MAPPABLE_FIELDS = Object.keys(FIELD_SYNONYMS);
const REQUIRED_FIELDS = IMPORT_COLUMNS.filter((c) => c.import.required).map((c) => c.key);

// Aba aberta por padrão: a de itens da planilha exportada pelo sistema ("Items" ou "Itens", que vem depois de
// "Pacotes"); em qualquer outro arquivo, a primeira.
function defaultSheet(sheetNames) {
  const itemSheets = Object.values(SHEETS).map((s) => s.lines);
  return sheetNames.find((n) => itemSheets.includes(n)) ?? sheetNames[0];
}

function readWorkbook(buffer) {
  try {
    return XLSX.read(buffer, { type: "buffer", cellDates: true, cellFormula: false, cellHTML: false });
  } catch (_err) {
    return null;
  }
}

function isEmpty(cell) {
  return cell === null || cell === undefined || String(cell).trim() === "";
}

// Linhas da aba como matriz. Mantém as linhas em branco, para o número da linha no relatório bater com o Excel.
// -> { rows, firstRowNumber } (firstRowNumber = número da linha do Excel de rows[0]).
function sheetRows(workbook, sheetName) {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet || !sheet["!ref"]) return { rows: [], firstRowNumber: 1 };
  const range = XLSX.utils.decode_range(sheet["!ref"]);
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true, defval: null, blankrows: true });
  return { rows: rows.slice(0, MAX_ROWS + HEADER_SCAN_ROWS), firstRowNumber: range.s.r + 1, truncated: rows.length > MAX_ROWS + HEADER_SCAN_ROWS };
}

// Primeira linha (entre as 30 primeiras) com pelo menos 3 células de texto: planilhas do cliente costumam ter
// título e logotipo antes do cabeçalho. Prefere a linha em que mais campos são reconhecidos.
function detectHeaderRow(rows) {
  let best = { index: 0, score: -1 };
  const limit = Math.min(rows.length, HEADER_SCAN_ROWS);
  for (let i = 0; i < limit; i += 1) {
    const row = rows[i] || [];
    const textCells = row.filter((c) => typeof c === "string" && c.trim() !== "").length;
    if (textCells < 3) continue;
    const recognized = Object.values(suggestMapping(row)).filter((v) => v !== null).length;
    const score = recognized * 10 + textCells;
    if (score > best.score) best = { index: i, score };
  }
  return best.index;
}

function headersOf(rows, headerRowIndex) {
  const row = rows[headerRowIndex] || [];
  const width = rows.reduce((w, r) => Math.max(w, (r || []).length), row.length);
  return Array.from({ length: width }, (_, i) => (isEmpty(row[i]) ? null : String(row[i]).trim()));
}

// -> { itemNo: colIndex | null, ... }. Cada coluna só serve a um campo.
function suggestMapping(headerRow) {
  const normalized = (headerRow || []).map(normalizeHeader);
  const used = new Set();
  const mapping = Object.fromEntries(MAPPABLE_FIELDS.map((f) => [f, null]));

  const pass = (matcher) => {
    for (const field of MAPPABLE_FIELDS) {
      if (mapping[field] !== null) continue;
      const idx = normalized.findIndex((h, i) => h && !used.has(i) && matcher(field, h));
      if (idx >= 0) {
        mapping[field] = idx;
        used.add(idx);
      }
    }
  };
  pass((field, h) => FIELD_SYNONYMS[field].exact.includes(h));
  pass((field, h) => (FIELD_SYNONYMS[field].prefix || []).some((p) => h.startsWith(p)));
  return mapping;
}

module.exports = {
  defaultSheet,
  readWorkbook,
  sheetRows,
  detectHeaderRow,
  headersOf,
  suggestMapping,
  normalizeHeader,
  isEmpty,
  MAPPABLE_FIELDS,
  REQUIRED_FIELDS,
  MAX_ROWS
};
