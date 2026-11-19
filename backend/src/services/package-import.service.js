"use strict";

// Importação de pacotes pela planilha do sistema ("Importar pacotes" na lista, "Importar pacote" na página do pacote).
// Dois passos:
//   1. start: o arquivo fica guardado (imports/<id>.xlsx) e a API devolve a verificação (o plano, sem gravar nada).
//   2. commit: refaz o plano com o banco atual; grava tudo numa transação só se a verificação continua a mesma
//      (impressão digital), não há impedimento e todos os avisos foram confirmados.
// As regras ficam em import/package-plan.js.

const path = require("node:path");
const { randomUUID } = require("node:crypto");
const XLSX = require("xlsx");
const { Op } = require("sequelize");
const { sequelize, Package, PackageLine, Attachment, Origin } = require("../models");
const { NotFoundError, ValidationError, ConflictError } = require("../shared/errors");
const { uuid, isUuid } = require("../shared/validate");
const { storage, keys } = require("../storage");
const { planPackageImport, reportIssues } = require("../import/package-plan");
const lineService = require("./line.service");

const EXTENSIONS = [".xlsx", ".xls"];

// cellStyles: para saber quais linhas estão ocultas (filtro do Excel ou grupo recolhido).
function readWorkbook(buffer) {
  try {
    return XLSX.read(buffer, { type: "buffer", cellDates: true, cellFormula: false, cellHTML: false, cellStyles: true });
  } catch (_err) {
    return null;
  }
}

// Estado atual: todos os pacotes (com itens e anexos por item) e as origens. O sistema tem poucos pacotes (~22).
async function loadState({ transaction } = {}) {
  const packages = await Package.findAll({ order: [["number", "ASC"]], raw: true, transaction });
  const lines = await PackageLine.findAll({
    attributes: ["id", "packageId", "parentLineId", "itemNo", "description", "quantity", "unit", "storCode", "tag", "warehouseLocation"],
    order: [["sortOrder", "ASC"], ["itemNo", "ASC"]],
    raw: true,
    transaction
  });
  const attachmentCounts = await Attachment.findAll({
    attributes: ["lineId", [sequelize.fn("count", sequelize.col("id")), "n"]],
    where: { lineId: { [Op.ne]: null } },
    group: ["lineId"],
    raw: true,
    transaction
  });
  const attachmentsByLine = new Map(attachmentCounts.map((r) => [r.lineId, Number(r.n)]));
  const itemNoById = new Map(lines.map((l) => [l.id, l.itemNo]));
  const linesByPackage = new Map(packages.map((p) => [p.id, []]));
  for (const l of lines) {
    linesByPackage.get(l.packageId)?.push({
      itemNo: l.itemNo,
      parentItemNo: l.parentLineId ? itemNoById.get(l.parentLineId) || null : null,
      description: l.description,
      quantity: l.quantity === null ? null : Number(l.quantity),
      unit: l.unit,
      storCode: l.storCode,
      tag: l.tag,
      warehouseLocation: l.warehouseLocation,
      attachmentCount: attachmentsByLine.get(l.id) || 0
    });
  }
  const origins = await Origin.findAll({ attributes: ["id", "name", "code", "active"], raw: true, transaction });
  return {
    packages: packages.map((p) => ({ ...p, lines: linesByPackage.get(p.id) })),
    origins
  };
}

// "Importar pacote": só o pacote aberto.
async function onlyNumberOf(packageId) {
  if (packageId === undefined || packageId === null || packageId === "") return null;
  const pkg = await Package.findByPk(uuid(packageId, "packageId"), { attributes: ["number"] });
  if (!pkg) throw new NotFoundError("Package not found.");
  return pkg.number;
}

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
  return workbook;
}

// O que a tela mostra: resumo, o que muda em cada pacote e os problemas agrupados. Sem os dados internos do plano.
function report(importId, plan) {
  return {
    importId,
    fingerprint: plan.fingerprint,
    canImport: plan.canImport,
    summary: plan.summary,
    confirmKeys: plan.confirmKeys,
    packages: plan.packages.map((p) => ({
      number: p.current?.number ?? null,
      name: p.data.name ?? p.current?.name ?? p.ref.name,
      row: p.ref.row,
      status: p.current?.status ?? "draft",
      action: p.action,
      changes: p.changes,
      items: p.items
    })),
    issues: reportIssues(plan.issues)
  };
}

async function start(file, body = {}) {
  if (!file) throw new ValidationError("No file received.", { field: "file", code: "required" });
  const originalName = Buffer.from(file.originalname || "", "latin1").toString("utf8");
  if (!EXTENSIONS.includes(path.extname(originalName).toLowerCase())) {
    throw new ValidationError("Upload an Excel file (.xlsx or .xls).", { field: "file", code: "file_type" }, "IMPORT_FILE_TYPE");
  }
  const workbook = readWorkbook(file.buffer);
  if (!workbook || workbook.SheetNames.length === 0) throw new ValidationError("Could not read the spreadsheet.", null, "IMPORT_UNREADABLE");
  const onlyNumber = await onlyNumberOf(body.packageId);
  const plan = planPackageImport(workbook, await loadState(), { onlyNumber });
  const importId = randomUUID();
  await storage.put(keys.importFile(importId), file.buffer);
  return report(importId, plan);
}

async function commit(importId, body = {}, userId) {
  const workbook = await loadFile(importId);
  const onlyNumber = await onlyNumberOf(body.packageId);
  const confirmed = new Set(Array.isArray(body.confirmed) ? body.confirmed.map(String) : []);

  const outcome = await sequelize.transaction(async (transaction) => {
    const plan = planPackageImport(workbook, await loadState({ transaction }), { onlyNumber });
    // Algo mudou desde a verificação (outro vendedor gravou, ou outro arquivo/escolha): verificar de novo.
    if (plan.fingerprint !== body.fingerprint) {
      throw new ConflictError("The packages changed since the check. Check the file again.", report(importId.toLowerCase(), plan), "PACKAGE_IMPORT_STALE");
    }
    if (!plan.canImport) throw new ValidationError("The file has problems that prevent the import.", null, "PACKAGE_IMPORT_HAS_ERRORS");
    const missing = plan.confirmKeys.filter((k) => !confirmed.has(k));
    if (missing.length) throw new ValidationError("Some warnings were not confirmed.", { missing }, "PACKAGE_IMPORT_CONFIRM");

    let nextNumber = ((await Package.max("number", { transaction })) || 0) + 1;
    const result = { created: [], updated: [], unchanged: 0, linesInserted: 0, linesRemoved: 0, relinkedAttachments: 0, unlinkedAttachments: 0 };
    for (const p of plan.packages) {
      if (p.action === "unchanged") {
        result.unchanged += 1;
        continue;
      }
      let pkg;
      if (p.isNew) {
        pkg = await Package.create({ ...p.data, number: nextNumber, status: "draft", createdBy: userId, updatedBy: userId }, { transaction });
        nextNumber += 1;
        result.created.push({ id: pkg.id, number: pkg.number, name: pkg.name });
      } else {
        pkg = await Package.findByPk(p.current.id, { transaction });
        const fields = {};
        for (const c of p.changes) {
          const field = c.field === "origin" ? "originId" : c.field;
          fields[field] = p.data[field];
        }
        pkg.set({ ...fields, updatedBy: userId });
        // Grava (e atualiza a data) mesmo quando só os itens mudaram.
        pkg.changed("updatedBy", true);
        await pkg.save({ transaction });
        result.updated.push({ id: pkg.id, number: pkg.number, name: pkg.name });
      }
      if (p.lines && (p.isNew ? p.lines.length > 0 : p.items.changedAny)) {
        const replaced = await lineService.replaceLines(pkg.id, p.lines, { transaction });
        result.linesInserted += replaced.inserted;
        result.linesRemoved += replaced.removed;
        result.relinkedAttachments += replaced.relinkedAttachments;
        result.unlinkedAttachments += replaced.unlinkedAttachments;
      }
    }
    return result;
  });

  await storage.remove(keys.importFile(importId.toLowerCase()));
  return outcome;
}

async function cancel(importId) {
  if (isUuid(importId)) await storage.remove(keys.importFile(importId.toLowerCase()));
}

module.exports = { start, commit, cancel, loadState };
