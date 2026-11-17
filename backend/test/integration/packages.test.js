"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const h = require("./helpers");

const skip = !h.ENABLED && "needs a test database (npm run test:integration)";

test("package number and locations", { skip }, async (t) => {
  const server = await h.startServer();
  t.after(async () => {
    await server.close();
    await h.cleanup();
  });
  await h.resetDatabase();
  const seller = await h.loggedInSeller(server.base);
  const anon = h.client(server.base);
  const create = (json) => seller.post("/api/v1/seller/packages", { json });

  await t.test("number is generated when not given", async () => {
    const first = await create({ name: "1-6 Refractories", type: "bulk", locations: ["conceicao_do_araguaia", "uberaba"] });
    assert.equal(first.status, 201);
    assert.equal(first.data.number, 1);
    const explicit = await create({ number: 10, name: "Explicit", type: "bulk", locations: ["uberaba"] });
    assert.equal(explicit.data.number, 10);
    const next = await create({ name: "10-12-13 Kiln", type: "equipment", locations: ["at_supplier", "uberaba", "conceicao_do_araguaia"] });
    assert.equal(next.data.number, 11);
    // Ordem canônica, sem depender da ordem enviada.
    assert.deepEqual(next.data.locations, ["conceicao_do_araguaia", "uberaba", "at_supplier"]);
  });

  await t.test("locations are validated", async () => {
    assert.equal((await create({ name: "None", type: "bulk", locations: [] })).status, 400);
    assert.equal((await create({ name: "Bad", type: "bulk", locations: ["mars"] })).status, 400);
    assert.equal((await create({ name: "Old field", type: "bulk", location: "uberaba" })).status, 400);
    // "A confirmar" pode ficar junto de um local conhecido (há partes em lugar ainda não informado).
    const mixed = await create({ name: "Mixed", type: "bulk", locations: ["to_be_confirmed", "belo_horizonte"] });
    assert.deepEqual(mixed.data.locations, ["belo_horizonte", "to_be_confirmed"]);
  });

  await t.test("STOR document codes: validated, searchable by sellers, never public", async () => {
    const bad = await create({ name: "Bad code", type: "bulk", locations: ["uberaba"], storDocuments: ["123"] });
    assert.equal(bad.status, 400);
    const ok = await create({ name: "With codes", type: "bulk", locations: ["uberaba"], storDocuments: "1809438, 1809439 1809438" });
    assert.deepEqual(ok.data.storDocuments, ["1809438", "1809439"]);
    const found = (await seller.get("/api/v1/seller/packages?q=1809439")).data.map((p) => p.name);
    assert.deepEqual(found, ["With codes"]);

    await seller.put(`/api/v1/seller/packages/${ok.data.id}/status`, { json: { status: "active" } });
    const pub = (await anon.get(`/api/v1/catalog/packages/${ok.data.number}`)).data.package;
    assert.equal(pub.storDocuments, undefined);
    assert.equal((await anon.get("/api/v1/catalog/packages?q=1809439")).data.items.length, 0);
    await seller.put(`/api/v1/seller/packages/${ok.data.id}/status`, { json: { status: "draft" } });
  });

  await t.test("STOR folder, numbers and pending documents: seller only", async () => {
    const pkg = await create({
      name: "Sample Public",
      storFolder: "77-Sample Folder",
      storNumbers: "13, 10-12",
      type: "equipment",
      locations: ["uberaba"],
      storDocuments: ["1809001", "1809002"],
      storDocumentsPending: ["1809002"]
    });
    assert.equal(pkg.status, 201);
    assert.equal(pkg.data.storFolder, "77-Sample Folder");
    assert.deepEqual(pkg.data.storNumbers, [10, 12, 13]);
    assert.deepEqual(pkg.data.storDocumentsPending, ["1809002"]);

    assert.equal((await create({ name: "Dup", storFolder: "77-Sample Folder", type: "bulk", locations: ["uberaba"] })).data.error.code, "STOR_FOLDER_TAKEN");
    const notInList = await create({ name: "Bad pending", type: "bulk", locations: ["uberaba"], storDocuments: ["1809001"], storDocumentsPending: ["1809003"] });
    assert.equal(notInList.status, 400);
    assert.equal((await create({ name: "Bad nums", type: "bulk", locations: ["uberaba"], storNumbers: [0] })).status, 400);

    // Tirar o documento da lista tira também a pendência.
    const upd = await seller.patch(`/api/v1/seller/packages/${pkg.data.id}`, { json: { storDocuments: ["1809001"] } });
    assert.deepEqual(upd.data.storDocumentsPending, []);

    assert.deepEqual((await seller.get("/api/v1/seller/packages?q=Sample Folder")).data.map((p) => p.name), ["Sample Public"]);
    await seller.put(`/api/v1/seller/packages/${pkg.data.id}/status`, { json: { status: "active" } });
    const pub = (await anon.get(`/api/v1/catalog/packages/${pkg.data.number}`)).data.package;
    for (const field of ["storFolder", "storNumbers", "storDocuments", "storDocumentsPending"]) assert.equal(pub[field], undefined, field);
    assert.equal((await anon.get("/api/v1/catalog/packages?q=Sample Public")).data.items.length, 1);
    assert.equal((await anon.get("/api/v1/catalog/packages?q=Sample Folder")).data.items.length, 0);
    await seller.put(`/api/v1/seller/packages/${pkg.data.id}/status`, { json: { status: "draft" } });
  });

  await t.test("lists are ordered by smallest package number, then name; no number last", async () => {
    await create({ name: "B second", type: "bulk", locations: ["uberaba"], storNumbers: [27] });
    await create({ name: "A first", type: "bulk", locations: ["uberaba"], storNumbers: [6, 1] });
    await create({ name: "A same number", type: "bulk", locations: ["uberaba"], storNumbers: [1] });
    const names = (await seller.get("/api/v1/seller/packages")).data.map((p) => p.name);
    assert.deepEqual(names.slice(0, 4), ["A first", "A same number", "Sample Public", "B second"]);
    assert.equal(names.indexOf("B second") < names.indexOf("1-6 Refractories"), true);
  });

  await t.test("catalog filter matches any of the package locations", async () => {
    const kiln = (await seller.get("/api/v1/seller/packages?q=Kiln")).data[0];
    await seller.put(`/api/v1/seller/packages/${kiln.id}/status`, { json: { status: "active" } });
    const atUberaba = (await anon.get("/api/v1/catalog/packages?location=uberaba")).data.items.map((p) => p.name);
    assert.deepEqual(atUberaba, ["10-12-13 Kiln"]);
    const inNiquelandia = (await anon.get("/api/v1/catalog/packages?location=niquelandia")).data.items;
    assert.equal(inNiquelandia.length, 0);
  });
});
