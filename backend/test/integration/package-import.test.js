"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const XLSX = require("xlsx");
const h = require("./helpers");

const skip = !h.ENABLED && "needs a test database (npm run test:integration)";

// Dados fictícios.
function xlsxBuffer(aoa) {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), "Lista");
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
}

// Planilha exportada -> matrizes; matrizes -> arquivo de novo.
function sheetsOf(buffer) {
  const wb = XLSX.read(buffer, { type: "buffer", cellDates: true });
  return Object.fromEntries(wb.SheetNames.map((n) => [n, XLSX.utils.sheet_to_json(wb.Sheets[n], { header: 1, defval: null })]));
}
function fileOf(sheets) {
  const wb = XLSX.utils.book_new();
  for (const [name, aoa] of Object.entries(sheets)) XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa, { cellDates: true }), name);
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
}
const col = (aoa, label) => aoa[0].indexOf(label);

test("package import from the system spreadsheet", { skip }, async (t) => {
  const server = await h.startServer();
  t.after(async () => {
    await server.close();
    await h.cleanup();
  });
  await h.resetDatabase();
  const seller = await h.loggedInSeller(server.base);
  const anon = h.client(server.base);
  const originId = await h.originId();

  const createPkg = async (json) => (await seller.post("/api/v1/seller/packages", { json: { originId, type: "bulk", locations: ["uberaba"], ...json } })).data;
  const a = await createPkg({ name: "Sample A", storFolder: "1 Sample A" });
  const b = await createPkg({ name: "Sample B" });
  // Itens do pacote A pelo importador de itens.
  const started = (
    await seller.post(`/api/v1/seller/packages/${a.id}/imports`, {
      form: h.fileForm({}, [
        {
          field: "file",
          name: "a.xlsx",
          buffer: xlsxBuffer([
            ["Item", "Qtde", "Unidade", "Descrição"],
            [1, 2, "PC", "Sample pump"],
            ["1.1", 1, "PC", "Sample motor"],
            [2, 10, "M", "Sample hose"]
          ])
        }
      ])
    })
  ).data;
  await seller.post(`/api/v1/seller/packages/${a.id}/imports/${started.importId}/commit`, { json: { mapping: started.suggestedMapping, keepFile: false } });

  const exportAll = async () => sheetsOf((await seller.get("/api/v1/seller/packages/export?lang=pt")).data);
  const check = async (buffer, fields = {}) =>
    seller.post("/api/v1/seller/package-imports", { form: h.fileForm(fields, [{ field: "file", name: "pacotes.xlsx", buffer }]) });
  const commit = async (res, json = {}) =>
    seller.post(`/api/v1/seller/package-imports/${res.data.importId}/commit`, { json: { fingerprint: res.data.fingerprint, confirmed: res.data.confirmKeys, ...json } });
  const lines = async (id) => (await seller.get(`/api/v1/seller/packages/${id}/lines?pageSize=500`)).data.items;

  await t.test("only sellers", async () => {
    assert.equal((await anon.post("/api/v1/seller/package-imports", { form: h.fileForm({}, [{ field: "file", name: "x.xlsx", buffer: Buffer.from("x") }]) })).status, 401);
  });

  await t.test("untouched export: nothing changes", async () => {
    const res = await check(fileOf(await exportAll()));
    assert.equal(res.status, 201, JSON.stringify(res.data));
    assert.equal(res.data.canImport, true);
    assert.deepEqual(res.data.summary, { create: 0, update: 0, unchanged: 2, itemsSheet: true, errors: 0, confirmations: 0 });
    const done = await commit(res);
    assert.equal(done.status, 200);
    assert.equal(done.data.unchanged, 2);
  });

  await t.test("update fields and items, create a package with items", async () => {
    const s = await exportAll();
    const rowA = s.Pacotes.findIndex((r) => r[0] === a.number);
    s.Pacotes[rowA][col(s.Pacotes, "Nome público")] = "Sample A (revised)";
    s.Pacotes[rowA][col(s.Pacotes, "Categoria")] = "Elétrica";
    const hose = s.Itens.findIndex((r) => r[col(s.Itens, "Item")] === "2");
    s.Itens[hose][col(s.Itens, "Qtde")] = 12;
    const newRow = s.Pacotes[0].map(() => null);
    Object.assign(newRow, {
      [col(s.Pacotes, "Nome público")]: "Sample C",
      [col(s.Pacotes, "Tipo")]: "Equipamento",
      [col(s.Pacotes, "Origem")]: s.Pacotes[rowA][col(s.Pacotes, "Origem")],
      [col(s.Pacotes, "Locais")]: "Niquelândia"
    });
    s.Pacotes.push(newRow);
    const item = s.Itens[0].map(() => null);
    Object.assign(item, { [col(s.Itens, "Pacote")]: "Sample C", [col(s.Itens, "Item")]: "1", [col(s.Itens, "Descrição")]: "Sample valve", [col(s.Itens, "Qtde")]: 3, [col(s.Itens, "Unidade")]: "PC" });
    s.Itens.push(item);

    const res = await check(fileOf(s));
    assert.equal(res.data.canImport, true, JSON.stringify(res.data.issues));
    assert.deepEqual([res.data.summary.create, res.data.summary.update, res.data.summary.unchanged], [1, 1, 1]);
    const done = await commit(res);
    assert.equal(done.status, 200, JSON.stringify(done.data));
    assert.equal(done.data.created[0].number, b.number + 1);

    const fresh = (await seller.get(`/api/v1/seller/packages/${a.id}`)).data;
    assert.equal(fresh.name, "Sample A (revised)");
    assert.equal(fresh.category, "electrical");
    assert.equal(Number((await lines(a.id)).find((l) => l.itemNo === "2").quantity), 12);
    assert.ok((await lines(a.id)).find((l) => l.itemNo === "1.1").parentLineId, "kit kept");
    const c = (await seller.get(`/api/v1/seller/packages/${done.data.created[0].id}`)).data;
    assert.equal(c.status, "draft");
    assert.equal(c.type, "equipment");
    assert.deepEqual((await lines(c.id)).map((l) => l.description), ["Sample valve"]);
  });

  await t.test("warnings must be confirmed; problems block", async () => {
    const s = await exportAll();
    s.Itens = s.Itens.filter((r, i) => i === 0 || r[0] !== a.number);
    const res = await check(fileOf(s));
    assert.ok(res.data.confirmKeys.includes(`items_removed_all:n:${a.number}`));
    const refused = await commit(res, { confirmed: [] });
    assert.equal(refused.status, 400);
    assert.equal(refused.data.error.code, "PACKAGE_IMPORT_CONFIRM");
    assert.equal((await lines(a.id)).length, 3, "nothing written");

    const bad = await exportAll();
    bad.Pacotes[1][0] = 999;
    const blocked = await check(fileOf(bad));
    assert.equal(blocked.data.canImport, false);
    assert.equal(blocked.data.issues[0].level, "error");
    assert.equal((await commit(blocked)).data.error.code, "PACKAGE_IMPORT_HAS_ERRORS");
  });

  await t.test("a change after the check makes the commit stale", async () => {
    const s = await exportAll();
    s.Pacotes[1][col(s.Pacotes, "Descrição")] = "From the file";
    const res = await check(fileOf(s));
    await seller.patch(`/api/v1/seller/packages/${a.id}`, { json: { description: "Edited meanwhile" } });
    const stale = await commit(res);
    assert.equal(stale.status, 409);
    assert.equal(stale.data.error.code, "PACKAGE_IMPORT_STALE");
    assert.equal((await seller.get(`/api/v1/seller/packages/${a.id}`)).data.description, "Edited meanwhile");
  });

  await t.test("single package: only the open package is imported", async () => {
    const s = await exportAll();
    for (const r of s.Pacotes.slice(1)) r[col(s.Pacotes, "Descrição")] = "Bulk edit";
    const res = await check(fileOf(s), { packageId: b.id });
    assert.deepEqual(res.data.packages.map((p) => p.number), [b.number]);
    // O commit leva o mesmo packageId da verificação; sem ele, o plano é outro e a impressão digital não bate.
    assert.equal((await commit(res)).data.error.code, "PACKAGE_IMPORT_STALE");
    assert.equal((await commit(res, { packageId: b.id })).status, 200);
    assert.equal((await seller.get(`/api/v1/seller/packages/${b.id}`)).data.description, "Bulk edit");
    assert.notEqual((await seller.get(`/api/v1/seller/packages/${a.id}`)).data.description, "Bulk edit");
  });
});
