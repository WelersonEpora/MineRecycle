"use strict";

const { Op } = require("sequelize");
const { sequelize, Package, Attachment, AccessLinkPackage } = require("../models");
const { NotFoundError, ConflictError } = require("../shared/errors");
const { requiredString, optionalString, oneOf, positiveInt, uuid } = require("../shared/validate");
const { PACKAGE_TYPES, LOCATIONS, PACKAGE_STATUSES } = require("../domain/constants");
const { packageAccess, isEffectivelyRestricted } = require("../domain/access-policy");
const { storage, keys } = require("../storage");
const settingsService = require("./settings.service");
const lineService = require("./line.service");
const accessLog = require("./access-log.service");
const { packageDto, attachmentDto } = require("./dto");

const LINE_COUNT = [sequelize.literal(`(SELECT count(*) FROM package_line l WHERE l.package_id = "Package"."id")::int`), "lineCount"];
const ATTACHMENT_COUNT = [sequelize.literal(`(SELECT count(*) FROM attachment a WHERE a.package_id = "Package"."id")::int`), "attachmentCount"];

function escapeLike(s) {
  return s.replace(/[\\%_]/g, (c) => `\\${c}`);
}

function filters(query) {
  const where = {};
  if (PACKAGE_TYPES.includes(query.type)) where.type = query.type;
  if (LOCATIONS.includes(query.location)) where.location = query.location;
  const q = typeof query.q === "string" ? query.q.trim().slice(0, 100) : "";
  if (q) {
    const like = { [Op.iLike]: `%${escapeLike(q)}%` };
    where[Op.or] = [{ name: like }, { description: like }];
    if (/^\d+$/.test(q)) where[Op.or].push({ number: Number(q) });
  }
  return where;
}

// Primeira foto pública de cada pacote, para a miniatura do cartão.
async function coverThumbs(packageIds) {
  if (!packageIds.length) return new Map();
  const photos = await Attachment.findAll({
    where: { packageId: packageIds, kind: "photo", visibility: "public", thumbKey: { [Op.ne]: null } },
    order: [["sortOrder", "ASC"], ["createdAt", "ASC"]],
    attributes: ["id", "packageId"]
  });
  const map = new Map();
  for (const p of photos) if (!map.has(p.packageId)) map.set(p.packageId, `/api/v1/files/${p.id}/thumb`);
  return map;
}

// ---------- Vitrine pública ----------

async function listPublic(query = {}) {
  const statuses = await settingsService.getShowcaseStatuses();
  const where = { ...filters(query), status: statuses };
  if (PACKAGE_STATUSES.includes(query.status) && statuses.includes(query.status)) where.status = query.status;
  const packages = await Package.findAll({
    where,
    attributes: { include: [LINE_COUNT] },
    order: [["number", "ASC"]]
  });
  const covers = await coverThumbs(packages.map((p) => p.id));
  return {
    items: packages.map((p) => packageDto(p, { lineCount: p.get("lineCount"), coverUrl: covers.get(p.id) || null })),
    showcaseStatuses: statuses
  };
}

async function findAccessible(number, viewer) {
  const n = positiveInt(number, "number");
  const pkg = await Package.findOne({ where: { number: n } });
  const statuses = await settingsService.getShowcaseStatuses();
  const access = packageAccess(pkg, viewer, statuses);
  // Pacote inexistente e pacote fora do alcance dão a mesma resposta.
  if (!access) throw new NotFoundError("Package not found.");
  return { pkg, access };
}

async function getForViewer(number, viewer, req) {
  const { pkg, access } = await findAccessible(number, viewer);
  const full = access !== "public";
  const attachments = await Attachment.findAll({
    where: { packageId: pkg.id },
    order: [["sortOrder", "ASC"], ["createdAt", "ASC"]]
  });
  const visible = attachments.filter((a) => full || !isEffectivelyRestricted(a));
  const restrictedCount = attachments.length - attachments.filter((a) => !isEffectivelyRestricted(a)).length;
  const lineCount = await sequelize.models.PackageLine.count({ where: { packageId: pkg.id } });

  if (access === "buyer") await accessLog.record(viewer.link.id, "view_package", { packageId: pkg.id }, req);

  return {
    package: packageDto(pkg, { lineCount }),
    access,
    attachments: visible.map((a) => attachmentDto(a, { full })),
    // O público sabe que existem documentos restritos (sem ver quais), para pedir acesso.
    restrictedCount: full ? undefined : restrictedCount,
    buyerLink: access === "buyer" ? { label: viewer.link.label, expiresAt: viewer.link.expiresAt } : undefined
  };
}

async function listLinesForViewer(number, viewer, query) {
  const { pkg } = await findAccessible(number, viewer);
  return lineService.listLines(pkg.id, query);
}

// ---------- Área do vendedor ----------

function parsePackageInput(body, { partial }) {
  const out = {};
  if (!partial || body.number !== undefined) out.number = positiveInt(body.number, "number", { max: 999999 });
  if (!partial || body.name !== undefined) out.name = requiredString(body.name, "name", { max: 200 });
  if (!partial || body.type !== undefined) out.type = oneOf(body.type, "type", PACKAGE_TYPES);
  if (!partial || body.location !== undefined) out.location = oneOf(body.location, "location", LOCATIONS);
  if (!partial || body.description !== undefined) out.description = optionalString(body.description, "description", { max: 20000 });
  return out;
}

async function assertNumberFree(number, exceptId = null) {
  const clash = await Package.findOne({ where: { number, ...(exceptId ? { id: { [Op.ne]: exceptId } } : {}) } });
  if (clash) throw new ConflictError("A package with this number already exists.", { field: "number" }, "NUMBER_TAKEN");
}

async function listForSeller(query = {}) {
  const where = filters(query);
  if (PACKAGE_STATUSES.includes(query.status)) where.status = query.status;
  const packages = await Package.findAll({
    where,
    attributes: { include: [LINE_COUNT, ATTACHMENT_COUNT] },
    order: [["number", "ASC"]]
  });
  const covers = await coverThumbs(packages.map((p) => p.id));
  return packages.map((p) =>
    packageDto(p, { lineCount: p.get("lineCount"), attachmentCount: p.get("attachmentCount"), coverUrl: covers.get(p.id) || null })
  );
}

async function getForSeller(id) {
  const pkg = await Package.findByPk(uuid(id, "id"), { attributes: { include: [LINE_COUNT, ATTACHMENT_COUNT] } });
  if (!pkg) throw new NotFoundError("Package not found.");
  const linkCount = await AccessLinkPackage.count({ where: { packageId: pkg.id } });
  return packageDto(pkg, { lineCount: pkg.get("lineCount"), attachmentCount: pkg.get("attachmentCount"), linkCount });
}

async function create(body, userId) {
  const data = parsePackageInput(body, { partial: false });
  await assertNumberFree(data.number);
  const pkg = await Package.create({ ...data, status: "draft", createdBy: userId, updatedBy: userId });
  return getForSeller(pkg.id);
}

async function update(id, body, userId) {
  const pkg = await Package.findByPk(uuid(id, "id"));
  if (!pkg) throw new NotFoundError("Package not found.");
  const data = parsePackageInput(body, { partial: true });
  if (data.number !== undefined) await assertNumberFree(data.number, pkg.id);
  await pkg.update({ ...data, updatedBy: userId });
  return getForSeller(pkg.id);
}

async function setStatus(id, status, userId) {
  const pkg = await Package.findByPk(uuid(id, "id"));
  if (!pkg) throw new NotFoundError("Package not found.");
  await pkg.update({ status: oneOf(status, "status", PACKAGE_STATUSES), updatedBy: userId });
  return getForSeller(pkg.id);
}

async function remove(id) {
  const pkg = await Package.findByPk(uuid(id, "id"));
  if (!pkg) throw new NotFoundError("Package not found.");
  await pkg.destroy();
  await storage.removePrefix(keys.packagePrefix(pkg.id));
}

module.exports = {
  listPublic,
  getForViewer,
  listLinesForViewer,
  listForSeller,
  getForSeller,
  create,
  update,
  setStatus,
  remove
};
