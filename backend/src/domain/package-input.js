"use strict";

// Leitura e validação dos dados do pacote vindos da tela (Novo pacote, Editar) e da importação de pacotes por
// planilha. Regras puras: o mesmo pacote passa pelas mesmas regras nos dois caminhos.
const { ValidationError } = require("../shared/errors");
const { requiredString, optionalString, oneOf, positiveInt } = require("../shared/validate");
const { PACKAGE_TYPES, PACKAGE_CATEGORIES, LOCATIONS } = require("./constants");
const { isStorDocumentCode } = require("../import/stor-code");

// Lista de locais: ao menos um, sem repetição, na ordem de LOCATIONS. "A confirmar" pode vir junto de locais conhecidos
// ("está aqui, e pode haver partes em outro lugar").
function parseLocations(value) {
  if (!Array.isArray(value) || value.length === 0) throw new ValidationError("Choose at least one location.", { field: "locations", code: "required" });
  if (value.some((v) => !LOCATIONS.includes(v))) throw new ValidationError("Invalid location.", { field: "locations", code: "invalid" });
  return LOCATIONS.filter((l) => value.includes(l));
}

// Números dos ativos na planilha de estratégia (1 a 999), sem repetição, em ordem. Lista ou texto ("1, 6" ou "7-8-11").
function parseStorNumbers(value) {
  if (value === null || value === undefined || value === "") return [];
  const list = Array.isArray(value) ? value : String(value).split(/[\s,;-]+/).filter(Boolean);
  const nums = list.map((v) => (typeof v === "string" && v.trim() !== "" ? Number(v) : v));
  if (nums.length > 30 || nums.some((n) => !Number.isInteger(n) || n < 1 || n > 999)) {
    throw new ValidationError("Package numbers are whole numbers from 1 to 999.", { field: "storNumbers", code: "invalid" });
  }
  return [...new Set(nums)].sort((a, b) => a - b);
}

// Códigos das planilhas do STOR: 7 dígitos cada, sem repetição. Aceita lista ou texto separado por vírgula/espaço.
function parseStorDocuments(value, field = "storDocuments") {
  if (value === null || value === undefined || value === "") return [];
  const list = Array.isArray(value) ? value : String(value).split(/[\s,;]+/);
  const codes = list.map((v) => String(v ?? "").trim()).filter(Boolean);
  if (codes.length > 50) throw new ValidationError("Too many STOR documents.", { field, code: "too_long" });
  const bad = codes.find((c) => !isStorDocumentCode(c));
  if (bad) throw new ValidationError("STOR document codes have 7 digits.", { field, code: "invalid", value: bad });
  return [...new Set(codes)];
}

// partial: só os campos enviados (edição); senão, todos (cadastro, com os obrigatórios).
function parsePackageInput(body, { partial }) {
  const out = {};
  // Número do catálogo: no cadastro, vazio = o próximo livre (gerado em create).
  const numberGiven = body.number !== undefined && body.number !== null && body.number !== "";
  if (numberGiven || (partial && body.number !== undefined)) out.number = positiveInt(body.number, "number", { max: 999999 });
  if (!partial || body.name !== undefined) out.name = requiredString(body.name, "name", { max: 200 });
  if (!partial || body.type !== undefined) out.type = oneOf(body.type, "type", PACKAGE_TYPES);
  // Categoria: opcional no cadastro (padrão "other").
  if (body.category !== undefined || !partial) out.category = oneOf(body.category ?? "other", "category", PACKAGE_CATEGORIES);
  if (!partial || body.locations !== undefined) out.locations = parseLocations(body.locations);
  if (!partial || body.description !== undefined) out.description = optionalString(body.description, "description", { max: 20000 });
  if (!partial || body.storDocuments !== undefined) out.storDocuments = parseStorDocuments(body.storDocuments);
  if (!partial || body.storDocumentsPending !== undefined) out.storDocumentsPending = parseStorDocuments(body.storDocumentsPending, "storDocumentsPending");
  if (!partial || body.storFolder !== undefined) out.storFolder = optionalString(body.storFolder, "storFolder", { max: 200 }) || null;
  if (!partial || body.storNumbers !== undefined) out.storNumbers = parseStorNumbers(body.storNumbers);
  return out;
}

// Pendentes precisam estar entre os documentos do pacote (os que saíram da lista deixam de ser pendentes).
function reconcilePending(data, current = {}) {
  const docs = data.storDocuments ?? current.storDocuments ?? [];
  const pending = data.storDocumentsPending ?? current.storDocumentsPending ?? [];
  const outside = pending.find((c) => !docs.includes(c));
  if (data.storDocumentsPending !== undefined && outside) {
    throw new ValidationError("A pending document must be one of the package STOR documents.", { field: "storDocumentsPending", code: "invalid", value: outside });
  }
  if (data.storDocuments !== undefined || data.storDocumentsPending !== undefined) data.storDocumentsPending = pending.filter((c) => docs.includes(c));
}

module.exports = { parsePackageInput, reconcilePending, parseLocations, parseStorNumbers, parseStorDocuments };
