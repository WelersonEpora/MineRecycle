"use strict";

const { PACKAGE_SOURCES } = require("./constants");

// Filtros do catálogo e do link do comprador. Regra pura: recebe os pacotes já limitados pelo que o visitante pode ver
// e pela busca, e aplica Nível, Origem e Site, com a contagem de cada opção. A contagem de um grupo considera os outros
// filtros, mas não o próprio grupo.
//
// Desde 2026-11-19: o Nível diz de onde o pacote veio (sistema vinculado, família comercial, subfamília ou montado pelo
// vendedor) e o Site vem dos lotes do pacote (como está na planilha). Tipo e locais fixos saíram.
//
// pkg = { source, originCode, sites: [], status }

const MAX_SITE_LENGTH = 120;

function parseCatalogQuery(query = {}) {
  const origin = typeof query.origin === "string" && /^[A-Za-z0-9-]{1,10}$/.test(query.origin) ? query.origin.toUpperCase() : "";
  const site = typeof query.site === "string" ? query.site.trim() : "";
  return {
    q: typeof query.q === "string" ? query.q.trim().slice(0, 100) : "",
    level: PACKAGE_SOURCES.includes(query.level) ? query.level : "",
    origin,
    site: site.length <= MAX_SITE_LENGTH ? site : "",
    negotiation: query.negotiation === "1" || query.negotiation === "true" || query.negotiation === true
  };
}

const matches = (p, f, skip) =>
  (skip === "level" || !f.level || p.source === f.level) &&
  (skip === "origin" || !f.origin || p.originCode === f.origin) &&
  (skip === "site" || !f.site || (p.sites || []).includes(f.site));

const collator = new Intl.Collator("en", { sensitivity: "base", numeric: true });

// options.negotiationToggle: no catálogo, "em negociação" só entra com a caixa marcada (f.negotiation).
function filterCatalog(packages, f, { negotiationToggle = false } = {}) {
  const base = negotiationToggle && !f.negotiation ? packages.filter((p) => p.status !== "under_negotiation") : packages;
  const count = (skip, key) => {
    const out = new Map();
    for (const p of base.filter((x) => matches(x, f, skip))) {
      for (const k of key(p)) if (k) out.set(k, (out.get(k) || 0) + 1);
    }
    return out;
  };
  const levels = count("level", (p) => [p.source]);
  const origins = count("origin", (p) => [p.originCode]);
  const sites = count("site", (p) => p.sites || []);
  const total = (skip) => base.filter((x) => matches(x, f, skip)).length;
  return {
    items: base.filter((p) => matches(p, f)),
    facets: {
      level: { all: total("level"), options: PACKAGE_SOURCES.filter((v) => levels.has(v)).map((value) => ({ value, count: levels.get(value) })) },
      origin: { all: total("origin"), options: [...origins].map(([value, n]) => ({ value, count: n })) },
      site: {
        all: total("site"),
        options: [...sites].sort((a, b) => collator.compare(a[0], b[0])).map(([value, n]) => ({ value, count: n }))
      }
    }
  };
}

module.exports = { parseCatalogQuery, filterCatalog };
