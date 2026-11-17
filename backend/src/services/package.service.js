"use strict";

const { Op } = require("sequelize");
const { sequelize, Package, Origin, Attachment, AccessLinkPackage } = require("../models");
const { NotFoundError, ConflictError, ValidationError } = require("../shared/errors");
const { requiredString, optionalString, oneOf, positiveInt, uuid, isUuid } = require("../shared/validate");
const { PACKAGE_TYPES, PACKAGE_CATEGORIES, LOCATIONS, PACKAGE_STATUSES, PUBLIC_STATUSES } = require("../domain/constants");
const { parseCatalogQuery, filterCatalog } = require("../domain/catalog-filter");
const { isStorDocumentCode } = require("../import/stor-code");
const { packageAccess, isEffectivelyRestricted, attachmentVisibleTo, canSendInquiry } = require("../domain/access-policy");
const { storage, keys } = require("../storage");
const originService = require("./origin.service");
const lineService = require("./line.service");
const accessLog = require("./access-log.service");
const { packageDto, attachmentDto } = require("./dto");
const { CARD_STATS, cardExtra } = require("./package-card-stats");

const LINE_COUNT = [sequelize.literal(`(SELECT count(*) FROM package_line l WHERE l.package_id = "Package"."id")::int`), "lineCount"];
// Ordem da vitrine e da lista do vendedor: menor número do pacote (planilha de estratégia), depois o nome; sem número
// vai para o fim. O número de catálogo só desempata.
const PACKAGE_ORDER = [
  sequelize.literal(`(SELECT min(n) FROM unnest("Package"."stor_numbers") AS n) ASC NULLS LAST`),
  ["name", "ASC"],
  ["number", "ASC"]
];
const ORIGIN_INCLUDE = { model: Origin, as: "origin", attributes: ["id", "name", "code", "active"] };
const ATTACHMENT_COUNT = [sequelize.literal(`(SELECT count(*) FROM attachment a WHERE a.package_id = "Package"."id")::int`), "attachmentCount"];

function escapeLike(s) {
  return s.replace(/[\\%_]/g, (c) => `\\${c}`);
}

function filters(query) {
  const where = {};
  if (PACKAGE_TYPES.includes(query.type)) where.type = query.type;
  if (isUuid(query.originId)) where.originId = query.originId.toLowerCase();
  if (LOCATIONS.includes(query.location)) where.locations = { [Op.contains]: [query.location] };
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

// Busca da vitrine e do link do comprador: nome, descrição e descrição dos itens.
function textSearch(q) {
  if (!q) return null;
  const like = `%${escapeLike(q)}%`;
  return {
    [Op.or]: [
      { name: { [Op.iLike]: like } },
      { description: { [Op.iLike]: like } },
      sequelize.literal(`EXISTS (SELECT 1 FROM package_line l WHERE l.package_id = "Package"."id" AND l.description ILIKE ${sequelize.escape(like)})`)
    ]
  };
}

// Lista com filtros e contagens (vitrine e link do comprador). `where` limita ao que o visitante pode ver.
async function browse(where, query, { negotiationToggle }) {
  const f = parseCatalogQuery(query);
  const search = textSearch(f.q);
  const packages = await Package.findAll({
    where: search ? { [Op.and]: [where, search] } : where,
    attributes: { include: CARD_STATS },
    include: [ORIGIN_INCLUDE],
    order: PACKAGE_ORDER
  });
  const plain = packages.map((p) => ({ p, type: p.type, originCode: p.origin?.code, locations: p.locations, status: p.status }));
  const { items, facets } = filterCatalog(plain, f, { negotiationToggle });
  const covers = await coverThumbs(items.map((x) => x.p.id));
  const names = new Map(packages.filter((p) => p.origin).map((p) => [p.origin.code, p.origin.name]));
  facets.origin.options = facets.origin.options.map((o) => ({ ...o, name: names.get(o.value) || o.value }));
  return {
    items: items.map(({ p }) => packageDto(p, { ...cardExtra(p), coverUrl: covers.get(p.id) || null })),
    facets
  };
}

// Vitrine pública: ativos e em negociação (estes só com a caixa marcada); nunca vendido, rascunho ou inativo.
async function listPublic(query = {}) {
  return browse({ status: PUBLIC_STATUSES }, query, { negotiationToggle: true });
}

async function findAccessible(number, viewer) {
  const n = positiveInt(number, "number");
  const pkg = await Package.findOne({ where: { number: n }, include: [ORIGIN_INCLUDE] });
  const access = packageAccess(pkg, viewer);
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
  const visible = attachments.filter((a) => attachmentVisibleTo(a, access));
  // Só conta o que o comprador veria pelo link (internos ficam de fora).
  const restrictedCount = attachments.filter((a) => isEffectivelyRestricted(a) && attachmentVisibleTo(a, "buyer")).length;
  const lineCount = await sequelize.models.PackageLine.count({ where: { packageId: pkg.id } });

  if (access === "buyer") await accessLog.record(viewer.link.id, "view_package", { packageId: pkg.id }, req);

  return {
    package: packageDto(pkg, { lineCount }),
    access,
    attachments: visible.map((a) => attachmentDto(a, { full })),
    // O público sabe que existem documentos restritos (sem ver quais), para pedir acesso.
    restrictedCount: full ? undefined : restrictedCount,
    // Mostra o formulário de pedido de informação (visitante e comprador; nunca pacote vendido).
    canInquire: canSendInquiry(pkg, access),
    buyerLink: access === "buyer" ? { label: viewer.link.label, expiresAt: viewer.link.expiresAt } : undefined
  };
}

async function listLinesForViewer(number, viewer, query) {
  const { pkg } = await findAccessible(number, viewer);
  return lineService.listLines(pkg.id, query);
}

// ---------- Área do vendedor ----------

// Lista de locais: ao menos um, sem repetição, na ordem de LOCATIONS. "A confirmar" pode vir junto de locais conhecidos
// ("está aqui, e pode haver partes em outro lugar").
function parseLocations(value) {
  if (!Array.isArray(value) || value.length === 0) throw new ValidationError("Choose at least one location.", { field: "locations", code: "required" });
  if (value.some((v) => !LOCATIONS.includes(v))) throw new ValidationError("Invalid location.", { field: "locations", code: "invalid" });
  return LOCATIONS.filter((l) => value.includes(l));
}

// Números do pacote na planilha de estratégia (1 a 999), sem repetição, em ordem. Lista ou texto ("1, 6" ou "7-8-11").
function parseStorNumbers(value) {
  if (value === null || value === undefined || value === "") return [];
  const list = Array.isArray(value) ? value : String(value).split(/[s,;-]+/).filter(Boolean);
  const nums = list.map((v) => (typeof v === "string" && v.trim() !== "" ? Number(v) : v));
  if (nums.length > 30 || nums.some((n) => !Number.isInteger(n) || n < 1 || n > 999)) {
    throw new ValidationError("Package numbers are whole numbers from 1 to 999.", { field: "storNumbers", code: "invalid" });
  }
  return [...new Set(nums)].sort((a, b) => a - b);
}

// Códigos das planilhas do STOR: 7 dígitos cada, sem repetição. Aceita lista ou texto separado por vírgula/espaço.
function parseStorDocuments(value) {
  if (value === null || value === undefined || value === "") return [];
  const list = Array.isArray(value) ? value : String(value).split(/[\s,;]+/);
  const codes = list.map((v) => String(v ?? "").trim()).filter(Boolean);
  if (codes.length > 50) throw new ValidationError("Too many STOR documents.", { field: "storDocuments", code: "too_long" });
  const bad = codes.find((c) => !isStorDocumentCode(c));
  if (bad) throw new ValidationError("STOR document codes have 7 digits.", { field: "storDocuments", code: "invalid", value: bad });
  return [...new Set(codes)];
}

function parsePackageInput(body, { partial }) {
  const out = {};
  // Número do catálogo: no cadastro, vazio = o próximo livre (gerado em create).
  const numberGiven = body.number !== undefined && body.number !== null && body.number !== "";
  if (numberGiven || (partial && body.number !== undefined)) out.number = positiveInt(body.number, "number", { max: 999999 });
  if (!partial || body.name !== undefined) out.name = requiredString(body.name, "name", { max: 200 });
  if (!partial || body.type !== undefined) out.type = oneOf(body.type, "type", PACKAGE_TYPES);
  // Categoria: opcional no cadastro (padrão "other").
  if (body.category !== undefined || !partial) out.category = oneOf(body.category ?? "other", "category", PACKAGE_CATEGORIES);
  if (!partial || body.locations !== undefined) out.locations = parseLocations(body.locations);
  if (!partial || body.description !== undefined) out.description = optionalString(body.description, "description", { max: 20000 });
  if (!partial || body.storDocuments !== undefined) out.storDocuments = parseStorDocuments(body.storDocuments);
  if (!partial || body.storDocumentsPending !== undefined) out.storDocumentsPending = parseStorDocuments(body.storDocumentsPending);
  if (!partial || body.storFolder !== undefined) out.storFolder = optionalString(body.storFolder, "storFolder", { max: 200 }) || null;
  if (!partial || body.storNumbers !== undefined) out.storNumbers = parseStorNumbers(body.storNumbers);
  return out;
}

// Pendentes precisam estar entre os documentos do pacote (os que saíram da lista deixam de ser pendentes).
function reconcilePending(data, current = {}) {
  const docs = data.storDocuments ?? current.storDocuments ?? [];
  const pending = data.storDocumentsPending ?? current.storDocumentsPending ?? [];
  const outside = pending.find((c) => !docs.includes(c));
  if (data.storDocumentsPending !== undefined && outside) {
    throw new ValidationError("A pending document must be one of the package STOR documents.", { field: "storDocumentsPending", code: "invalid", value: outside });
  }
  if (data.storDocuments !== undefined || data.storDocumentsPending !== undefined) data.storDocumentsPending = pending.filter((c) => docs.includes(c));
}

async function assertStorFolderFree(storFolder, exceptId = null) {
  if (!storFolder) return;
  const clash = await Package.findOne({ where: { storFolder, ...(exceptId ? { id: { [Op.ne]: exceptId } } : {}) } });
  if (clash) throw new ConflictError("Another package already uses this STOR folder.", { field: "storFolder" }, "STOR_FOLDER_TAKEN");
}

// Campos que só a área do vendedor recebe (não vão para a vitrine nem para o comprador).
const sellerExtra = (p) => ({
  storFolder: p.storFolder || null,
  storNumbers: p.storNumbers || [],
  storDocuments: p.storDocuments || [],
  storDocumentsPending: p.storDocumentsPending || []
});

// Pacotes que já têm este código de documento STOR.
async function findByStorDocument(code) {
  if (!isStorDocumentCode(code)) return [];
  return Package.findAll({
    where: { storDocuments: { [Op.contains]: [code] } },
    attributes: ["id", "number", "name", "storFolder", "storDocumentsPending"],
    order: [["number", "ASC"]]
  });
}

async function addStorDocument(pkg, code, { transaction } = {}) {
  if (!isStorDocumentCode(code) || (pkg.storDocuments || []).includes(code)) return false;
  await pkg.update({ storDocuments: [...(pkg.storDocuments || []), code] }, { transaction });
  return true;
}

async function assertNumberFree(number, exceptId = null) {
  const clash = await Package.findOne({ where: { number, ...(exceptId ? { id: { [Op.ne]: exceptId } } : {}) } });
  if (clash) throw new ConflictError("A package with this number already exists.", { field: "number" }, "NUMBER_TAKEN");
}

async function listForSeller(query = {}) {
  const where = filters(query);
  if (PACKAGE_STATUSES.includes(query.status)) where.status = query.status;
  // Busca por código de documento STOR: só aqui, nunca na vitrine.
  const q = typeof query.q === "string" ? query.q.trim() : "";
  if (q) where[Op.or].push({ storFolder: { [Op.iLike]: `%${escapeLike(q.slice(0, 100))}%` } });
  if (isStorDocumentCode(q)) where[Op.or].push({ storDocuments: { [Op.contains]: [q] } });
  const packages = await Package.findAll({
    where,
    attributes: { include: [LINE_COUNT, ATTACHMENT_COUNT] },
    include: [ORIGIN_INCLUDE],
    order: PACKAGE_ORDER
  });
  const covers = await coverThumbs(packages.map((p) => p.id));
  return packages.map((p) =>
    packageDto(p, {
      ...sellerExtra(p),
      lineCount: p.get("lineCount"),
      attachmentCount: p.get("attachmentCount"),
      coverUrl: covers.get(p.id) || null
    })
  );
}

async function getForSeller(id) {
  const pkg = await Package.findByPk(uuid(id, "id"), { attributes: { include: [LINE_COUNT, ATTACHMENT_COUNT] }, include: [ORIGIN_INCLUDE] });
  if (!pkg) throw new NotFoundError("Package not found.");
  const linkCount = await AccessLinkPackage.count({ where: { packageId: pkg.id } });
  return packageDto(pkg, { ...sellerExtra(pkg), lineCount: pkg.get("lineCount"), attachmentCount: pkg.get("attachmentCount"), linkCount });
}

async function create(body, userId) {
  const data = parsePackageInput(body, { partial: false });
  data.originId = await originService.resolveForPackage(body.originId);
  reconcilePending(data);
  await assertStorFolderFree(data.storFolder);
  if (data.number === undefined) data.number = ((await Package.max("number")) || 0) + 1;
  else await assertNumberFree(data.number);
  const pkg = await Package.create({ ...data, status: "draft", createdBy: userId, updatedBy: userId });
  return getForSeller(pkg.id);
}

async function update(id, body, userId) {
  const pkg = await Package.findByPk(uuid(id, "id"));
  if (!pkg) throw new NotFoundError("Package not found.");
  const data = parsePackageInput(body, { partial: true });
  if (body.originId !== undefined) data.originId = await originService.resolveForPackage(body.originId, pkg.originId);
  reconcilePending(data, pkg);
  if (data.storFolder !== undefined) await assertStorFolderFree(data.storFolder, pkg.id);
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
  browse,
  ORIGIN_INCLUDE,
  getForViewer,
  listLinesForViewer,
  listForSeller,
  getForSeller,
  create,
  update,
  setStatus,
  findByStorDocument,
  addStorDocument,
  remove,
  PACKAGE_ORDER
};
