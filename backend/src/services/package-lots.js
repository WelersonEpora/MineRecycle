"use strict";

const { Op } = require("sequelize");
const { sequelize, Lot, PackageLot, LotSale } = require("../models");
const { ConflictError } = require("../shared/errors");
const { planPackageSale, planPackageUnsale, saleSummary } = require("../domain/package-sale");

// Lotes dentro dos pacotes: contagens do cartão, venda do pacote e resumo para o pedido de compra (2026-11-19).

// Lote em oferta (conta para o público): nem retirado da planilha, nem fora da venda. Mesma regra de isLotOffered.
const OFFERED = `FROM package_lot pl JOIN lot l ON l.id = pl.lot_id
  WHERE pl.package_id = "Package"."id" AND l.withdrawn_at IS NULL AND l.status <> 'unavailable'`;

// Subconsultas por pacote para listas (catálogo, link do comprador, lista do vendedor).
const CARD_STATS = [
  [sequelize.literal(`(SELECT count(*) ${OFFERED})::int`), "lotCount"],
  [sequelize.literal(`(SELECT count(*) ${OFFERED} AND l.status = 'sold')::int`), "soldCount"],
  [
    sequelize.literal(`(SELECT coalesce(array_agg(DISTINCT l.site_name) FILTER (WHERE l.site_name IS NOT NULL), '{}') ${OFFERED})`),
    "sites"
  ]
];

function cardExtra(p) {
  const lotCount = p.get("lotCount") ?? 0;
  const soldCount = p.get("soldCount") ?? 0;
  const sites = [...(p.get("sites") || [])].sort((a, b) => a.localeCompare(b));
  return { lotCount, soldCount, availableCount: lotCount - soldCount, sites };
}

// Lotes do pacote no formato das regras de venda (com os pacotes vendidos que já os contêm).
async function saleLots(packageId, { transaction } = {}) {
  const lots = await Lot.findAll({
    include: [
      { model: PackageLot, as: "packageLots", where: { packageId }, attributes: [] },
      { model: LotSale, as: "sales", attributes: ["packageId"], required: false }
    ],
    transaction
  });
  return lots.map((l) => ({
    id: l.id,
    lotNumber: l.lotNumber,
    status: l.status,
    soldBySheet: l.soldBySheet,
    sheetStatus: l.sheetStatus,
    manualStatus: l.manualStatus,
    withdrawnAt: l.withdrawnAt,
    salePackageIds: (l.sales || []).map((s) => s.packageId)
  }));
}

async function summaryOf(packageId) {
  return saleSummary(await saleLots(packageId));
}

// Grava a situação nova dos lotes (changes vem das regras puras).
async function applyStatusChanges(changes, { transaction }) {
  const byStatus = new Map();
  for (const c of changes) byStatus.set(c.to, [...(byStatus.get(c.to) || []), c.lotId]);
  for (const [status, ids] of byStatus) {
    await Lot.update({ status }, { where: { id: { [Op.in]: ids } }, transaction });
  }
}

// Pacote vendido: os lotes em oferta passam a vendidos por ele. Lote já vendido em outro lugar pede confirmação
// (409 PACKAGE_SALE_CONFIRM, com a lista), a não ser que `confirm` venha marcado.
async function sell(pkg, userId, { confirm = false, transaction }) {
  const plan = planPackageSale(pkg.id, await saleLots(pkg.id, { transaction }));
  if (plan.alreadySold.length && !confirm) {
    throw new ConflictError(
      "Some lots of this package were already sold.",
      { alreadySold: plan.alreadySold.map((s) => ({ lotNumber: s.lotNumber, bySheet: s.bySheet, packages: s.byPackageIds.length })) },
      "PACKAGE_SALE_CONFIRM"
    );
  }
  if (plan.sales.length) {
    await LotSale.bulkCreate(
      plan.sales.map((lotId) => ({ lotId, packageId: pkg.id, createdBy: userId })),
      { transaction, ignoreDuplicates: true }
    );
  }
  await applyStatusChanges(plan.changes, { transaction });
  return plan;
}

// Desfaz a venda: só os lotes vendidos por este pacote voltam (os vendidos também por outro motivo continuam).
async function unsell(pkg, { transaction }) {
  const plan = planPackageUnsale(pkg.id, await saleLots(pkg.id, { transaction }));
  if (plan.removeSales.length) await LotSale.destroy({ where: { packageId: pkg.id, lotId: plan.removeSales }, transaction });
  await applyStatusChanges(plan.changes, { transaction });
  return plan;
}

module.exports = { CARD_STATS, cardExtra, saleLots, summaryOf, sell, unsell, applyStatusChanges, OFFERED };
