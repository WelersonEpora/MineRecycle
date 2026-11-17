"use strict";

// Número em destaque no cartão da vitrine para pacote sem foto (decisão de 2026-11-17):
// - equipamento: unidades (soma das quantidades dos itens principais em PC, SET ou KIT);
// - a granel: peso total em toneladas, quando todos os itens estão em KG ou T;
// - senão: número de itens. Pacote sem itens: nada (o cartão mostra só a categoria).
// Regra pura: os totais vêm prontos do banco (package-card-stats.js).

function cardHighlight({ type, lineCount, weightLineCount, totalWeightT, unitCount }) {
  const lines = Number(lineCount) || 0;
  if (lines === 0) return null;
  const units = Number(unitCount) || 0;
  if (type === "equipment" && units > 0) return { kind: "units", value: Math.round(units) };
  const weight = Number(totalWeightT) || 0;
  if (type === "bulk" && Number(weightLineCount) === lines && weight > 0) {
    return { kind: "weight", value: Math.round(weight * 1000) / 1000 };
  }
  return { kind: "items", value: lines };
}

module.exports = { cardHighlight };
