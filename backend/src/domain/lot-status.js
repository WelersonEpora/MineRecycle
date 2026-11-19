"use strict";

// Situação do lote (decisão de 2026-11-19). Regras puras.
//
// - A coluna STATUS da planilha diz se o lote foi vendido ("Sold") ou saiu da venda ("Collected by court officer").
// - Quem vende no sistema é o pacote: pacote vendido marca como vendidos todos os seus lotes, em todos os pacotes.
// - "Vendido" pela planilha é de mão única: a importação marca, mas nunca desfaz (a planilha pode estar atrasada em
//   relação a uma venda registrada no sistema). Desfazer a venda de um pacote libera só os lotes vendidos por ele.

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

// Situação final do lote. soldBySheet: a planilha já disse "Sold" alguma vez; saleCount: pacotes vendidos que o contêm;
// sheetStatus: o que a planilha diz agora.
function lotStatus({ soldBySheet = false, saleCount = 0, sheetStatus = "available" }) {
  if (soldBySheet || saleCount > 0) return "sold";
  if (sheetStatus === "unavailable") return "unavailable";
  return "available";
}

// Lote que conta como oferta no lado público: nem retirado da planilha, nem fora da venda. O vendido continua visível
// (com o selo) nos pacotes em que aparece.
function isLotOffered(lot) {
  return !lot.withdrawnAt && lot.status !== "unavailable";
}

module.exports = { parseSheetStatus, lotStatus, isLotOffered, SHEET_STATUS_SYNONYMS };
