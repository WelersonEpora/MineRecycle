"use strict";

// Situação do lote (decisão de 2026-11-19). Regras puras.
//
// - A coluna STATUS da planilha diz se o lote foi vendido ("Sold") ou saiu da venda ("Collected by court officer").
// - Quem vende no sistema é o pacote: pacote vendido marca como vendidos todos os seus lotes, em todos os pacotes.
// - "Vendido" pela planilha é de mão única: a importação marca, mas nunca desfaz (a planilha pode estar atrasada em
//   relação a uma venda registrada no sistema). Desfazer a venda de um pacote libera só os lotes vendidos por ele.
// - Ajuste manual (2026-11-24): o vendedor fixa a situação do lote na tela. Vale sobre a planilha (inclusive sobre
//   "vendido pela planilha") até uma reimportação trazer outro STATUS para o lote. A venda por pacote continua acima
//   de tudo: lote vendido por pacote não aceita ajuste (desfaça a venda do pacote).

// Valores aceitos na coluna STATUS, comparados sem acento, caixa ou pontuação. Valor fora desta lista impede a
// importação: um erro de digitação não pode deixar um lote vendido à venda.
const SHEET_STATUS_SYNONYMS = {
  available: ["", "available", "disponivel", "forsale", "avenda"],
  sold: ["sold", "vendido"],
  unavailable: ["collectedbycourtofficer", "recolhidopelooficialdejustica", "unavailable", "indisponivel"]
};

function normalizeStatusText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

// Texto da planilha -> "available" | "sold" | "unavailable", ou null se o valor não for conhecido.
function parseSheetStatus(value) {
  const text = normalizeStatusText(value);
  for (const [status, synonyms] of Object.entries(SHEET_STATUS_SYNONYMS)) {
    if (synonyms.includes(text)) return status;
  }
  return null;
}

const LOT_STATUS_VALUES = ["available", "sold", "unavailable"];

// Situação final do lote. saleCount: pacotes vendidos que o contêm; manualStatus: ajuste manual (ou null);
// soldBySheet: a planilha já disse "Sold" alguma vez; sheetStatus: o que a planilha diz agora.
function lotStatus({ soldBySheet = false, saleCount = 0, sheetStatus = "available", manualStatus = null }) {
  if (saleCount > 0) return "sold";
  if (manualStatus) return manualStatus;
  if (soldBySheet) return "sold";
  if (sheetStatus === "unavailable") return "unavailable";
  return "available";
}

// Lote que conta como oferta no lado público: nem retirado da planilha, nem fora da venda. O vendido continua visível
// (com o selo) nos pacotes em que aparece.
function isLotOffered(lot) {
  return !lot.withdrawnAt && lot.status !== "unavailable";
}

// Ajuste manual pedido na tela. lot = { status, soldBySheet, sheetStatus, withdrawnAt, saleCount }; to = situação
// escolhida, ou null para voltar a seguir a planilha. -> { error } ou { manualStatus, status }.
function planManualStatus(lot, to) {
  if (to !== null && !LOT_STATUS_VALUES.includes(to)) return { error: "LOT_STATUS_INVALID" };
  if (lot.withdrawnAt) return { error: "LOT_WITHDRAWN" };
  if ((lot.saleCount ?? 0) > 0) return { error: "LOT_SOLD_BY_PACKAGE" };
  const status = lotStatus({ soldBySheet: lot.soldBySheet, saleCount: 0, sheetStatus: lot.sheetStatus, manualStatus: to });
  return { manualStatus: to, status };
}

// Reimportação de um lote que já existe. O ajuste manual fica enquanto o STATUS da planilha for o mesmo da última
// importação; se mudou, a planilha volta a mandar e "vendido pela planilha" é recalculado só pelo STATUS novo (senão
// um lote vendido pela planilha, ajustado para disponível e depois corrigido na planilha, voltaria a vendido).
// Sem ajuste, vale a regra de mão única do "Sold".
// current = { sheetStatus, soldBySheet, manualStatus } (ou undefined, lote novo); sheetStatus = o que a planilha diz.
function reimportStatus(current, sheetStatus) {
  const sheetSold = sheetStatus === "sold";
  if (!current) return { manualStatus: null, manualCleared: false, soldBySheet: sheetSold };
  if (current.manualStatus) {
    if (current.sheetStatus === sheetStatus) return { manualStatus: current.manualStatus, manualCleared: false, soldBySheet: Boolean(current.soldBySheet) || sheetSold };
    return { manualStatus: null, manualCleared: true, soldBySheet: sheetSold };
  }
  return { manualStatus: null, manualCleared: false, soldBySheet: Boolean(current.soldBySheet) || sheetSold };
}

module.exports = { parseSheetStatus, lotStatus, isLotOffered, planManualStatus, reimportStatus, SHEET_STATUS_SYNONYMS, LOT_STATUS_VALUES };
