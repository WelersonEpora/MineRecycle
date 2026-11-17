"use strict";

const { Op, fn, col } = require("sequelize");
const { sequelize, AccessLink, AccessLinkPackage, AccessLog, Package, Attachment } = require("../models");
const { NotFoundError, ValidationError, UnauthorizedError, GoneError } = require("../shared/errors");
const { requiredString, optionalString, uuid } = require("../shared/validate");
const { newLinkToken, hashLinkToken, signSession } = require("../shared/tokens");
const { linkState } = require("../domain/access-policy");
const { BUYER_HIDDEN_STATUSES } = require("../domain/constants");
const env = require("../config/env");
const accessLog = require("./access-log.service");
const { packageDto } = require("./dto");

const MAX_DAYS = 365;
const DAY_MS = 24 * 60 * 60 * 1000;

function buildUrl(token) {
  // Token no fragmento (#): o navegador nunca o envia ao servidor, então ele não aparece em log de acesso do nginx.
  return `${env.publicBaseUrl}/access#${token}`;
}

function parseExpiry(value, now = new Date()) {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) throw new ValidationError("Invalid expiry date.", { field: "expiresAt", code: "invalid" });
  if (date.getTime() <= now.getTime() + 60 * 1000) {
    throw new ValidationError("Expiry must be in the future.", { field: "expiresAt", code: "past" });
  }
  if (date.getTime() > now.getTime() + MAX_DAYS * DAY_MS) {
    throw new ValidationError(`Expiry must be within ${MAX_DAYS} days.`, { field: "expiresAt", code: "too_far" });
  }
  return date;
}

async function parsePackageIds(value) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new ValidationError("Choose at least one package.", { field: "packageIds", code: "required" });
  }
  const ids = [...new Set(value.map((v) => uuid(v, "packageIds")))];
  const packages = await Package.findAll({ where: { id: ids }, attributes: ["id", "status"] });
  if (packages.length !== ids.length) throw new ValidationError("Package not found.", { field: "packageIds", code: "invalid" });
  if (packages.some((p) => BUYER_HIDDEN_STATUSES.includes(p.status))) {
    throw new ValidationError("Draft or inactive packages cannot be shared.", { field: "packageIds", code: "package_not_available" });
  }
  return ids;
}

function linkDto(link, stats = {}) {
  return {
    id: link.id,
    label: link.label,
    buyerEmail: link.buyerEmail,
    note: link.note,
    expiresAt: link.expiresAt,
    revokedAt: link.revokedAt,
    state: linkState(link),
    createdAt: link.createdAt,
    createdBy: link.creator ? { id: link.creator.id, name: link.creator.name } : null,
    packages: (link.packages || []).map((p) => ({ id: p.id, number: p.number, name: p.name, storFolder: p.storFolder || null, status: p.status })),
    accessCount: stats.accessCount ?? 0,
    lastAccessAt: stats.lastAccessAt ?? null
  };
}

const LINK_INCLUDE = [
  { association: "packages", attributes: ["id", "number", "name", "storFolder", "status"], through: { attributes: [] } },
  { association: "creator", attributes: ["id", "name"] }
];

async function stats(linkIds) {
  if (!linkIds.length) return new Map();
  const rows = await AccessLog.findAll({
    where: { accessLinkId: linkIds },
    attributes: ["accessLinkId", [fn("count", col("id")), "accessCount"], [fn("max", col("created_at")), "lastAccessAt"]],
    group: ["accessLinkId"],
    raw: true
  });
  return new Map(rows.map((r) => [r.accessLinkId, { accessCount: Number(r.accessCount), lastAccessAt: r.lastAccessAt }]));
}

async function list(query = {}) {
  const where = {};
  if (query.packageId) {
    const links = await AccessLinkPackage.findAll({ where: { packageId: uuid(query.packageId, "packageId") }, attributes: ["accessLinkId"] });
    where.id = links.map((l) => l.accessLinkId);
  }
  const links = await AccessLink.findAll({ where, include: LINK_INCLUDE, order: [["createdAt", "DESC"]] });
  const s = await stats(links.map((l) => l.id));
  return links.map((l) => linkDto(l, s.get(l.id)));
}

async function get(id) {
  const link = await AccessLink.findByPk(uuid(id, "id"), { include: LINK_INCLUDE });
  if (!link) throw new NotFoundError("Link not found.");
  const s = await stats([link.id]);
  return linkDto(link, s.get(link.id));
}

async function create(body, userId) {
  const label = requiredString(body.label, "label", { max: 200 });
  const buyerEmail = optionalString(body.buyerEmail, "buyerEmail", { max: 255 });
  const note = optionalString(body.note, "note", { max: 4000 });
  const expiresAt = parseExpiry(body.expiresAt);
  const packageIds = await parsePackageIds(body.packageIds);

  const token = newLinkToken();
  const link = await sequelize.transaction(async (transaction) => {
    const created = await AccessLink.create(
      { tokenHash: hashLinkToken(token), label, buyerEmail, note, expiresAt, createdBy: userId },
      { transaction }
    );
    await AccessLinkPackage.bulkCreate(
      packageIds.map((packageId) => ({ accessLinkId: created.id, packageId })),
      { transaction }
    );
    return created;
  });
  // O token em claro só existe nesta resposta: o banco guarda o hash.
  return { ...(await get(link.id)), url: buildUrl(token) };
}

async function update(id, body) {
  const link = await AccessLink.findByPk(uuid(id, "id"));
  if (!link) throw new NotFoundError("Link not found.");
  const patch = {};
  if (body.label !== undefined) patch.label = requiredString(body.label, "label", { max: 200 });
  if (body.buyerEmail !== undefined) patch.buyerEmail = optionalString(body.buyerEmail, "buyerEmail", { max: 255 });
  if (body.note !== undefined) patch.note = optionalString(body.note, "note", { max: 4000 });
  if (body.expiresAt !== undefined) patch.expiresAt = parseExpiry(body.expiresAt);
  const packageIds = body.packageIds !== undefined ? await parsePackageIds(body.packageIds) : null;

  await sequelize.transaction(async (transaction) => {
    await link.update(patch, { transaction });
    if (packageIds) {
      await AccessLinkPackage.destroy({ where: { accessLinkId: link.id }, transaction });
      await AccessLinkPackage.bulkCreate(packageIds.map((packageId) => ({ accessLinkId: link.id, packageId })), { transaction });
    }
  });
  return get(link.id);
}

async function revoke(id) {
  const link = await AccessLink.findByPk(uuid(id, "id"));
  if (!link) throw new NotFoundError("Link not found.");
  if (!link.revokedAt) await link.update({ revokedAt: new Date() });
  return get(link.id);
}

async function logs(id) {
  const link = await AccessLink.findByPk(uuid(id, "id"));
  if (!link) throw new NotFoundError("Link not found.");
  const rows = await AccessLog.findAll({ where: { accessLinkId: link.id }, order: [["createdAt", "DESC"]], limit: 500 });
  const packageIds = [...new Set(rows.map((r) => r.packageId).filter(Boolean))];
  const attachmentIds = [...new Set(rows.map((r) => r.attachmentId).filter(Boolean))];
  const packages = new Map((await Package.findAll({ where: { id: packageIds }, attributes: ["id", "number", "name"] })).map((p) => [p.id, p]));
  const attachments = new Map(
    (await Attachment.findAll({ where: { id: attachmentIds }, attributes: ["id", "title", "originalName", "kind"] })).map((a) => [a.id, a])
  );
  return rows.map((r) => ({
    id: Number(r.id),
    action: r.action,
    at: r.createdAt,
    ip: r.ip,
    userAgent: r.userAgent,
    package: packages.has(r.packageId) ? { number: packages.get(r.packageId).number, name: packages.get(r.packageId).name } : null,
    attachment: attachments.has(r.attachmentId)
      ? { title: attachments.get(r.attachmentId).title || attachments.get(r.attachmentId).originalName, kind: attachments.get(r.attachmentId).kind }
      : null
  }));
}

// O comprador abre o link: valida o token e devolve o cookie de sessão do comprador (válido até o link expirar).
async function redeem(token, req) {
  if (typeof token !== "string" || token.length < 20 || token.length > 100) {
    throw new UnauthorizedError("Invalid access link.", null, "LINK_INVALID");
  }
  const link = await AccessLink.findOne({ where: { tokenHash: hashLinkToken(token) } });
  const state = linkState(link);
  if (state === "invalid") throw new UnauthorizedError("Invalid access link.", null, "LINK_INVALID");
  if (state === "expired") throw new GoneError("This access link has expired.", null, "LINK_EXPIRED");
  if (state === "revoked") throw new GoneError("This access link has been revoked.", null, "LINK_REVOKED");

  await accessLog.record(link.id, "open", {}, req);
  const maxAgeMs = new Date(link.expiresAt).getTime() - Date.now();
  return { cookie: signSession({ typ: "buyer", sub: link.id }, maxAgeMs / 1000), maxAgeMs };
}

async function buyerSession(viewerLink) {
  const packages = await Package.findAll({
    where: { id: viewerLink.packageIds, status: { [Op.notIn]: BUYER_HIDDEN_STATUSES } },
    // Mesma ordem da vitrine (números do pacote na planilha de estratégia, depois nome).
    order: [sequelize.literal(`(SELECT min(n) FROM unnest("Package"."stor_numbers") AS n) ASC NULLS LAST`), ["name", "ASC"], ["number", "ASC"]]
  });
  const covers = await Attachment.findAll({
    where: { packageId: packages.map((p) => p.id), kind: "photo", thumbKey: { [Op.ne]: null } },
    order: [["sortOrder", "ASC"], ["createdAt", "ASC"]],
    attributes: ["id", "packageId"]
  });
  const coverByPackage = new Map();
  for (const c of covers) if (!coverByPackage.has(c.packageId)) coverByPackage.set(c.packageId, `/api/v1/files/${c.id}/thumb`);
  return {
    label: viewerLink.label,
    expiresAt: viewerLink.expiresAt,
    packages: packages.map((p) => packageDto(p, { coverUrl: coverByPackage.get(p.id) || null }))
  };
}

module.exports = { list, get, create, update, revoke, logs, redeem, buyerSession, buildUrl };
