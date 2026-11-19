"use strict";

const { createHash } = require("node:crypto");
const { parseSheetStatus, lotStatus } = require("../domain/lot-status");
const { planAutoPackages, cleanGroupValue, compareLotNumbers } = require("../domain/auto-packages");

// Plano da importação de lotes (decisão de 2026-11-19). Regra pura: recebe as linhas lidas (lot-sheet.js) e o estado
// do banco, e diz o que vai mudar. Nada é gravado antes de o vendedor confirmar a prévia; o commit refaz o plano e só
// grava se a impressão digital for a mesma.
//
// - Chave: nº do lote. Lote novo é criado; existente é atualizado nos campos da planilha (a descrição do vendedor
//   não muda); lote que sumiu da planilha é marcado como retirado (nunca apagado: pode ter fotos, pedidos ou estar em
//   pacote manual); retirado que volta é restaurado.
// - Situação: "Sold" marca o lote como vendido pela planilha, e isso a importação nunca desfaz.
// - Pacotes automáticos: recalculados a partir dos lotes resultantes (auto-packages.js).

const LIMITS = { lotNumber: 40, siteName: 120, title: 5000, masterSupplier: 200, linkedSystem: 200, commercialFamily: 200, subfamily: 200 };
const SHEET_FIELDS = ["siteName", "title", "masterSupplier", "linkedSystem", "commercialFamily", "subfamily"];
// Campos comparados para dizer se o lote mudou.
const COMPARED_FIELDS = [...SHEET_FIELDS, "sheetStatus", "status"];

function cleanText(value) {
  return cleanGroupValue(value);
}

// Uma linha da planilha -> { lotNumber, data, errors }.
function readRow({ rowNumber, values }) {
  const errors = [];
  const data = {};
  const lotNumber = cleanText(values.lotNumber);
  if (!lotNumber) errors.push({ code: "LOT_NUMBER_EMPTY", row: rowNumber, field: "lotNumber" });
  for (const field of SHEET_FIELDS) data[field] = cleanText(values[field]);
  if (!data.title) errors.push({ code: "LOT_TITLE_EMPTY", row: rowNumber, field: "title" });
  for (const [field, max] of Object.entries(LIMITS)) {
    const value = field === "lotNumber" ? lotNumber : data[field];
    if (value && value.length > max) errors.push({ code: "LOT_VALUE_TOO_LONG", row: rowNumber, field, max });
  }
  const sheetStatus = parseSheetStatus(values.status);
  if (sheetStatus === null) errors.push({ code: "LOT_STATUS_UNKNOWN", row: rowNumber, field: "status", value: String(values.status).slice(0, 60) });
  data.sheetStatus = sheetStatus ?? "available";
  return { lotNumber, data, errors };
}

// sheet = readLotSheet(); existingLots = [{ id, lotNumber, ...SHEET_FIELDS, sheetStatus, soldBySheet, status,
// withdrawnAt, saleCount }]; autoPackages = [{ id, source, sourceValue, lotNumbers }].
function buildLotImportPlan({ sheet, existingLots, autoPackages, fileHash = "" }) {
  const errors = [];
  if (sheet.headerRow === null) errors.push({ code: "LOT_SHEET_NO_HEADER" });
  else if (sheet.missing.length) errors.push({ code: "LOT_SHEET_MISSING_COLUMNS", fields: sheet.missing });
  if (sheet.truncated) errors.push({ code: "LOT_SHEET_TOO_MANY_ROWS" });
  if (sheet.headerRow !== null && sheet.rows.length === 0) errors.push({ code: "LOT_SHEET_EMPTY" });

  // Linhas lidas, sem repetição de nº do lote (a repetição impede a importação; vale a primeira para a prévia).
  const incoming = new Map();
  const firstRow = new Map();
  for (const row of sheet.rows) {
    const read = readRow(row);
    errors.push(...read.errors);
    if (!read.lotNumber) continue;
    if (incoming.has(read.lotNumber)) {
      errors.push({ code: "LOT_NUMBER_DUPLICATE", row: row.rowNumber, field: "lotNumber", value: read.lotNumber, firstRow: firstRow.get(read.lotNumber) });
      continue;
    }
    incoming.set(read.lotNumber, read.data);
    firstRow.set(read.lotNumber, row.rowNumber);
  }

  const existingByNumber = new Map(existingLots.map((l) => [l.lotNumber, l]));
  const create = [];
  const update = [];
  const restore = [];
  const withdraw = [];
  const statusChanges = [];
  const disagreements = [];
  let unchanged = 0;

  for (const [lotNumber, sheetData] of incoming) {
    const current = existingByNumber.get(lotNumber);
    const soldBySheet = Boolean(current?.soldBySheet) || sheetData.sheetStatus === "sold";
    const status = lotStatus({ soldBySheet, saleCount: current?.saleCount ?? 0, sheetStatus: sheetData.sheetStatus });
    const data = { ...sheetData, soldBySheet, status };
    if (!current) {
      create.push({ lotNumber, row: firstRow.get(lotNumber), data });
      if (status !== "available") statusChanges.push({ lotNumber, from: null, to: status });
      continue;
    }
    const changes = {};
    for (const field of COMPARED_FIELDS) {
      if ((current[field] ?? null) !== (data[field] ?? null)) changes[field] = { from: current[field] ?? null, to: data[field] ?? null };
    }
    if (changes.status) statusChanges.push({ lotNumber, from: changes.status.from, to: changes.status.to });
    // O sistema diz vendido (por pacote) e a planilha não: avisa, para a equipe atualizar a planilha.
    if (status === "sold" && !soldBySheet) disagreements.push({ lotNumber, sheetStatus: sheetData.sheetStatus });
    if (current.withdrawnAt) restore.push({ id: current.id, lotNumber });
    if (current.withdrawnAt || Object.keys(changes).length) update.push({ id: current.id, lotNumber, changes, data, restored: Boolean(current.withdrawnAt) });
    else unchanged += 1;
  }
  for (const lot of existingLots) {
    if (incoming.has(lot.lotNumber)) continue;
    if (lot.withdrawnAt) unchanged += 1;
    else withdraw.push({ id: lot.id, lotNumber: lot.lotNumber });
  }

  // Lotes como ficam depois da importação, para recalcular os pacotes automáticos.
  const resulting = [
    ...[...incoming].map(([lotNumber, d]) => ({ lotNumber, ...d, withdrawn: false })),
    ...existingLots.filter((l) => !incoming.has(l.lotNumber)).map((l) => ({ ...l, withdrawn: true }))
  ];
  const packages = planAutoPackages(resulting, autoPackages);

  const byNumber = (a, b) => compareLotNumbers(a.lotNumber, b.lotNumber);
  for (const list of [create, update, restore, withdraw, statusChanges, disagreements]) list.sort(byNumber);

  // Impressão digital: o arquivo e o estado do banco usados no plano. Mudou qualquer um, a prévia está velha.
  const fingerprint = createHash("sha256")
    .update(JSON.stringify({ fileHash, sheet: sheet.rows, existingLots: existingLots.map(stateOf).sort(byNumber), autoPackages: autoPackages.map(packageStateOf).sort((a, b) => a.id.localeCompare(b.id)) }))
    .digest("hex");

  return {
    errors,
    lots: { create, update, restore, withdraw, unchanged },
    statusChanges,
    disagreements,
    packages,
    summary: {
      rows: sheet.rows.length,
      created: create.length,
      updated: update.length,
      restored: restore.length,
      withdrawn: withdraw.length,
      unchanged,
      packagesCreated: packages.create.length,
      packagesUpdated: packages.update.length,
      packagesEmptied: packages.emptied.length
    },
    fingerprint
  };
}

function stateOf(lot) {
  const out = { id: lot.id, lotNumber: lot.lotNumber, soldBySheet: Boolean(lot.soldBySheet), withdrawn: Boolean(lot.withdrawnAt), saleCount: lot.saleCount ?? 0 };
  for (const field of COMPARED_FIELDS) out[field] = lot[field] ?? null;
  return out;
}

function packageStateOf(pkg) {
  return { id: pkg.id, source: pkg.source, sourceValue: pkg.sourceValue, lotNumbers: [...pkg.lotNumbers].sort(compareLotNumbers) };
}

module.exports = { buildLotImportPlan, LIMITS };
