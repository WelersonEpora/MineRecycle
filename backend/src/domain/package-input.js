"use strict";

// Leitura e validação dos dados do pacote vindos da tela (Novo pacote, Editar). Regras puras.
// Desde 2026-11-19 o pacote é um agrupamento de lotes: tipo, locais e campos do STOR saíram (os locais vêm dos lotes).
const { requiredString, optionalString, oneOf, positiveInt } = require("../shared/validate");
const { PACKAGE_CATEGORIES } = require("./constants");

// partial: só os campos enviados (edição); senão, todos (cadastro, com os obrigatórios).
function parsePackageInput(body, { partial }) {
  const out = {};
  // Número do catálogo: no cadastro, vazio = o próximo livre (gerado em create).
  const numberGiven = body.number !== undefined && body.number !== null && body.number !== "";
  if (numberGiven || (partial && body.number !== undefined)) out.number = positiveInt(body.number, "number", { max: 999999 });
  if (!partial || body.name !== undefined) out.name = requiredString(body.name, "name", { max: 200 });
  // Categoria: opcional no cadastro (padrão "other").
  if (body.category !== undefined || !partial) out.category = oneOf(body.category ?? "other", "category", PACKAGE_CATEGORIES);
  if (!partial || body.description !== undefined) out.description = optionalString(body.description, "description", { max: 20000 });
  return out;
}

module.exports = { parsePackageInput };
