"use strict";

// Pacotes sobre lotes (decisão de 2026-11-19): ID, pacote manual, pacote automático, pacote de um lote, venda e
// catálogo. Dados fictícios.
const test = require("node:test");
const assert = require("node:assert/strict");
const h = require("./helpers");

const skip = !h.ENABLED && "needs a test database (npm run test:integration)";

test("packages and lot sales", { skip }, async (t) => {
  const server = await h.startServer();
  t.after(async () => {
    await server.close();
    await h.cleanup();
  });
  await h.resetDatabase();
  const seller = await h.loggedInSeller(server.base);
  const anon = h.client(server.base);
  const { Lot, Package, PackageLot } = require("../../src/models");
  const api = "/api/v1/seller/packages";
  const create = (json) => seller.post(api, { json });
  const setStatus = (id, status, confirm) => seller.put(`${api}/${id}/status`, { json: { status, confirm } });
  const statusOf = async (lot) => (await Lot.findByPk(lot.id)).status;

  const [a, b, c, d, e] = await h.createLots([
    { lotNumber: "100", title: "Fictitious pump", masterSupplier: "Acme", siteName: "Site A" },
    { lotNumber: "101", title: "Fictitious motor", siteName: "Site A" },
    { lotNumber: "102", title: "Fictitious crane", siteName: "Site B" },
    { lotNumber: "103", title: "Fictitious truck", siteName: "Site B", status: "unavailable", sheetStatus: "unavailable" },
    { lotNumber: "104", title: "Fictitious hoist", siteName: "Site C" }
  ]);

  await t.test("ID is generated when not given and fixed after creation", async () => {
    const first = await create({ name: "First" });
    assert.equal(first.status, 201);
    assert.equal(first.data.number, 1);
    assert.equal(first.data.source, "manual");
    assert.equal(first.data.status, "draft");
    assert.equal((await create({ number: 10, name: "Explicit" })).data.number, 10);
    assert.equal((await create({ name: "Next" })).data.number, 11);
    assert.equal((await create({ number: 10, name: "Clash" })).data.error.code, "NUMBER_TAKEN");

    const id = first.data.id;
    const same = await seller.patch(`${api}/${id}`, { json: { number: 1, name: "First renamed" } });
    assert.equal(same.data.name, "First renamed");
    assert.equal((await seller.patch(`${api}/${id}`, { json: { number: 500 } })).data.error.code, "NUMBER_LOCKED");
  });

  await t.test("manual package: the seller chooses, removes and orders the lots", async () => {
    const pkg = (await create({ name: "Pumps and motors", lotIds: [a.id, b.id] })).data;
    assert.equal(pkg.allLotCount, 2);
    assert.equal((await create({ name: "Bad", lotIds: ["00000000-0000-4000-8000-000000000000"] })).status, 400);

    await seller.post(`${api}/${pkg.id}/lots`, { json: { lotIds: [c.id, a.id] } });
    const order = async () => (await seller.get(`${api}/${pkg.id}/lots`)).data.items.map((l) => l.lotNumber);
    assert.deepEqual(await order(), ["100", "101", "102"]);
    await seller.put(`${api}/${pkg.id}/lots/order`, { json: { lotIds: [c.id, b.id, a.id] } });
    assert.deepEqual(await order(), ["102", "101", "100"]);
    assert.equal((await seller.put(`${api}/${pkg.id}/lots/order`, { json: { lotIds: [c.id] } })).status, 400);
    await seller.post(`${api}/${pkg.id}/lots/remove`, { json: { lotIds: [c.id] } });
    assert.deepEqual(await order(), ["101", "100"]);
    // Tirar do pacote não apaga o lote.
    assert.ok(await Lot.findByPk(c.id));
  });

  await t.test("automatic package: lots come only from the spreadsheet; deleted only when empty", async () => {
    const auto = await Package.create({ number: 50, name: "Water System", source: "linked_system", sourceValue: "Water System" });
    await PackageLot.create({ packageId: auto.id, lotId: e.id, position: 0 });
    assert.equal((await seller.post(`${api}/${auto.id}/lots`, { json: { lotIds: [a.id] } })).data.error.code, "PACKAGE_LOTS_AUTOMATIC");
    assert.equal((await seller.post(`${api}/${auto.id}/lots/remove`, { json: { lotIds: [e.id] } })).data.error.code, "PACKAGE_LOTS_AUTOMATIC");
    assert.equal((await seller.del(`${api}/${auto.id}`)).data.error.code, "PACKAGE_AUTOMATIC_NOT_EMPTY");
    // Nome e descrição continuam editáveis.
    assert.equal((await seller.patch(`${api}/${auto.id}`, { json: { name: "Water treatment" } })).data.name, "Water treatment");
    await PackageLot.destroy({ where: { packageId: auto.id } });
    assert.equal((await seller.del(`${api}/${auto.id}`)).status, 204);
  });

  await t.test("single-lot package is named after the lot", async () => {
    const res = await seller.post(`/api/v1/seller/lots/${e.id}/package`);
    assert.equal(res.status, 201);
    assert.equal(res.data.name, "Fictitious hoist");
    assert.equal(res.data.allLotCount, 1);
    assert.equal(res.data.source, "manual");
  });

  await t.test("catalog: only active packages with at least one lot on offer; unavailable lots hidden", async () => {
    const empty = (await create({ name: "Empty active" })).data;
    await setStatus(empty.id, "active");
    const onlyUnavailable = await h.packageWithLots(seller, { name: "Only unavailable", lots: [d], status: "active" });
    const mixed = await h.packageWithLots(seller, { name: "Mixed", lots: [c, d], status: "active" });

    const list = (await anon.get("/api/v1/catalog/packages")).data;
    assert.deepEqual(list.items.map((p) => p.name), ["Mixed"]);
    const card = list.items[0];
    assert.equal(card.lotCount, 1);
    assert.deepEqual(card.sites, ["Site B"]);
    assert.deepEqual(list.facets.site.options, [{ value: "Site B", count: 1 }]);

    const lots = (await anon.get(`/api/v1/catalog/packages/${mixed.number}/lots`)).data;
    assert.deepEqual(lots.items.map((l) => l.lotNumber), ["102"]);
    // Campos internos do lote só para o vendedor.
    assert.equal(lots.items[0].sheetStatus, undefined);
    assert.equal((await anon.get(`/api/v1/catalog/packages/${mixed.number}/lots/${d.id}`)).status, 404);
    assert.equal((await anon.get(`/api/v1/catalog/packages/${mixed.number}/lots/${c.id}`)).data.lot.title, "Fictitious crane");
    // Lote de outro pacote não abre por este.
    assert.equal((await anon.get(`/api/v1/catalog/packages/${mixed.number}/lots/${a.id}`)).status, 404);
    // O vendedor vê todos os lotes, com os campos internos.
    const sellerLots = (await seller.get(`/api/v1/catalog/packages/${mixed.number}/lots`)).data.items;
    assert.equal(sellerLots.length, 2);
    assert.equal(sellerLots.find((l) => l.lotNumber === "103").sheetStatus, "unavailable");

    // A busca olha os lotes que o visitante pode ver.
    assert.deepEqual((await anon.get("/api/v1/catalog/packages?q=crane")).data.items.map((p) => p.name), ["Mixed"]);
    assert.deepEqual((await anon.get("/api/v1/catalog/packages?q=truck")).data.items, []);
    for (const p of [empty, onlyUnavailable, mixed]) await setStatus(p.id, "draft");
  });

  await t.test("selling a package sells its lots in every package; undoing releases only its own", async () => {
    const big = await h.packageWithLots(seller, { name: "Big", lots: [a, b, c], status: "active" });
    const small = await h.packageWithLots(seller, { name: "Small", lots: [a], status: "active" });

    const sold = await setStatus(small.id, "sold");
    assert.equal(sold.status, 200);
    assert.deepEqual(sold.data.sale, { sold: 1, alreadySold: 0, skipped: 0 });
    assert.equal(await statusOf(a), "sold");
    // Em outro pacote, o lote aparece vendido.
    const inBig = (await anon.get(`/api/v1/catalog/packages/${big.number}/lots`)).data.items;
    assert.equal(inBig.find((l) => l.lotNumber === "100").status, "sold");
    assert.equal((await anon.get(`/api/v1/catalog/packages/${big.number}`)).data.package.soldCount, 1);
    // Vendido sai do catálogo.
    assert.equal((await anon.get(`/api/v1/catalog/packages/${small.number}`)).status, 404);

    // Vender o grande: o 100 já foi vendido pelo pequeno, então pede confirmação.
    const ask = await setStatus(big.id, "sold");
    assert.equal(ask.status, 409);
    assert.equal(ask.data.error.code, "PACKAGE_SALE_CONFIRM");
    assert.equal(await statusOf(b), "available");
    const confirmed = await setStatus(big.id, "sold", true);
    assert.deepEqual(confirmed.data.sale, { sold: 2, alreadySold: 1, skipped: 0 });
    assert.equal(await statusOf(b), "sold");

    // Pacote vendido: lotes travados e sem exclusão.
    assert.equal((await seller.post(`${api}/${big.id}/lots`, { json: { lotIds: [e.id] } })).data.error.code, "PACKAGE_SOLD_LOCKED");
    assert.equal((await seller.del(`${api}/${big.id}`)).data.error.code, "PACKAGE_SOLD_LOCKED");

    // Desfazer a venda do grande: 101 e 102 voltam; o 100 continua vendido pelo pequeno.
    const undo = await setStatus(big.id, "active");
    assert.deepEqual(undo.data.sale, { released: 2, stillSold: 1 });
    assert.deepEqual([await statusOf(a), await statusOf(b), await statusOf(c)], ["sold", "available", "available"]);
    await setStatus(small.id, "active");
    assert.equal(await statusOf(a), "available");
  });

  await t.test("a package with no lots cannot be sold; unavailable lots are skipped", async () => {
    const empty = (await create({ name: "Nothing" })).data;
    assert.equal((await setStatus(empty.id, "sold")).data.error.code, "PACKAGE_EMPTY");
    const withTruck = await h.packageWithLots(seller, { name: "With truck", lots: [b, d] });
    const sold = await setStatus(withTruck.id, "sold");
    assert.equal(sold.status, 200, JSON.stringify(sold.data));
    assert.deepEqual(sold.data.sale, { sold: 1, alreadySold: 0, skipped: 1 });
    assert.equal(await statusOf(d), "unavailable");
  });

  await t.test("seller list: level, site and lot search filters", async () => {
    await Package.create({ number: 60, name: "Pumps family", source: "family", sourceValue: "Pumps" });
    const names = async (qs) => (await seller.get(`${api}${qs}`)).data.map((p) => p.name);
    assert.deepEqual(await names("?level=family"), ["Pumps family"]);
    // O vendedor acha também pelos lotes fora da venda.
    assert.deepEqual(await names("?q=fictitious truck"), ["Mixed", "Only unavailable", "With truck"]);
    assert.ok((await names("?site=Site B")).includes("With truck"));
    assert.ok(!(await names("?site=Site B")).includes("Pumps family"));
  });
});
