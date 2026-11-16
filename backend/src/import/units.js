"use strict";

// Normalização de unidades das planilhas do cliente (português, abreviações livres) para um código canônico.
// A comparação ignora caixa, acento, ponto e espaço: "pç", "PÇ.", "Peça" e "UN" viram todos "PC".
const UNIT_ALIASES = {
  PC: ["PC", "PCS", "PCA", "PECA", "PECAS", "PEC", "UN", "UND", "UNID", "UNIDADE", "UNIDADES", "U", "EA", "EACH", "PIECE", "PIECES"],
  M: ["M", "MT", "MTS", "METRO", "METROS", "MTR"],
  M2: ["M2", "METROQUADRADO", "METROSQUADRADOS"],
  M3: ["M3", "METROCUBICO", "METROSCUBICOS"],
  KG: ["KG", "KGS", "QUILO", "QUILOS", "QUILOGRAMA", "QUILOGRAMAS", "KILO", "KILOS"],
  T: ["T", "TON", "TONS", "TO", "TONELADA", "TONELADAS"],
  L: ["L", "LT", "LTS", "LITRO", "LITROS"],
  SET: ["SET", "SETS", "CJ", "CJT", "CJTO", "CONJ", "CONJUNTO", "CONJUNTOS", "JG", "JOGO", "JOGOS"],
  KIT: ["KIT", "KITS"],
  ROLL: ["ROLL", "ROLLS", "RL", "ROLO", "ROLOS"],
  BOX: ["BOX", "CX", "CXS", "CAIXA", "CAIXAS"],
  PAIR: ["PAIR", "PR", "PAR", "PARES"],
  LOT: ["LOT", "LOTE", "LOTES", "VB", "VERBA"],
  GAL: ["GAL", "GL", "GALAO", "GALOES"],
  BAG: ["BAG", "SC", "SACO", "SACOS"],
  CAN: ["CAN", "LATA", "LATAS"],
  SHEET: ["SHEET", "FL", "FOLHA", "FOLHAS", "CHAPA", "CHAPAS"],
  BAR: ["BAR", "BR", "BARRA", "BARRAS"],
  TUBE: ["TUBE", "TB", "TUBO", "TUBOS"]
};

function unitKey(raw) {
  return String(raw)
    .replace(/²/g, "2")
    .replace(/³/g, "3")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[.\s]/g, "");
}

const LOOKUP = new Map();
for (const [canonical, aliases] of Object.entries(UNIT_ALIASES)) {
  for (const alias of aliases) LOOKUP.set(unitKey(alias), canonical);
}

const CANONICAL_UNITS = Object.keys(UNIT_ALIASES);

// -> { unit, raw, known }. Unidade vazia: unit null, known false. Desconhecida: fica em maiúsculas (até 16
// caracteres) e known false, para a tela de importação sinalizar.
function normalizeUnit(value) {
  if (value === null || value === undefined || String(value).trim() === "") {
    return { unit: null, raw: null, known: false };
  }
  const raw = String(value).trim().slice(0, 32);
  const canonical = LOOKUP.get(unitKey(raw));
  if (canonical) return { unit: canonical, raw, known: true };
  return { unit: unitKey(raw).slice(0, 16) || null, raw, known: false };
}

module.exports = { normalizeUnit, CANONICAL_UNITS, UNIT_ALIASES };
