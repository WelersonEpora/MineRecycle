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
    const pkg = await seller.post("/api/v1/seller/packages", { json: { name: "X", originId: created.data.id } });
    assert.equal(pkg.data.error.code, "ORIGIN_INACTIVE");
  });

  await t.test("origin is optional on a new package (since 2026-11-19)", async () => {
    const res = await seller.post("/api/v1/seller/packages", { json: { name: "No origin" } });
    assert.equal(res.status, 201);
    assert.equal(res.data.origin, null);
    await seller.del(`/api/v1/seller/packages/${res.data.id}`);
  });

  const { Package, PackageLot } = require("../../src/models");
  const [brick, pump, kilnA, kilnB, truck] = await h.createLots([
    { lotNumber: "1", title: "Alumina brick E4", siteName: "Site A" },
    { lotNumber: "2", title: "Slurry pump", siteName: "Site B" },
    { lotNumber: "3", title: "Kiln shell", siteName: "Site A" },
    { lotNumber: "4", title: "Kiln drive", siteName: "Site C" },
    { lotNumber: "5", title: "Haul truck", siteName: "Site C" }
  ]);
  await h.packageWithLots(seller, { name: "Fictitious Bricks", originId: anm, lots: [brick], status: "active" });
  await h.packageWithLots(seller, { name: "Fictitious Pumps", originId: vtm, lots: [pump], status: "active" });
  // Automático (família), como a importação cria.
  const kiln = await Package.create({ number: 90, name: "Fictitious Kiln", source: "family", sourceValue: "Kiln", originId: anm, status: "under_negotiation" });
  await PackageLot.bulkCreate([kilnA, kilnB].map((l, position) => ({ packageId: kiln.id, lotId: l.id, position })));
  await h.packageWithLots(seller, { name: "Fictitious Trucks", originId: anm, lots: [truck], status: "sold" });

  const get = async (qs = "") => (await anon.get(`/api/v1/catalog/packages${qs}`)).data;
  const names = (r) => r.items.map((p) => p.name).sort();
  const count = (facet, value) => facet.options.find((o) => o.value === value)?.count;

  await t.test("catalog: origin in the card, facets with counts", async () => {
    const r = await get();
    assert.deepEqual(names(r), ["Fictitious Bricks", "Fictitious Pumps"]);
    assert.deepEqual(r.items.find((p) => p.name === "Fictitious Pumps").origin, { id: vtm, name: "Niquelândia", code: "VTM" });
    assert.equal(count(r.facets.origin, "ANM"), 1);
    assert.equal(r.facets.origin.options.find((o) => o.value === "VTM").name, "Niquelândia");
    assert.deepEqual(r.facets.level.options, [{ value: "manual", count: 2 }]);
  });

  await t.test("catalog: negotiation box, level, origin and site filters, search in lots", async () => {
    const withNeg = await get("?negotiation=1");
    assert.deepEqual(names(withNeg), ["Fictitious Bricks", "Fictitious Kiln", "Fictitious Pumps"]);
    assert.equal(count(withNeg.facets.site, "Site A"), 2);
    assert.equal(count(withNeg.facets.site, "Site C"), 1);
    assert.deepEqual(withNeg.items.find((p) => p.name === "Fictitious Kiln").sites, ["Site A", "Site C"]);
    assert.deepEqual(names(await get("?negotiation=1&origin=anm&site=Site A")), ["Fictitious Bricks", "Fictitious Kiln"]);
    assert.deepEqual(names(await get("?negotiation=1&level=family")), ["Fictitious Kiln"]);
    const search = await get("?q=alumina");
    assert.deepEqual(names(search), ["Fictitious Bricks"]);
    // Contagens consideram a busca.
    assert.equal(search.facets.origin.options.length, 1);
    // Curinga do ILIKE não vaza.
    assert.deepEqual(names(await get("?q=%25")), []);
    // Vendido não aparece nem pela busca.
    assert.deepEqual(names(await get("?negotiation=1&q=truck")), []);
  });

  await t.test("seller list filters by origin", async () => {
    const list = (await seller.get(`/api/v1/seller/packages?originId=${vtm}`)).data;
    assert.deepEqual(list.map((p) => p.name), ["Fictitious Pumps"]);
    assert.equal(list[0].origin.code, "VTM");
  });
});
