"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { parseCatalogQuery, filterCatalog } = require("./catalog-filter");

const P = [
  { id: 1, source: "linked_system", originCode: "ANM", sites: ["Site A"], status: "active" },
  { id: 2, source: "family", originCode: "ANM", sites: ["Site B"], status: "active" },
  { id: 3, source: "family", originCode: "ANM", sites: ["Site A", "Site B"], status: "under_negotiation" },
  { id: 4, source: "manual", originCode: "VTM", sites: ["Site C"], status: "active" },
  { id: 5, source: "manual", originCode: null, sites: [], status: "active" }
];
const ids = (r) => r.items.map((p) => p.id);
const opt = (facet, value) => facet.options.find((o) => o.value === value)?.count;

test("query parsing keeps only known values", () => {
  assert.deepEqual(parseCatalogQuery({ level: "x", origin: "anm", site: " Site A ", negotiation: "1", q: "  cabo " }), {
    q: "cabo",
    level: "",
    origin: "ANM",
    site: "Site A",
    negotiation: true
  });
  assert.equal(parseCatalogQuery({ origin: "<script>" }).origin, "");
  assert.equal(parseCatalogQuery({ level: "family" }).level, "family");
  assert.equal(parseCatalogQuery({ site: "x".repeat(121) }).site, "");
});

test("negotiation packages only with the box ticked (catalog)", () => {
  const off = filterCatalog(P, parseCatalogQuery({}), { negotiationToggle: true });
  assert.deepEqual(ids(off), [1, 2, 4, 5]);
  const on = filterCatalog(P, parseCatalogQuery({ negotiation: "1" }), { negotiationToggle: true });
  assert.deepEqual(ids(on), [1, 2, 3, 4, 5]);
  // Link do comprador: sem a caixa, tudo o que ele pode ver entra.
  assert.deepEqual(ids(filterCatalog(P, parseCatalogQuery({}))), [1, 2, 3, 4, 5]);
});

test("counts consider the other filters but not their own group", () => {
  const r = filterCatalog(P, parseCatalogQuery({ level: "family", negotiation: "1" }), { negotiationToggle: true });
  assert.deepEqual(ids(r), [2, 3]);
  assert.equal(r.facets.level.all, 5);
  assert.equal(opt(r.facets.level, "linked_system"), 1);
  assert.equal(opt(r.facets.level, "family"), 2);
  assert.equal(opt(r.facets.level, "manual"), 2);
  assert.equal(opt(r.facets.level, "subfamily"), undefined);
  assert.equal(opt(r.facets.origin, "ANM"), 2);
  assert.equal(opt(r.facets.origin, "VTM"), undefined);
  assert.equal(opt(r.facets.site, "Site B"), 2);
  assert.equal(opt(r.facets.site, "Site A"), 1);
});

test("a package in two sites counts in both; packages without origin are not an option", () => {
  const r = filterCatalog(P, parseCatalogQuery({ negotiation: "1" }), { negotiationToggle: true });
  assert.equal(opt(r.facets.site, "Site A"), 2);
  assert.deepEqual(r.facets.site.options.map((o) => o.value), ["Site A", "Site B", "Site C"]);
  assert.deepEqual(r.facets.origin.options.map((o) => o.value).sort(), ["ANM", "VTM"]);
});

test("origin and site filters combine", () => {
  const r = filterCatalog(P, parseCatalogQuery({ origin: "ANM", site: "Site B", negotiation: "1" }), { negotiationToggle: true });
  assert.deepEqual(ids(r), [2, 3]);
});
