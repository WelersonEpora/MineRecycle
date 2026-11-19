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

const SOURCE = xlsxBuffer([
  ["Item", "Qtde", "U.M", "Descrição dos Materiais", "Código STOR", "Tag", "Localização"],
  [1, 10, "pç", "Sample breaker", "S-100", "TG-1", "A-01"],
  [2, "12,5", "MT", "Sample cable", null, null, null],
  [3, 1, "CJ", "Sample panel kit", null, null, null],
  ["3.1", 2, "UN", "Sample panel door", "S-301", null, "B-02"]
]);

const lineView = (l) => [l.itemNo, l.description, Number(l.quantity), l.unit, l.storCode, l.tag, l.warehouseLocation, Boolean(l.parentLineId)];

test("package export to spreadsheet", { skip }, async (t) => {
  const server = await h.startServer();
  t.after(async () => {
    await server.close();
    await h.cleanup();
  });
  await h.resetDatabase();
  const seller = await h.loggedInSeller(server.base);
  const anon = h.client(server.base);
  const originId = await h.originId();

  const pkg = (await seller.post("/api/v1/seller/packages", { json: { name: "Sample Electrical", type: "bulk", locations: ["uberaba"], originId, storFolder: "9 Sample" } })).data;
  const other = (await seller.post("/api/v1/seller/packages", { json: { name: "Sample Other", type: "equipment", locations: ["niquelandia"], originId } })).data;
  await seller.put(`/api/v1/seller/packages/${other.id}/status`, { json: { status: "active" } });

  const importFile = async (buffer, name) => {
    const started = (await seller.post(`/api/v1/seller/packages/${pkg.id}/imports`, { form: h.fileForm({}, [{ field: "file", name, buffer }]) })).data;
    const res = await seller.post(`/api/v1/seller/packages/${pkg.id}/imports/${started.importId}/commit`, {
      json: { mapping: started.suggestedMapping, keepFile: false }
    });
    assert.equal(res.status, 200, JSON.stringify(res.data));
    return started;
  };
  const lines = async () => (await seller.get(`/api/v1/seller/packages/${pkg.id}/lines?pageSize=500`)).data.items;
  await importFile(SOURCE, "lista.xlsx");

  await t.test("only sellers can export", async () => {
    assert.equal((await anon.get("/api/v1/seller/packages/export")).status, 401);
    assert.equal((await anon.get(`/api/v1/seller/packages/${pkg.id}/export`)).status, 401);
  });

  let exported;
  await t.test("one package: packages sheet first, items second, in the screen language", async () => {
    const res = await seller.get(`/api/v1/seller/packages/${pkg.id}/export?lang=pt`);
    assert.equal(res.status, 200);
    assert.match(res.headers.get("content-type"), /spreadsheetml/);
    assert.match(res.headers.get("content-disposition"), new RegExp(`minerecycle-pacote-${pkg.number}-\\d{4}-\\d{2}-\\d{2}\\.xlsx`));
    exported = res.data;
    const wb = XLSX.read(exported, { type: "buffer", cellStyles: true });
    assert.deepEqual(wb.SheetNames, ["Pacotes", "Itens"]);
    const rows = XLSX.utils.sheet_to_json(wb.Sheets.Itens, { header: 1 });
    assert.deepEqual(rows.slice(1).map((r) => r[2]), ["1", "2", "3", "3.1"]);
    assert.ok(rows.slice(1).every((r) => r[0] === pkg.number));
    assert.equal(wb.Sheets.Itens["!rows"][4].level, 1, "3.1 is grouped under 3");
    const packages = XLSX.utils.sheet_to_json(wb.Sheets.Pacotes);
    assert.equal(packages.length, 1);
    assert.equal(packages[0]["Pasta STOR"], "9 Sample");
    assert.equal(packages[0].Itens, 4);
  });

  await t.test("round trip: re-importing the exported file keeps the items", async () => {
    const before = (await lines()).map(lineView);
    const started = await importFile(exported, "export.xlsx");
    assert.equal(started.sheet, "Itens", "importer opens the items sheet by itself");
    for (const field of ["itemNo", "description", "quantity", "unit", "storCode", "tag", "warehouseLocation"]) {
      assert.notEqual(started.suggestedMapping[field], null, `${field} mapped automatically`);
    }
    assert.deepEqual((await lines()).map(lineView), before);
  });

  await t.test("list export follows the filters, including status", async () => {
    const all = XLSX.read((await seller.get("/api/v1/seller/packages/export")).data, { type: "buffer" });
    assert.deepEqual(all.SheetNames, ["Packages", "Items"]);
    assert.equal(XLSX.utils.sheet_to_json(all.Sheets.Packages).length, 2);
    const res = await seller.get("/api/v1/seller/packages/export?status=active&lang=en");
    assert.match(res.headers.get("content-disposition"), /minerecycle-packages-/);
    const active = XLSX.read(res.data, { type: "buffer" });
    assert.deepEqual(XLSX.utils.sheet_to_json(active.Sheets.Packages).map((p) => p["Public name"]), ["Sample Other"]);
    assert.equal(XLSX.utils.sheet_to_json(active.Sheets.Items).length, 0);
  });
});
