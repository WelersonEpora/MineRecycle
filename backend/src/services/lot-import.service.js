"use strict";

const path = require("node:path");
const { createHash, randomUUID } = require("node:crypto");
const { Op } = require("sequelize");
const { sequelize, Lot, Package, PackageLot, LotSale } = require("../models");
const { NotFoundError, ValidationError, ConflictError } = require("../shared/errors");
const { isUuid } = require("../shared/validate");
const { storage, keys } = require("../storage");
const { readWorkbook, defaultLotSheet, readLotSheet } = require("../import/lot-sheet");
const { buildLotImportPlan } = require("../import/lot-plan");
const { planPackageSale } = require("../domain/package-sale");
const { AUTO_PACKAGE_SOURCES } = require("../domain/constants");
const packageLots = require("./package-lots");

// Importação de lotes pela planilha da Horizonte (aba "Matriz de lotes", decisão de 2026-11-19):
//   1. start: o vendedor envia o arquivo; ele fica guardado (imports/<id>.xlsx) e a API devolve a prévia.
//   2. preview: outra aba, se o vendedor escolher; nada é gravado.
//   3. commit: refaz o plano e só grava se a impressão digital for a mesma da prévia (arquivo, aba e banco), numa
//      transação, com trava para duas importações não se cruzarem.
// A planilha original não é guardada como anexo: ela tem colunas de preço e valor.

const IMPORT_EXTENSIONS = [".xlsx", ".xlsm", ".xls"];
const MAX_REPORT_ITEMS = 300;
const LOCK_KEY = 72616001; // pg_advisory_xact_lock da importação de lotes

async function loadFile(importId) {
  if (!isUuid(importId)) throw new NotFoundError("Import not found.", null, "IMPORT_NOT_FOUND");
  let buffer;
  try {
    buffer = await storage.get(keys.importFile(importId.toLowerCase()));
  } catch (_err) {
    throw new NotFoundError("Import not found or already finished. Upload the file again.", null, "IMPORT_NOT_FOUND");
  }
  const workbook = readWorkbook(buffer);
  if (!workbook) throw new ValidationError("Could not read the spreadsheet.", null, "IMPORT_UNREADABLE");
  return { workbook, fileHash: createHash("sha256").update(buffer).digest("hex") };
}

// Estado do banco que o plano compara: lotes (com nº de pacotes vendidos que os contêm) e pacotes automáticos.
async function currentState(transaction) {
  const lots = await Lot.findAll({
    attributes: { include: [[sequelize.literal(`(SELECT count(*) FROM lot_sale s WHERE s.lot_id = "Lot"."id")::int`), "saleCount"]] },
    transaction
  });
  const existingLots = lots.map((l) => ({ ...l.get({ plain: true }), saleCount: l.get("saleCount") }));
  const numberById = new Map(existingLots.map((l) => [l.id, l.lotNumber]));
  const packages = await Package.findAll({
    where: { source: { [Op.ne]: "manual" } },
    include: [{ model: PackageLot, as: "packageLots", attributes: ["lotId"] }],
    transaction
  });
  const autoPackages = packages.map((p) => ({
    id: p.id,
    source: p.source,
    sourceValue: p.sourceValue,
    name: p.name,
    status: p.status,
    lotNumbers: p.packageLots.map((pl) => numberById.get(pl.lotId)).filter(Boolean)
  }));
  return { existingLots, autoPackages };
}

async function plan(importId, options, transaction) {
  const { workbook, fileHash } = await loadFile(importId);
  const sheetName = workbook.SheetNames.includes(options.sheet) ? options.sheet : defaultLotSheet(workbook.SheetNames);
  const sheet = readLotSheet(workbook, sheetName);
  const state = await currentState(transaction);
  const result = buildLotImportPlan({ sheet, ...state, fileHash: `${fileHash}:${sheetName}` });
  return { result, sheetName, sheets: workbook.SheetNames, headerRow: sheet.headerRow, state };
}

const cut = (list) => ({ items: list.slice(0, MAX_REPORT_ITEMS), total: list.length });

// Relatório da prévia (listas cortadas; contagens completas).
function report(importId, { result, sheetName, sheets, headerRow, state }) {
  const names = new Map(state.autoPackages.map((p) => [p.id, p.name]));
  return {
    importId,
    sheets,
    sheet: sheetName,
    headerRow,
    canCommit: result.errors.length === 0,
    errors: cut(result.errors),
    summary: result.summary,
    created: cut(result.lots.create.map((c) => ({ lotNumber: c.lotNumber, row: c.row, title: c.data.title, status: c.data.status }))),
    updated: cut(result.lots.update.map((u) => ({ lotNumber: u.lotNumber, changes: u.changes, restored: u.restored }))),
    withdrawn: cut(result.lots.withdraw.map((w) => ({ lotNumber: w.lotNumber }))),
    statusChanges: cut(result.statusChanges),
    disagreements: cut(result.disagreements),
    packages: {
      create: result.packages.create.map((c) => ({ source: c.source, sourceValue: c.sourceValue, lotCount: c.lotNumbers.length })),
      update: result.packages.update.map((u) => ({
        packageId: u.packageId,
        name: names.get(u.packageId),
        source: u.source,
        sourceValue: u.sourceValue,
        added: u.add.length,
        removed: u.remove.length,
        lotCount: u.lotNumbers.length
      })),
      emptied: result.packages.emptied.map((e) => ({ packageId: e.packageId, name: names.get(e.packageId), source: e.source, sourceValue: e.sourceValue }))
    },
    fingerprint: result.fingerprint
  };
}

async function start(file) {
  if (!file) throw new ValidationError("No file received.", { field: "file", code: "required" });
  const ext = path.extname(Buffer.from(String(file.originalname || ""), "latin1").toString("utf8")).toLowerCase();
  if (!IMPORT_EXTENSIONS.includes(ext)) throw new ValidationError("Send an Excel file (.xlsx, .xlsm or .xls).", { field: "file" }, "IMPORT_FILE_TYPE");
  if (!readWorkbook(file.buffer)) throw new ValidationError("Could not read the spreadsheet.", null, "IMPORT_UNREADABLE");
  const importId = randomUUID();
  await storage.put(keys.importFile(importId), file.buffer);
  return report(importId, await plan(importId, {}));
}

async function preview(importId, options = {}) {
  return report(importId, await plan(importId, options));
}

async function cancel(importId) {
  if (!isUuid(importId)) return;
  await storage.remove(keys.importFile(importId.toLowerCase())).catch(() => {});
}

// Grava o plano. Lotes: cria, atualiza (campos da planilha, situação, restauração) e marca retirados. Pacotes
// automáticos: cria (rascunho, nome = valor da coluna) e acerta os lotes. Lote que entra num pacote automático já
// vendido é vendido junto (pacote vendido = todos os seus lotes vendidos).
async function apply(result, state, userId, transaction) {
  const now = new Date();
  const idByNumber = new Map(state.existingLots.map((l) => [l.lotNumber, l.id]));

  if (result.lots.create.length) {
    const rows = result.lots.create.map((c) => ({ id: randomUUID(), lotNumber: c.lotNumber, ...c.data, withdrawnAt: null, importedAt: now, updatedBy: userId }));
    await Lot.bulkCreate(rows, { transaction });
    for (const r of rows) idByNumber.set(r.lotNumber, r.id);
  }
  for (const u of result.lots.update) {
    await Lot.update({ ...u.data, withdrawnAt: null, importedAt: now, updatedBy: userId }, { where: { id: u.id }, transaction });
  }
  if (result.lots.withdraw.length) {
    await Lot.update({ withdrawnAt: now, updatedBy: userId }, { where: { id: result.lots.withdraw.map((w) => w.id) }, transaction });
  }
  // Lotes que estavam iguais também foram conferidos nesta importação.
  await Lot.update({ importedAt: now }, { where: { withdrawnAt: null }, transaction });

  let number = (await Package.max("number", { transaction })) || 0;
  const touched = [];
  for (const c of result.packages.create) {
    const pkg = await Package.create(
      { number: ++number, name: c.sourceValue, source: c.source, sourceValue: c.sourceValue, status: "draft", createdBy: userId, updatedBy: userId },
      { transaction }
    );
    await PackageLot.bulkCreate(c.lotNumbers.map((n, position) => ({ packageId: pkg.id, lotId: idByNumber.get(n), position })), { transaction });
  }
  for (const u of result.packages.update) {
    if (u.remove.length) {
      await PackageLot.destroy({ where: { packageId: u.packageId, lotId: u.remove.map((n) => idByNumber.get(n)) }, transaction });
    }
    if (u.add.length) await PackageLot.bulkCreate(u.add.map((n) => ({ packageId: u.packageId, lotId: idByNumber.get(n), position: 0 })), { transaction });
    // Posição = ordem natural dos números de lote.
    for (const [position, n] of u.lotNumbers.entries()) {
      await PackageLot.update({ position }, { where: { packageId: u.packageId, lotId: idByNumber.get(n) }, transaction });
    }
    touched.push(u.packageId);
  }

  // Pacote automático vendido que ganhou lotes: os novos são vendidos por ele.
  const soldTouched = await Package.findAll({ where: { id: touched, status: "sold" }, transaction });
  for (const pkg of soldTouched) {
    const salePlan = planPackageSale(pkg.id, await packageLots.saleLots(pkg.id, { transaction }));
    if (salePlan.sales.length) {
      await LotSale.bulkCreate(salePlan.sales.map((lotId) => ({ lotId, packageId: pkg.id, createdBy: userId })), { transaction, ignoreDuplicates: true });
    }
    await packageLots.applyStatusChanges(salePlan.changes, { transaction });
  }
}

async function commit(importId, body, userId) {
  const options = { sheet: body?.sheet };
  const summary = await sequelize.transaction(async (transaction) => {
    await sequelize.query(`SELECT pg_advisory_xact_lock(${LOCK_KEY})`, { transaction });
    const { result, state } = await plan(importId, options, transaction);
    if (result.errors.length) throw new ValidationError("The spreadsheet has errors.", { errors: result.errors.slice(0, 50) }, "IMPORT_HAS_ERRORS");
    if (result.fingerprint !== body?.fingerprint) {
      throw new ConflictError("The lots changed since the preview. Review the import again.", null, "IMPORT_STALE");
    }
    await apply(result, state, userId, transaction);
    return result.summary;
  });
  await cancel(importId);
  return { summary };
}

module.exports = { start, preview, commit, cancel, IMPORT_EXTENSIONS, AUTO_PACKAGE_SOURCES };
