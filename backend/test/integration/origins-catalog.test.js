"use strict";

// Origem do pacote e filtros do catálogo (decisão de 2026-11-17). Dados fictícios.
const test = require("node:test");
const assert = require("node:assert/strict");
const h = require("./helpers");

const skip = !h.ENABLED && "needs a test database (npm run test:integration)";

test("origins and catalog filters", { skip }, async (t) => {
  const server = await h.startServer();
  t.after(async () => {
    await server.close();
    await h.cleanup();
  });
  await h.resetDatabase();
  const admin = await h.loggedInSeller(server.base, { email: "admin@example.test", role: "admin" });
  const seller = await h.loggedInSeller(server.base);
  const anon = h.client(server.base);
  const anm = await h.originId("ANM");
  const vtm = await h.originId("VTM");

  await t.test("origin registry: sellers read, only admins write; code is unique", async () => {
    assert.equal((await seller.get("/api/v1/seller/origins")).data.length, 2);
    assert.equal((await seller.post("/api/v1/seller/origins", { json: { name: "Fictícia", code: "FIC" } })).status, 403);
    const created = await admin.post("/api/v1/seller/origins", { json: { name: "Fictícia", code: "fic" } });
    assert.equal(created.status, 201);
    assert.equal(created.data.code, "FIC");
    const dup = await admin.post("/api/v1/seller/origins", { json: { name: "Outra", code: "FIC" } });
    assert.equal(dup.data.error.code, "ORIGIN_CODE_TAKEN");
    const off = await admin.patch(`/api/v1/seller/origins/${created.data.id}`, { json: { active: false } });
    assert.equal(off.data.active, false);
    // Origem inativa não vale para pacote novo.
    const pkg = await seller.post("/api/v1/seller/packages", { json: { name: "X", type: "bulk", locations: ["uberaba"], originId: created.data.id } });
    assert.equal(pkg.data.error.code, "ORIGIN_INACTIVE");
  });

  await t.test("origin is required on a new package", async () => {
    const res = await seller.post("/api/v1/seller/packages", { json: { name: "No origin", type: "bulk", locations: ["uberaba"] } });
    assert.equal(res.status, 400);
    assert.equal(res.data.error.code, "ORIGIN_INVALID");
  });

  const mk = async (json, status = "active") => {
    const p = (await seller.post("/api/v1/seller/packages", { json })).data;
    await seller.put(`/api/v1/seller/packages/${p.id}/status`, { json: { status } });
    return p;
  };
  const bricks = await mk({ name: "Fictitious Bricks", type: "bulk", locations: ["uberaba"], originId: anm });
  await seller.post(`/api/v1/seller/packages/${bricks.id}/lines`, { json: { itemNo: "1", description: "Alumina brick E4", quantity: "10", unit: "KG" } });
  await mk({ name: "Fictitious Pumps", type: "equipment", locations: ["niquelandia"], originId: vtm });
  await mk({ name: "Fictitious Kiln", type: "equipment", locations: ["uberaba", "to_be_confirmed"], originId: anm }, "under_negotiation");
  await mk({ name: "Fictitious Trucks", type: "equipment", locations: ["to_be_confirmed"], originId: anm }, "sold");

  const get = async (qs = "") => (await anon.get(`/api/v1/catalog/packages${qs}`)).data;
  const names = (r) => r.items.map((p) => p.name).sort();
  const count = (facet, value) => facet.options.find((o) => o.value === value)?.count;

  await t.test("catalog: origin in the card, facets with counts, no 'to be confirmed' option", async () => {
    const r = await get();
    assert.deepEqual(names(r), ["Fictitious Bricks", "Fictitious Pumps"]);
    assert.deepEqual(r.items.find((p) => p.name === "Fictitious Pumps").origin, { id: vtm, name: "Niquelândia", code: "VTM" });
    assert.equal(count(r.facets.origin, "ANM"), 1);
    assert.equal(r.facets.origin.options.find((o) => o.value === "VTM").name, "Niquelândia");
    assert.equal(r.facets.location.options.some((o) => o.value === "to_be_confirmed"), false);
  });

  await t.test("catalog: negotiation box, origin and location filters, search in items", async () => {
    const withNeg = await get("?negotiation=1");
    assert.deepEqual(names(withNeg), ["Fictitious Bricks", "Fictitious Kiln", "Fictitious Pumps"]);
    assert.equal(count(withNeg.facets.location, "uberaba"), 2);
    assert.deepEqual(names(await get("?negotiation=1&origin=anm&location=uberaba")), ["Fictitious Bricks", "Fictitious Kiln"]);
    const search = await get("?q=alumina");
    assert.deepEqual(names(search), ["Fictitious Bricks"]);
    // Contagens consideram a busca.
    assert.equal(search.facets.origin.options.length, 1);
    // Curinga do ILIKE não vaza.
    assert.deepEqual(names(await get("?q=%25")), []);
  });

  await t.test("seller list filters by origin", async () => {
    const list = (await seller.get(`/api/v1/seller/packages?originId=${vtm}`)).data;
    assert.deepEqual(list.map((p) => p.name), ["Fictitious Pumps"]);
    assert.equal(list[0].origin.code, "VTM");
  });
});
