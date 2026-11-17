"use strict";

const { PACKAGE_TYPES, LOCATIONS } = require("./constants");

// Filtros da vitrine e do link do comprador (decisão de 2026-11-17). Regra pura: recebe os pacotes já limitados pelo
// que o visitante pode ver e pela busca, e aplica Tipo, Origem e Local, com a contagem de cada opção.
// A contagem de um grupo considera os outros filtros, mas não o próprio grupo. "A confirmar" nunca vira opção de
// Local (o pacote só "a confirmar" aparece em "Todos").
//
// pkg = { type, originCode, locations, status }

const HIDDEN_LOCATION = "to_be_confirmed";

function parseCatalogQuery(query = {}) {
  const origin = typeof query.origin === "string" && /^[A-Za-z0-9-]{1,10}$/.test(query.origin) ? query.origin.toUpperCase() : "";
  return {
    q: typeof query.q === "string" ? query.q.trim().slice(0, 100) : "",
    type: PACKAGE_TYPES.includes(query.type) ? query.type : "",
    origin,
    location: LOCATIONS.includes(query.location) && query.location !== HIDDEN_LOCATION ? query.location : "",
    negotiation: query.negotiation === "1" || query.negotiation === "true" || query.negotiation === true
  };
}

const matches = (p, f, skip) =>
  (skip === "type" || !f.type || p.type === f.type) &&
  (skip === "origin" || !f.origin || p.originCode === f.origin) &&
  (skip === "location" || !f.location || (p.locations || []).includes(f.location));

// options.negotiationToggle: na vitrine, "em negociação" só entra com a caixa marcada (f.negotiation).
function filterCatalog(packages, f, { negotiationToggle = false } = {}) {
  const base = negotiationToggle && !f.negotiation ? packages.filter((p) => p.status !== "under_negotiation") : packages;
  const count = (skip, key) => {
    const out = new Map();
    for (const p of base.filter((x) => matches(x, f, skip))) {
      for (const k of key(p)) out.set(k, (out.get(k) || 0) + 1);
    }
    return out;
  };
  const types = count("type", (p) => [p.type]);
  const origins = count("origin", (p) => [p.originCode]);
  const locations = count("location", (p) => (p.locations || []).filter((l) => l !== HIDDEN_LOCATION));
  const total = (skip) => base.filter((x) => matches(x, f, skip)).length;
  return {
    items: base.filter((p) => matches(p, f)),
    facets: {
      type: { all: total("type"), options: PACKAGE_TYPES.map((v) => ({ value: v, count: types.get(v) || 0 })) },
      origin: { all: total("origin"), options: [...origins].map(([value, n]) => ({ value, count: n })) },
      location: {
        all: total("location"),
        options: LOCATIONS.filter((l) => locations.has(l)).map((value) => ({ value, count: locations.get(value) }))
      }
    }
  };
}

module.exports = { parseCatalogQuery, filterCatalog, HIDDEN_LOCATION };
