"use strict";

const { lotStatus, isLotOffered } = require("./lot-status");

// Venda de pacote (decisão de 2026-11-19). Regras puras: o serviço carrega os lotes do pacote e grava o plano.
//
// lot = { id, lotNumber, status, soldBySheet, sheetStatus, withdrawnAt, salePackageIds: [ids dos pacotes vendidos
//         que já o contêm] }

function statusWith(lot, salePackageIds) {
  return lotStatus({ soldBySheet: lot.soldBySheet, saleCount: salePackageIds.length, sheetStatus: lot.sheetStatus });
}

// Marcar o pacote como vendido: todos os lotes em oferta passam a vendidos por este pacote. Lote retirado da planilha
// ou fora da venda (indisponível) não é vendido junto. Avisa os lotes que já estavam vendidos (pela planilha ou em
// outro pacote): o vendedor confirma sabendo disso.
function planPackageSale(packageId, lots) {
  const sales = [];
  const changes = [];
  const alreadySold = [];
  const skipped = [];
  for (const lot of lots) {
    const current = lot.salePackageIds || [];
    if (!isLotOffered(lot)) {
      skipped.push({ lotId: lot.id, lotNumber: lot.lotNumber, reason: lot.withdrawnAt ? "withdrawn" : "unavailable" });
      continue;
    }
    if (current.includes(packageId)) continue;
    if (lot.status === "sold") {
      alreadySold.push({ lotId: lot.id, lotNumber: lot.lotNumber, bySheet: Boolean(lot.soldBySheet), byPackageIds: current });
    }
    sales.push(lot.id);
    const to = statusWith(lot, [...current, packageId]);
    if (to !== lot.status) changes.push({ lotId: lot.id, lotNumber: lot.lotNumber, from: lot.status, to });
  }
  return { sales, changes, alreadySold, skipped };
}

// Desfazer a venda do pacote: tira só as vendas deste pacote. O lote vendido também pela planilha ou por outro pacote
// continua vendido (listado em stillSold).
function planPackageUnsale(packageId, lots) {
  const removeSales = [];
  const changes = [];
  const stillSold = [];
  for (const lot of lots) {
    const current = lot.salePackageIds || [];
    if (!current.includes(packageId)) continue;
    removeSales.push(lot.id);
    const rest = current.filter((id) => id !== packageId);
    const to = statusWith(lot, rest);
    if (to === "sold") stillSold.push({ lotId: lot.id, lotNumber: lot.lotNumber, bySheet: Boolean(lot.soldBySheet), byPackageIds: rest });
    if (to !== lot.status) changes.push({ lotId: lot.id, lotNumber: lot.lotNumber, from: lot.status, to });
  }
  return { removeSales, changes, stillSold };
}

// Resumo dos lotes do pacote para o cartão, a página e o pedido de compra. Só contam os lotes em oferta (retirados e
// indisponíveis ficam de fora). nothingAvailable: pacote sem lote disponível (todos vendidos, ou nenhum em oferta).
function saleSummary(lots) {
  const offered = lots.filter(isLotOffered);
  const sold = offered.filter((l) => l.status === "sold").length;
  const available = offered.length - sold;
  return { total: offered.length, sold, available, nothingAvailable: available === 0 };
}

module.exports = { planPackageSale, planPackageUnsale, saleSummary };
