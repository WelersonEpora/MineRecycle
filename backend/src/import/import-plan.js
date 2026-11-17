"use strict";

const { parseQuantity } = require("./quantity");
const { normalizeUnit } = require("./units");
const { MAPPABLE_FIELDS, REQUIRED_FIELDS, isEmpty, MAX_ROWS } = require("./spreadsheet");

const LIMITS = { itemNo: 40, description: 4000, storCode: 64, tag: 64, warehouseLocation: 128 };

// Valida o mapeamento de colunas vindo da tela. -> lista de problemas (vazia = ok).
// numberRows: a planilha não tem coluna de nº do item; ele é gerado pela ordem das linhas (a coluna é ignorada).
function validateMapping(mapping, columnCount, { numberRows = false } = {}) {
  const problems = [];
  if (!mapping || typeof mapping !== "object") return [{ field: "mapping", code: "required" }];
  const seen = new Map();
  for (const field of MAPPABLE_FIELDS) {
    if (numberRows && field === "itemNo") continue;
    const col = mapping[field];
    if (col === null || col === undefined || col === "") {
      if (REQUIRED_FIELDS.includes(field)) problems.push({ field, code: "required" });
      continue;
    }
    if (!Number.isInteger(col) || col < 0 || col >= columnCount) {
      problems.push({ field, code: "invalid_column" });
      continue;
    }
    if (seen.has(col)) problems.push({ field, code: "duplicate_column", with: seen.get(col) });
    else seen.set(col, field);
  }
  return problems;
}

function cellText(value) {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "number") return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(6)));
  const s = String(value).replace(/\s+/g, " ").trim();
  return s || null;
}

function depth(itemNo) {
  return itemNo.split(".").length;
}

// "1.2" é filho de "1"; "1.2.3" é filho de "1.2". Só quando o pai existe no mesmo arquivo.
function parentItemNoOf(itemNo, existing) {
  const m = /^(.+)\.(\d+)$/.exec(itemNo);
  if (!m) return null;
  return existing.has(m[1]) ? m[1] : null;
}

// Monta as linhas a gravar a partir da matriz da planilha, sem tocar no banco.
// rows: matriz (sheetRows), headerRowIndex: índice do cabeçalho em rows, firstRowNumber: linha do Excel de rows[0].
// numberRows: nº do item = posição da linha entre as linhas com dados (1, 2, 3...). Numa reimportação, os anexos são
// religados pelo nº do item; se a ordem das linhas mudar, o anexo acompanha o número, não o conteúdo.
// -> { lines, errors, warnings, stats }
function buildImportPlan(rows, { headerRowIndex, firstRowNumber = 1, mapping: chosen, inferHierarchy = true, numberRows = false }) {
  const mapping = numberRows ? { ...chosen, itemNo: null } : chosen;
  const lines = [];
  const errors = [];
  const warnings = [];
  const unknownUnits = {};
  const byItemNo = new Map();
  let skippedEmpty = 0;
  let dataRows = 0;

  const at = (row, field) => (mapping[field] === null || mapping[field] === undefined ? null : row[mapping[field]]);

  for (let i = headerRowIndex + 1; i < rows.length; i += 1) {
    const row = rows[i] || [];
    const excelRow = firstRowNumber + i;
    const mapped = MAPPABLE_FIELDS.map((f) => at(row, f));
    if (mapped.every(isEmpty)) {
      skippedEmpty += 1;
      continue;
    }
    dataRows += 1;
    if (dataRows > MAX_ROWS) {
      errors.push({ row: excelRow, field: null, code: "too_many_rows" });
      break;
    }

    const rowErrors = [];
    const itemNo = numberRows ? String(dataRows) : cellText(at(row, "itemNo"));
    const description = cellText(at(row, "description"));

    if (!itemNo) rowErrors.push({ row: excelRow, field: "itemNo", code: "item_no_missing" });
    else if (itemNo.length > LIMITS.itemNo) rowErrors.push({ row: excelRow, field: "itemNo", code: "too_long" });
    else if (byItemNo.has(itemNo)) {
      rowErrors.push({ row: excelRow, field: "itemNo", code: "item_no_duplicate", value: itemNo, firstRow: byItemNo.get(itemNo).sourceRow });
    }

    if (!description) rowErrors.push({ row: excelRow, field: "description", code: "description_missing" });

    const qty = parseQuantity(at(row, "quantity"));
    if (qty.error) rowErrors.push({ row: excelRow, field: "quantity", code: qty.error });
    else if (qty.value === null) warnings.push({ row: excelRow, field: "quantity", code: "quantity_missing" });
    else if (qty.warning) warnings.push({ row: excelRow, field: "quantity", code: qty.warning });

    const unit = normalizeUnit(at(row, "unit"));
    if (!unit.raw) warnings.push({ row: excelRow, field: "unit", code: "unit_missing" });
    else if (!unit.known) {
      unknownUnits[unit.raw] = (unknownUnits[unit.raw] || 0) + 1;
      warnings.push({ row: excelRow, field: "unit", code: "unit_unknown", value: unit.raw });
    }

    const optional = {};
    for (const field of ["storCode", "tag", "warehouseLocation"]) {
      const v = cellText(at(row, field));
      optional[field] = v ? v.slice(0, LIMITS[field]) : null;
      if (v && v.length > LIMITS[field]) warnings.push({ row: excelRow, field, code: "truncated" });
    }

    if (rowErrors.length) {
      errors.push(...rowErrors);
      continue;
    }

    const line = {
      itemNo,
      description: description.slice(0, LIMITS.description),
      quantity: qty.value,
      unit: unit.unit,
      unitRaw: unit.raw,
      ...optional,
      parentItemNo: null,
      sortOrder: lines.length + 1,
      sourceRow: excelRow
    };
    lines.push(line);
    byItemNo.set(itemNo, line);
  }

  if (inferHierarchy && !numberRows) {
    for (const line of lines) line.parentItemNo = parentItemNoOf(line.itemNo, byItemNo);
  }

  return {
    lines,
    errors,
    warnings,
    stats: {
      dataRows,
      validRows: lines.length,
      invalidRows: new Set(errors.map((e) => e.row)).size,
      skippedEmpty,
      childLines: lines.filter((l) => l.parentItemNo).length,
      unknownUnits
    }
  };
}

// Ordem de gravação: pais antes dos filhos (a FK do pai precisa existir).
function insertionOrder(lines) {
  return [...lines].sort((a, b) => depth(a.itemNo) - depth(b.itemNo) || a.sortOrder - b.sortOrder);
}

module.exports = { buildImportPlan, validateMapping, insertionOrder, parentItemNoOf, cellText };
