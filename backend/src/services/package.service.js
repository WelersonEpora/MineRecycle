"use strict";

const { Op } = require("sequelize");
const { sequelize, Package, Origin, Lot, PackageLot, Attachment, AccessLinkPackage, LotSale } = require("../models");
const { NotFoundError, ConflictError, ValidationError } = require("../shared/errors");
const { oneOf, positiveInt, uuid, isUuid, pagination } = require("../shared/validate");
const { parsePackageInput } = require("../domain/package-input");
const { PACKAGE_STATUSES, PUBLIC_STATUSES, PACKAGE_SOURCES } = require("../domain/constants");
const { parseCatalogQuery, filterCatalog } = require("../domain/catalog-filter");
const { packageAccess, isEffectivelyRestricted, attachmentVisibleTo, canSendInquiry, lotVisibleTo } = require("../domain/access-policy");
const { saleSummary } = require("../domain/package-sale");
const { storage, keys } = require("../storage");
const originService = require("./origin.service");
const accessLog = require("./access-log.service");
const packageLots = require("./package-lots");
const { lotOrder } = require("./lot.service");
const { packageDto, lotDto, attachmentDto } = require("./dto");

// Pacote = agrupamento de lotes (decisão de 2026-11-19). Automático (um por valor das colunas de agrupamento da
// planilha; os lotes vêm da importação) ou montado pelo vendedor (manual; ele escolhe os lotes).

// Ordem do catálogo e das listas: nome, depois o ID.
const PACKAGE_ORDER = [
  ["name", "ASC"],
  ["number", "ASC"]
];
const ORIGIN_INCLUDE = { model: Origin, as: "origin", attributes: ["id", "name", "code", "active"] };
const ATTACHMENT_COUNT = [sequelize.literal(`(SELECT count(*) FROM attachment a WHERE a.package_id = "Package"."id")::int`), "attachmentCount"];
// Todos os lotes ligados (o vendedor vê também os retirados e os fora da venda).
const ALL_LOT_COUNT = [sequelize.literal(`(SELECT count(*) FROM package_lot pl WHERE pl.package_id = "Package"."id")::int`), "allLotCount"];

function escapeLike(s) {
  return s.replace(/[\\%_]/g, (c) => `\\${c}`);
}

// Texto buscado no nome e na descrição do pacote e no nº, título e fornecedor dos lotes. `sellerOnly`: inclui lotes
// retirados e fora da venda (o público só acha pelo que pode ver).
function textConditions(q, { sellerOnly = false } = {}) {
  const like = sequelize.escape(`%${escapeLike(q)}%`);
  const offered = sellerOnly ? "" : "AND l.withdrawn_at IS NULL AND l.status <> 'unavailable'";
  const conditions = [
    { name: { [Op.iLike]: `%${escapeLike(q)}%` } },
    { description: { [Op.iLike]: `%${escapeLike(q)}%` } },
    sequelize.literal(`EXISTS (SELECT 1 FROM package_lot pl JOIN lot l ON l.id = pl.lot_id WHERE pl.package_id = "Package"."id" ${offered}
      AND (l.lot_number ILIKE ${like} OR l.title ILIKE ${like} OR l.master_supplier ILIKE ${like} OR l.description ILIKE ${like}))`)
  ];
  if (/^\d+$/.test(q) && q.length <= 9) conditions.push({ number: Number(q) });
  return conditions;
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

// ---------- Catálogo público e link do comprador ----------

// Lista com filtros e contagens. `where` limita ao que o visitante pode ver. Pacote sem nenhum lote em oferta não
// aparece (ex.: pacote automático esvaziado pela planilha).
async function browse(where, query, { negotiationToggle }) {
  const f = parseCatalogQuery(query);
  const conditions = [where, sequelize.literal(`EXISTS (SELECT 1 ${packageLots.OFFERED})`)];
  if (f.q) conditions.push({ [Op.or]: textConditions(f.q) });
  const packages = await Package.findAll({
    where: { [Op.and]: conditions },
    attributes: { include: packageLots.CARD_STATS },
    include: [ORIGIN_INCLUDE],
    order: PACKAGE_ORDER
  });
  const plain = packages.map((p) => ({ p, source: p.source, originCode: p.origin?.code, sites: packageLots.cardExtra(p).sites, status: p.status }));
  const { items, facets } = filterCatalog(plain, f, { negotiationToggle });
  const covers = await coverThumbs(items.map((x) => x.p.id));
  const names = new Map(packages.filter((p) => p.origin).map((p) => [p.origin.code, p.origin.name]));
  facets.origin.options = facets.origin.options.map((o) => ({ ...o, name: names.get(o.value) || o.value }));
  return {
    items: items.map(({ p }) => packageDto(p, { ...packageLots.cardExtra(p), coverUrl: covers.get(p.id) || null })),
    facets
  };
}

// Catálogo público: ativos e em negociação (estes só com a caixa marcada); nunca vendido, rascunho ou inativo.
async function listPublic(query = {}) {
  return browse({ status: PUBLIC_STATUSES }, query, { negotiationToggle: true });
}

async function findAccessible(number, viewer) {
  const n = positiveInt(number, "number");
  const pkg = await Package.findOne({ where: { number: n }, attributes: { include: packageLots.CARD_STATS }, include: [ORIGIN_INCLUDE] });
  const access = packageAccess(pkg, viewer);
  // Pacote inexistente e pacote fora do alcance dão a mesma resposta.
  if (!access) throw new NotFoundError("Package not found.");
  return { pkg, access };
}

async function getForViewer(number, viewer, req) {
  const { pkg, access } = await findAccessible(number, viewer);
  const full = access !== "public";
  const attachments = await Attachment.findAll({ where: { packageId: pkg.id }, order: [["sortOrder", "ASC"], ["createdAt", "ASC"]] });
  const visible = attachments.filter((a) => attachmentVisibleTo(a, access));
  // Só conta o que o comprador veria pelo link (internos ficam de fora).
  const restrictedCount = attachments.filter((a) => isEffectivelyRestricted(a) && attachmentVisibleTo(a, "buyer")).length;
  const summary = await packageLots.summaryOf(pkg.id);

  if (access === "buyer") await accessLog.record(viewer.link.id, "view_package", { packageId: pkg.id }, req);

  return {
    package: packageDto(pkg, packageLots.cardExtra(pkg)),
    access,
    attachments: visible.map((a) => attachmentDto(a, { full })),
    // O público sabe que existem documentos restritos (sem ver quais), para pedir acesso.
    restrictedCount: full ? undefined : restrictedCount,
    // Formulário de pedido: visitante e comprador; nunca pacote vendido ou sem lote disponível.
    canInquire: canSendInquiry(pkg, access, summary),
    buyerLink: access === "buyer" ? { label: viewer.link.label, expiresAt: viewer.link.expiresAt } : undefined
  };
}

// Anexos que cada acesso vê (mesma regra de attachmentVisibleTo), para contar sem revelar os que não vê.
const VISIBLE_ATTACHMENT_SQL = {
  seller: "",
  buyer: "AND a.visibility <> 'internal'",
  public: "AND a.visibility = 'public' AND a.kind <> 'proposal'"
};

// Lotes do pacote, paginados, na ordem do pacote. `seller`: todos, com os campos internos; senão, só os visíveis.
async function lotsPage(pkg, access, query = {}) {
  const { page, pageSize, offset } = pagination(query, { defaultSize: 50, maxSize: 500 });
  const where = access === "seller" ? {} : { withdrawnAt: null, status: { [Op.ne]: "unavailable" } };
  const q = typeof query.q === "string" ? query.q.trim().slice(0, 100) : "";
  if (q) {
    const like = { [Op.iLike]: `%${escapeLike(q)}%` };
    where[Op.or] = [{ lotNumber: like }, { title: like }, { masterSupplier: like }];
  }
  const { rows, count } = await Lot.findAndCountAll({
    where,
    include: [{ model: PackageLot, as: "packageLots", where: { packageId: pkg.id }, attributes: [] }],
    attributes: {
      include: [
        [sequelize.literal(`(SELECT pl.position FROM package_lot pl WHERE pl.lot_id = "Lot"."id" AND pl.package_id = ${sequelize.escape(pkg.id)})`), "position"],
        [sequelize.literal(`(SELECT count(*) FROM attachment a WHERE a.lot_id = "Lot"."id" ${VISIBLE_ATTACHMENT_SQL[access]})::int`), "attachmentCount"]
      ]
    },
    // Ordem do pacote, ou a coluna escolhida na tabela.
    order: lotOrder(query, [
      [sequelize.literal(`"position"`), "ASC"],
      ["lotNumber", "ASC"]
    ]),
    limit: pageSize,
    offset,
    subQuery: false
  });
  const covers = await lotCovers(rows.map((l) => l.id), access);
  return {
    items: rows
      .filter((l) => lotVisibleTo(l, access))
      .map((l) => lotDto(l, { seller: access === "seller", extra: { attachmentCount: l.get("attachmentCount"), coverUrl: covers.get(l.id) || null } })),
    total: count,
    page,
    pageSize
  };
}

// Primeira foto de cada lote que este acesso pode ver.
async function lotCovers(lotIds, access) {
  if (!lotIds.length) return new Map();
  const photos = await Attachment.findAll({
    where: { lotId: lotIds, kind: "photo", thumbKey: { [Op.ne]: null } },
    order: [["sortOrder", "ASC"], ["createdAt", "ASC"]]
  });
  const map = new Map();
  for (const p of photos) if (!map.has(p.lotId) && attachmentVisibleTo(p, access)) map.set(p.lotId, `/api/v1/files/${p.id}/thumb`);
  return map;
}

async function listLotsForViewer(number, viewer, query) {
  const { pkg, access } = await findAccessible(number, viewer);
  return lotsPage(pkg, access, query);
}

// Um lote dentro do pacote, com os anexos do lote que o visitante pode ver.
async function getLotForViewer(number, lotId, viewer) {
  const { pkg, access } = await findAccessible(number, viewer);
  const link = isUuid(lotId) ? await PackageLot.findOne({ where: { packageId: pkg.id, lotId: lotId.toLowerCase() } }) : null;
  const lot = link ? await Lot.findByPk(link.lotId) : null;
  if (!lot || !lotVisibleTo(lot, access)) throw new NotFoundError("Lot not found.");
  const attachments = await Attachment.findAll({ where: { lotId: lot.id }, order: [["sortOrder", "ASC"], ["createdAt", "ASC"]] });
  return {
    lot: lotDto(lot, { seller: access === "seller" }),
    attachments: attachments.filter((a) => attachmentVisibleTo(a, access)).map((a) => attachmentDto(a, { full: access !== "public" }))
  };
}

// ---------- Área do vendedor ----------

async function findPackage(id, options = {}) {
  const pkg = await Package.findByPk(uuid(id, "id"), options);
  if (!pkg) throw new NotFoundError("Package not found.");
  return pkg;
}

async function assertNumberFree(number, exceptId = null) {
  const clash = await Package.findOne({ where: { number, ...(exceptId ? { id: { [Op.ne]: exceptId } } : {}) } });
  if (clash) throw new ConflictError("A package with this number already exists.", { field: "number" }, "NUMBER_TAKEN");
}

async function nextNumber(transaction) {
  return ((await Package.max("number", { transaction })) || 0) + 1;
}

function sellerWhere(query) {
  const conditions = [];
  if (PACKAGE_STATUSES.includes(query.status)) conditions.push({ status: query.status });
  if (PACKAGE_SOURCES.includes(query.level)) conditions.push({ source: query.level });
  if (isUuid(query.originId)) conditions.push({ originId: query.originId.toLowerCase() });
  const site = typeof query.site === "string" ? query.site.trim().slice(0, 120) : "";
  if (site) {
    conditions.push(
      sequelize.literal(`EXISTS (SELECT 1 FROM package_lot pl JOIN lot l ON l.id = pl.lot_id WHERE pl.package_id = "Package"."id" AND l.site_name = ${sequelize.escape(site)})`)
    );
  }
  const q = typeof query.q === "string" ? query.q.trim().slice(0, 100) : "";
  if (q) conditions.push({ [Op.or]: textConditions(q, { sellerOnly: true }) });
  return { [Op.and]: conditions };
}

async function listForSeller(query = {}) {
  const packages = await Package.findAll({
    where: sellerWhere(query),
    attributes: { include: [...packageLots.CARD_STATS, ALL_LOT_COUNT, ATTACHMENT_COUNT] },
    include: [ORIGIN_INCLUDE],
    order: PACKAGE_ORDER
  });
  const covers = await coverThumbs(packages.map((p) => p.id));
  return packages.map((p) =>
    packageDto(p, {
      ...packageLots.cardExtra(p),
      allLotCount: p.get("allLotCount"),
      attachmentCount: p.get("attachmentCount"),
      coverUrl: covers.get(p.id) || null
    })
  );
}

async function getForSeller(id) {
  const pkg = await findPackage(id, { attributes: { include: [...packageLots.CARD_STATS, ALL_LOT_COUNT, ATTACHMENT_COUNT] }, include: [ORIGIN_INCLUDE] });
  const linkCount = await AccessLinkPackage.count({ where: { packageId: pkg.id } });
  return packageDto(pkg, {
    ...packageLots.cardExtra(pkg),
    allLotCount: pkg.get("allLotCount"),
    attachmentCount: pkg.get("attachmentCount"),
    linkCount
  });
}

async function listLotsForSeller(id, query) {
  return lotsPage(await findPackage(id), "seller", query);
}

// Origem: opcional desde 2026-11-19 (vazio = sem origem).
async function resolveOrigin(value, current = null) {
  if (value === null || value === "" || value === undefined) return null;
  return originService.resolveForPackage(value, current);
}

// Novo pacote montado pelo vendedor (manual). `lotIds` opcional: já entra com esses lotes.
async function create(body, userId) {
  const data = parsePackageInput(body, { partial: false });
  data.originId = await resolveOrigin(body.originId);
  const lotIds = body.lotIds === undefined ? [] : await parseLotIds(body.lotIds);
  const id = await sequelize.transaction(async (transaction) => {
    if (data.number === undefined) data.number = await nextNumber(transaction);
    else await assertNumberFree(data.number);
    const pkg = await Package.create({ ...data, source: "manual", sourceValue: null, status: "draft", createdBy: userId, updatedBy: userId }, { transaction });
    if (lotIds.length) await PackageLot.bulkCreate(lotIds.map((lotId, position) => ({ packageId: pkg.id, lotId, position })), { transaction });
    return pkg.id;
  });
  return getForSeller(id);
}

// Pacote de um lote só, com o nome do lote (o 4º nível de agrupamento, criado sob demanda).
async function createFromLot(lotId, userId) {
  const lot = await Lot.findByPk(uuid(lotId, "lotId"));
  if (!lot) throw new NotFoundError("Lot not found.");
  return create({ name: lot.title.slice(0, 200), lotIds: [lot.id] }, userId);
}

async function update(id, body, userId) {
  const pkg = await findPackage(id);
  const data = parsePackageInput(body, { partial: true });
  if (body.originId !== undefined) data.originId = await resolveOrigin(body.originId, pkg.originId);
  // O ID (nº do catálogo) é fixo depois de criado: é o endereço da página pública. Reenviar o mesmo número é aceito.
  if (data.number !== undefined && data.number !== pkg.number) {
    throw new ValidationError("The package ID cannot be changed.", { field: "number" }, "NUMBER_LOCKED");
  }
  delete data.number;
  await pkg.update({ ...data, updatedBy: userId });
  return getForSeller(pkg.id);
}

// Mudança de situação. Para "vendido", os lotes do pacote passam a vendidos (em todos os pacotes); se algum já tinha
// sido vendido em outro lugar, pede confirmação (`confirm: true`). Saindo de "vendido", só os lotes vendidos por este
// pacote voltam.
async function setStatus(id, body, userId) {
  const status = oneOf(body?.status, "status", PACKAGE_STATUSES);
  const confirm = body?.confirm === true;
  let sale = null;
  await sequelize.transaction(async (transaction) => {
    const pkg = await findPackage(id, { transaction, lock: transaction.LOCK.UPDATE });
    if (pkg.status === status) return;
    if (status === "sold") {
      if ((await PackageLot.count({ where: { packageId: pkg.id }, transaction })) === 0) {
        throw new ValidationError("A package with no lots cannot be sold.", null, "PACKAGE_EMPTY");
      }
      const plan = await packageLots.sell(pkg, userId, { confirm, transaction });
      sale = { sold: plan.sales.length, alreadySold: plan.alreadySold.length, skipped: plan.skipped.length };
    } else if (pkg.status === "sold") {
      const plan = await packageLots.unsell(pkg, { transaction });
      sale = { released: plan.changes.length, stillSold: plan.stillSold.length };
    }
    await pkg.update({ status, updatedBy: userId }, { transaction });
  });
  return { ...(await getForSeller(id)), sale };
}

async function parseLotIds(value) {
  if (!Array.isArray(value) || value.length === 0) throw new ValidationError("Choose at least one lot.", { field: "lotIds", code: "required" });
  if (value.length > 5000) throw new ValidationError("Too many lots.", { field: "lotIds", code: "too_long" });
  const ids = [...new Set(value.map((v) => uuid(v, "lotIds")))];
  const found = await Lot.count({ where: { id: ids } });
  if (found !== ids.length) throw new ValidationError("Lot not found.", { field: "lotIds", code: "invalid" });
  return ids;
}

// Só o vendedor mexe nos lotes de um pacote manual; nos automáticos manda a planilha. Pacote vendido não muda de lotes.
function assertLotsEditable(pkg) {
  if (pkg.source !== "manual") throw new ConflictError("The lots of this package come from the spreadsheet.", null, "PACKAGE_LOTS_AUTOMATIC");
  if (pkg.status === "sold") throw new ConflictError("A sold package cannot change its lots.", null, "PACKAGE_SOLD_LOCKED");
}

async function addLots(id, body) {
  const lotIds = await parseLotIds(body?.lotIds);
  await sequelize.transaction(async (transaction) => {
    const pkg = await findPackage(id, { transaction, lock: transaction.LOCK.UPDATE });
    assertLotsEditable(pkg);
    const existing = new Set((await PackageLot.findAll({ where: { packageId: pkg.id }, attributes: ["lotId"], transaction })).map((r) => r.lotId));
    const start = ((await PackageLot.max("position", { where: { packageId: pkg.id }, transaction })) ?? -1) + 1;
    const fresh = lotIds.filter((lotId) => !existing.has(lotId));
    if (fresh.length) await PackageLot.bulkCreate(fresh.map((lotId, i) => ({ packageId: pkg.id, lotId, position: start + i })), { transaction });
  });
  return getForSeller(id);
}

async function removeLots(id, body) {
  const lotIds = await parseLotIds(body?.lotIds);
  await sequelize.transaction(async (transaction) => {
    const pkg = await findPackage(id, { transaction, lock: transaction.LOCK.UPDATE });
    assertLotsEditable(pkg);
    await PackageLot.destroy({ where: { packageId: pkg.id, lotId: lotIds }, transaction });
  });
  return getForSeller(id);
}

// Nova ordem dos lotes (lista completa dos ids do pacote).
async function reorderLots(id, body) {
  const lotIds = await parseLotIds(body?.lotIds);
  await sequelize.transaction(async (transaction) => {
    const pkg = await findPackage(id, { transaction, lock: transaction.LOCK.UPDATE });
    assertLotsEditable(pkg);
    const current = (await PackageLot.findAll({ where: { packageId: pkg.id }, attributes: ["lotId"], transaction })).map((r) => r.lotId);
    if (current.length !== lotIds.length || current.some((lotId) => !lotIds.includes(lotId))) {
      throw new ValidationError("Send all the lots of the package.", { field: "lotIds", code: "invalid" });
    }
    for (const [position, lotId] of lotIds.entries()) {
      await PackageLot.update({ position }, { where: { packageId: pkg.id, lotId }, transaction });
    }
  });
  return getForSeller(id);
}

// Excluir: só pacote manual, ou automático vazio (o valor saiu da planilha). Vendido nunca (a venda marcou os lotes).
async function remove(id) {
  const pkg = await findPackage(id);
  if (pkg.status === "sold" || (await LotSale.count({ where: { packageId: pkg.id } }))) {
    throw new ConflictError("A sold package cannot be deleted.", null, "PACKAGE_SOLD_LOCKED");
  }
  if (pkg.source !== "manual" && (await PackageLot.count({ where: { packageId: pkg.id } }))) {
    throw new ConflictError("An automatic package can only be deleted when the spreadsheet no longer has lots for it.", null, "PACKAGE_AUTOMATIC_NOT_EMPTY");
  }
  await pkg.destroy();
  await storage.removePrefix(keys.packagePrefix(pkg.id));
}

module.exports = {
  listPublic,
  browse,
  ORIGIN_INCLUDE,
  PACKAGE_ORDER,
  getForViewer,
  listLotsForViewer,
  getLotForViewer,
  listForSeller,
  getForSeller,
  listLotsForSeller,
  create,
  createFromLot,
  update,
  setStatus,
  addLots,
  removeLots,
  reorderLots,
  remove,
  nextNumber,
  saleSummary
};
