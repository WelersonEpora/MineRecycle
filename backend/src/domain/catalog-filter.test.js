"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { parseCatalogQuery, filterCatalog } = require("./catalog-filter");

const P = [
  { id: 1, type: "bulk", originCode: "ANM", locations: ["conceicao_do_araguaia"], status: "active" },
  { id: 2, type: "bulk", originCode: "ANM", locations: ["uberaba"], status: "active" },
  { id: 3, type: "equipment", originCode: "ANM", locations: ["uberaba", "to_be_confirmed"], status: "under_negotiation" },
  { id: 4, type: "equipment", originCode: "VTM", locations: ["niquelandia"], status: "active" },
  { id: 5, type: "equipment", originCode: "ANM", locations: ["to_be_confirmed"], status: "active" }
];
const ids = (r) => r.items.map((p) => p.id);
const opt = (facet, value) => facet.options.find((o) => o.value === value)?.count;

test("query parsing keeps only known values", () => {
  assert.deepEqual(parseCatalogQuery({ type: "x", origin: "anm", location: "to_be_confirmed", negotiation: "1", q: "  cabo " }), {
    q: "cabo",
    type: "",
    origin: "ANM",
    location: "",
    negotiation: true
  });
  assert.equal(parseCatalogQuery({ origin: "<script>" }).origin, "");
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
  const r = filterCatalog(P, parseCatalogQuery({ type: "equipment", negotiation: "1" }), { negotiationToggle: true });
  assert.deepEqual(ids(r), [3, 4, 5]);
  assert.equal(r.facets.type.all, 5);
  assert.equal(opt(r.facets.type, "bulk"), 2);
  assert.equal(opt(r.facets.type, "equipment"), 3);
  assert.equal(opt(r.facets.origin, "ANM"), 2);
  assert.equal(opt(r.facets.origin, "VTM"), 1);
  assert.equal(opt(r.facets.location, "uberaba"), 1);
  assert.equal(opt(r.facets.location, "niquelandia"), 1);
});

test("'to be confirmed' is never a location option; such packages stay under All", () => {
  const r = filterCatalog(P, parseCatalogQuery({ negotiation: "1" }), { negotiationToggle: true });
  assert.equal(r.facets.location.options.some((o) => o.value === "to_be_confirmed"), false);
  assert.equal(r.facets.location.all, 5);
  assert.equal(opt(r.facets.location, "uberaba"), 2); // pacote em dois locais conta nos dois
});

test("origin and location filters combine", () => {
  const r = filterCatalog(P, parseCatalogQuery({ origin: "ANM", location: "uberaba", negotiation: "1" }), { negotiationToggle: true });
  assert.deepEqual(ids(r), [2, 3]);
  assert.equal(opt(r.facets.origin, "VTM"), undefined);
});
