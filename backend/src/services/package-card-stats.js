"use strict";

const { sequelize } = require("../models");
const { cardHighlight } = require("../domain/card-highlight");

// Totais dos itens de cada pacote para o cartão da vitrine (subconsultas por pacote; são ~25 pacotes).
const lines = `FROM package_line l WHERE l.package_id = "Package"."id"`;
const CARD_STATS = [
  [sequelize.literal(`(SELECT count(*) ${lines})::int`), "lineCount"],
  [sequelize.literal(`(SELECT count(*) ${lines} AND l.unit IN ('KG', 'T'))::int`), "weightLineCount"],
  [
    sequelize.literal(`(SELECT coalesce(sum(CASE l.unit WHEN 'KG' THEN l.quantity / 1000 WHEN 'T' THEN l.quantity END), 0) ${lines})::float8`),
    "totalWeightT"
  ],
  [sequelize.literal(`(SELECT coalesce(sum(l.quantity), 0) ${lines} AND l.parent_line_id IS NULL AND l.unit IN ('PC', 'SET', 'KIT'))::float8`), "unitCount"]
];

// Campos extras do cartão: contagem de itens e número em destaque.
function cardExtra(p) {
  return {
    lineCount: p.get("lineCount"),
    highlight: cardHighlight({
      type: p.type,
      lineCount: p.get("lineCount"),
      weightLineCount: p.get("weightLineCount"),
      totalWeightT: p.get("totalWeightT"),
      unitCount: p.get("unitCount")
    })
  };
}

module.exports = { CARD_STATS, cardExtra };
