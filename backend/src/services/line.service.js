"use strict";

const { randomUUID } = require("node:crypto");
const { Op } = require("sequelize");
const { sequelize, Package, PackageLine, Attachment } = require("../models");
const { NotFoundError, ValidationError, ConflictError } = require("../shared/errors");
const { requiredString, optionalString, uuid, pagination } = require("../shared/validate");
const { parseQuantity } = require("../import/quantity");
const { normalizeUnit } = require("../import/units");
const { insertionOrder } = require("../import/import-plan");
const { lineDto } = require("./dto");

function escapeLike(s) {
  return s.replace(/[\\%_]/g, (c) => `\\${c}`);
}

// Linhas paginadas, com busca por descrição, nº do item, código STOR ou tag.
async function listLines(packageId, query = {}) {
  const { page, pageSize, offset } = pagination(query, { defaultSize: 50, maxSize: 500 });
  const where = { packageId };
  const q = typeof query.q === "string" ? query.q.trim().slice(0, 100) : "";
  if (q) {
    const like = { [Op.iLike]: `%${escapeLike(q)}%` };
    where[Op.or] = [{ description: like }, { itemNo: like }, { storCode: like }, { tag: like }];
  }
  const { rows, count } = await PackageLine.findAndCountAll({
    where,
    order: [["sortOrder", "ASC"], ["itemNo", "ASC"]],
    limit: pageSize,
    offset
  });
  const total = q ? await PackageLine.count({ where: { packageId } }) : count;
  return { items: rows.map(lineDto), page, pageSize, total: count, totalUnfiltered: total };
}

function parseLineInput(body, { partial }) {
  const out = {};
  if (!partial || body.itemNo !== undefined) out.itemNo = requiredString(String(body.itemNo ?? ""), "itemNo", { max: 40 });
  if (!partial || body.description !== undefined) out.description = requiredString(body.description, "description", { max: 4000 });
  if (!partial || body.quantity !== undefined) {
    const q = parseQuantity(body.quantity === "" ? null : body.quantity);
    if (q.error) throw new ValidationError("Invalid quantity.", { field: "quantity", code: q.error });
    out.quantity = q.value;
  }
  if (!partial || body.unit !== undefined) {
    const u = normalizeUnit(body.unit);
    out.unit = u.unit;
    out.unitRaw = u.raw;
  }
  for (const [field, max] of [["storCode", 64], ["tag", 64], ["warehouseLocation", 128]]) {
    if (!partial || body[field] !== undefined) out[field] = optionalString(body[field], field, { max });
  }
  return out;
}

async function resolveParent(packageId, parentLineId, selfId = null) {
  if (parentLineId === undefined) return undefined;
  if (parentLineId === null || parentLineId === "") return null;
  const id = uuid(parentLineId, "parentLineId");
  if (id === selfId) throw new ValidationError("A line cannot be its own parent.", { field: "parentLineId", code: "invalid" });
  const parent = await PackageLine.findOne({ where: { id, packageId } });
  if (!parent) throw new ValidationError("Parent line not found in this package.", { field: "parentLineId", code: "invalid" });
  return id;
}

async function assertItemNoFree(packageId, itemNo, exceptId = null) {
  const clash = await PackageLine.findOne({ where: { packageId, itemNo, ...(exceptId ? { id: { [Op.ne]: exceptId } } : {}) } });
  if (clash) throw new ConflictError("This item number already exists in the package.", { field: "itemNo" }, "ITEM_NO_TAKEN");
}

async function create(packageId, body) {
  const pkg = await Package.findByPk(uuid(packageId, "packageId"));
  if (!pkg) throw new NotFoundError("Package not found.");
  const data = parseLineInput(body, { partial: false });
  await assertItemNoFree(pkg.id, data.itemNo);
  const parentLineId = await resolveParent(pkg.id, body.parentLineId);
  const max = (await PackageLine.max("sortOrder", { where: { packageId: pkg.id } })) || 0;
  const line = await PackageLine.create({ ...data, packageId: pkg.id, parentLineId: parentLineId ?? null, sortOrder: max + 1 });
  return lineDto(line);
}

async function update(lineId, body) {
  const line = await PackageLine.findByPk(uuid(lineId, "lineId"));
  if (!line) throw new NotFoundError("Line not found.");
  const data = parseLineInput(body, { partial: true });
  if (data.itemNo) await assertItemNoFree(line.packageId, data.itemNo, line.id);
  const parentLineId = await resolveParent(line.packageId, body.parentLineId, line.id);
  if (parentLineId !== undefined) data.parentLineId = parentLineId;
  if (body.sortOrder !== undefined && Number.isInteger(body.sortOrder)) data.sortOrder = body.sortOrder;
  await line.update(data);
  return lineDto(line);
}

async function remove(lineId) {
  const line = await PackageLine.findByPk(uuid(lineId, "lineId"));
  if (!line) throw new NotFoundError("Line not found.");
  await line.destroy();
}

// Troca todas as linhas do pacote (importação de planilha). Anexos ligados a linhas são religados pelo nº do item;
// se o item sumiu, o anexo continua no pacote, sem linha (FK com SET NULL).
async function replaceLines(packageId, planLines, { transaction }) {
  const previous = await PackageLine.findAll({ where: { packageId }, attributes: ["id", "itemNo"], transaction });
  const itemNoById = new Map(previous.map((l) => [l.id, l.itemNo]));
  const linked = await Attachment.findAll({
    where: { packageId, lineId: { [Op.ne]: null } },
    attributes: ["id", "lineId"],
    transaction
  });

  await PackageLine.destroy({ where: { packageId }, transaction });

  const idByItemNo = new Map(planLines.map((l) => [l.itemNo, randomUUID()]));
  const rows = insertionOrder(planLines).map((l) => ({
    id: idByItemNo.get(l.itemNo),
    packageId,
    parentLineId: l.parentItemNo ? idByItemNo.get(l.parentItemNo) : null,
    itemNo: l.itemNo,
    description: l.description,
    quantity: l.quantity,
    unit: l.unit,
    unitRaw: l.unitRaw,
    storCode: l.storCode || null,
    tag: l.tag || null,
    warehouseLocation: l.warehouseLocation || null,
    sortOrder: l.sortOrder
  }));
  for (let i = 0; i < rows.length; i += 1000) {
    await PackageLine.bulkCreate(rows.slice(i, i + 1000), { transaction });
  }

  const relinkGroups = new Map();
  let unlinked = 0;
  for (const att of linked) {
    const newId = idByItemNo.get(itemNoById.get(att.lineId));
    if (!newId) {
      unlinked += 1;
      continue;
    }
    if (!relinkGroups.has(newId)) relinkGroups.set(newId, []);
    relinkGroups.get(newId).push(att.id);
  }
  for (const [newLineId, ids] of relinkGroups) {
    await Attachment.update({ lineId: newLineId }, { where: { id: ids }, transaction });
  }

  return { inserted: rows.length, removed: previous.length, relinkedAttachments: linked.length - unlinked, unlinkedAttachments: unlinked };
}

async function replaceLinesTx(packageId, planLines) {
  return sequelize.transaction((transaction) => replaceLines(packageId, planLines, { transaction }));
}

module.exports = { listLines, create, update, remove, replaceLines, replaceLinesTx };
