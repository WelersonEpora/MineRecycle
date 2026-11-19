"use strict";

const { Op } = require("sequelize");
const { sequelize, Lot, Package, PackageLot, LotSale, Attachment } = require("../models");
const { NotFoundError } = require("../shared/errors");
const { optionalString, uuid, isUuid, pagination } = require("../shared/validate");
const { LOT_STATUSES } = require("../domain/constants");
const { lotDto, packageDto, attachmentDto } = require("./dto");

// Lotes na área do vendedor (2026-11-19): lista com filtros, detalhe e a descrição do vendedor. Os campos da
// planilha só mudam pela importação.

function escapeLike(s) {
  return s.replace(/[\\%_]/g, (c) => `\\${c}`);
}

const text = (v, max = 200) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : "");

// Filtros: busca (nº, título, fornecedor, descrição), sistema, família, subfamília, site, situação, retirados
// (`withdrawn`: "1" só os retirados; padrão, só os ativos na planilha), dentro ou fora de um pacote.
function listWhere(query) {
  const where = {};
  const q = text(query.q, 100);
  if (q) {
    const like = { [Op.iLike]: `%${escapeLike(q)}%` };
    where[Op.or] = [{ lotNumber: like }, { title: like }, { masterSupplier: like }, { description: like }];
  }
  for (const [param, field] of [
    ["linkedSystem", "linkedSystem"],
    ["family", "commercialFamily"],
    ["subfamily", "subfamily"],
    ["site", "siteName"]
  ]) {
    if (query[param] === "-") where[field] = null;
    else if (text(query[param])) where[field] = text(query[param]);
  }
  if (LOT_STATUSES.includes(query.status)) where.status = query.status;
  where.withdrawnAt = query.withdrawn === "1" ? { [Op.ne]: null } : null;
  const and = [];
  if (isUuid(query.notInPackage)) {
    and.push(sequelize.literal(`NOT EXISTS (SELECT 1 FROM package_lot pl WHERE pl.lot_id = "Lot"."id" AND pl.package_id = ${sequelize.escape(query.notInPackage.toLowerCase())})`));
  }
  if (isUuid(query.inPackage)) {
    and.push(sequelize.literal(`EXISTS (SELECT 1 FROM package_lot pl WHERE pl.lot_id = "Lot"."id" AND pl.package_id = ${sequelize.escape(query.inPackage.toLowerCase())})`));
  }
  if (and.length) where[Op.and] = and;
  return where;
}

// Ordenação pela coluna da tabela (?sort=&order=asc|desc). Desempate pelo nº do lote.
const SORTS = ["lotNumber", "title", "masterSupplier", "linkedSystem", "commercialFamily", "subfamily", "siteName", "status"];
function lotOrder(query, fallback = [["lotNumber", "ASC"]]) {
  if (!SORTS.includes(query.sort)) return fallback;
  const dir = query.order === "desc" ? "DESC" : "ASC";
  const nulls = dir === "ASC" ? "ASC NULLS LAST" : "DESC NULLS LAST";
  const order = [[query.sort, nulls]];
  if (query.sort !== "lotNumber") order.push(["lotNumber", "ASC"]);
  return order;
}

const LIST_EXTRA = [
  [sequelize.literal(`(SELECT count(*) FROM package_lot pl WHERE pl.lot_id = "Lot"."id")::int`), "packageCount"],
  [sequelize.literal(`(SELECT count(*) FROM attachment a WHERE a.lot_id = "Lot"."id")::int`), "attachmentCount"]
];

async function list(query = {}) {
  const { page, pageSize, offset } = pagination(query, { defaultSize: 50, maxSize: 500 });
  const { rows, count } = await Lot.findAndCountAll({
    where: listWhere(query),
    attributes: { include: LIST_EXTRA },
    order: lotOrder(query),
    limit: pageSize,
    offset
  });
  return {
    items: rows.map((l) => lotDto(l, { seller: true, extra: { packageCount: l.get("packageCount"), attachmentCount: l.get("attachmentCount") } })),
    total: count,
    page,
    pageSize
  };
}

// Ids de todos os lotes do filtro (para "adicionar os N filtrados" a um pacote).
async function listIds(query = {}) {
  const rows = await Lot.findAll({ where: listWhere(query), attributes: ["id"], order: [["lotNumber", "ASC"]], limit: 5000 });
  return rows.map((r) => r.id);
}

// Valores distintos para os filtros (só lotes ativos na planilha), com contagem.
async function facets() {
  const group = async (column) =>
    sequelize.query(
      `SELECT ${column} AS value, count(*)::int AS count FROM lot WHERE withdrawn_at IS NULL GROUP BY ${column} ORDER BY ${column} NULLS LAST`,
      { type: "SELECT" }
    );
  const [linkedSystem, family, subfamily, site, status] = await Promise.all([
    group("linked_system"),
    group("commercial_family"),
    group("subfamily"),
    group("site_name"),
    group("status")
  ]);
  const withdrawn = await Lot.count({ where: { withdrawnAt: { [Op.ne]: null } } });
  return { linkedSystem, family, subfamily, site, status, withdrawn };
}

async function get(id) {
  const lot = await Lot.findByPk(uuid(id, "id"));
  if (!lot) throw new NotFoundError("Lot not found.");
  const packages = await Package.findAll({
    include: [{ model: PackageLot, as: "packageLots", where: { lotId: lot.id }, attributes: [] }],
    order: [["name", "ASC"]]
  });
  const sales = await LotSale.findAll({ where: { lotId: lot.id }, attributes: ["packageId"] });
  const soldBy = new Set(sales.map((s) => s.packageId));
  const attachments = await Attachment.findAll({ where: { lotId: lot.id }, order: [["sortOrder", "ASC"], ["createdAt", "ASC"]] });
  return {
    ...lotDto(lot, { seller: true }),
    packages: packages.map((p) => packageDto(p, { soldThisLot: soldBy.has(p.id) })),
    attachments: attachments.map((a) => attachmentDto(a, { full: true }))
  };
}

// O vendedor só altera a descrição do lote (o resto vem da planilha).
async function update(id, body, userId) {
  const lot = await Lot.findByPk(uuid(id, "id"));
  if (!lot) throw new NotFoundError("Lot not found.");
  if (body.description !== undefined) {
    await lot.update({ description: optionalString(body.description, "description", { max: 20000 }), updatedBy: userId });
  }
  return get(lot.id);
}

module.exports = { list, listIds, facets, get, update, lotOrder };
