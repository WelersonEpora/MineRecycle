"use strict";

// Importação da planilha de lotes (decisão de 2026-11-19): prévia, confirmação, pacotes automáticos, situação vinda
// da planilha e reimportação. Dados fictícios.
const test = require("node:test");
const assert = require("node:assert/strict");
const h = require("./helpers");

const skip = !h.ENABLED && "needs a test database (npm run test:integration)";

// [lotNumber, site, title, supplier, system, family, subfamily, status, price]
const FIRST = [
  ["L-10", "Site A", "Fictitious pump", "Acme", "Water System", "Pumps", "Centrifugal", "", 999],
  ["L-2", "Site A", "Fictitious motor", "Acme", "Water System", "Motors", "", "Available", 500],
  ["L-3", "Site B", "Fictitious crane", "Beta", "", "Cranes", "", "Sold", 100],
  ["L-4", "Site B", "Fictitious truck", "Beta", "Fleet", "", "", "Collected by court officer", 0]
];

test("lot import", { skip }, async (t) => {
  const server = await h.startServer();
  t.after(async () => {
    await server.close();
    await h.cleanup();
  });
  await h.resetDatabase();
  const seller = await h.loggedInSeller(server.base);
  const anon = h.client(server.base);
  const { Lot, Package, PackageLot } = require("../../src/models");

  const upload = (buffer, name = "inventory.xlsx") => seller.post("/api/v1/seller/lot-imports", { form: h.fileForm({}, [{ field: "file", name, buffer }]) });
  const commit = (preview) => seller.post(`/api/v1/seller/lot-imports/${preview.importId}/commit`, { json: { fingerprint: preview.fingerprint, sheet: preview.sheet } });
  const importRows = async (rows) => {
    const preview = (await upload(h.lotWorkbook(rows))).data;
    assert.equal(preview.canCommit, true, JSON.stringify(preview.errors.items));
    const res = await commit(preview);
    assert.equal(res.status, 200, JSON.stringify(res.data));
    return { preview, summary: res.data.summary };
  };
  const pkgBy = (source, sourceValue) => Package.findOne({ where: { source, sourceValue } });
  const lotsOf = async (pkg) =>
    (await PackageLot.findAll({ where: { packageId: pkg.id }, order: [["position", "ASC"]], include: [{ model: Lot, as: "lot" }] })).map((pl) => pl.lot.lotNumber);

  await t.test("only spreadsheets are accepted, and only by sellers", async () => {
    assert.equal((await upload(Buffer.from("not a sheet"), "notes.txt")).data.error.code, "IMPORT_FILE_TYPE");
    // Arquivo sem a aba de lotes: aceito para a prévia, que não deixa confirmar.
    const noHeader = (await upload(Buffer.from("garbage"), "broken.xlsx")).data;
    assert.deepEqual(noHeader.errors.items.map((e) => e.code), ["LOT_SHEET_NO_HEADER"]);
    const res = await anon.post("/api/v1/seller/lot-imports", { form: h.fileForm({}, [{ field: "file", name: "x.xlsx", buffer: h.lotWorkbook(FIRST) }]) });
    assert.equal(res.status, 401);
  });

  await t.test("blocking errors: missing column, duplicate lot, unknown status; nothing is saved", async () => {
    const missing = (await upload(h.lotWorkbook(FIRST.map((r) => r.slice(0, 7)), { header: h.LOT_HEADER.slice(0, 7) }))).data;
    assert.equal(missing.canCommit, false);
    assert.deepEqual(missing.errors.items.map((e) => e.code), ["LOT_SHEET_MISSING_COLUMNS"]);

    const bad = (await upload(h.lotWorkbook([...FIRST, ["L-2", "Site A", "Again", "", "", "", "", "", ""], ["L-9", "Site A", "Typo", "", "", "", "", "Sould", ""]]))).data;
    assert.deepEqual(bad.errors.items.map((e) => e.code).sort(), ["LOT_NUMBER_DUPLICATE", "LOT_STATUS_UNKNOWN"]);
    const refused = await commit(bad);
    assert.equal(refused.data.error.code, "IMPORT_HAS_ERRORS");
    assert.equal(await Lot.count(), 0);
  });

  await t.test("preview finds the lot sheet among others and saves nothing", async () => {
    const preview = (await upload(h.lotWorkbook(FIRST, { extraSheets: ["Read me"] }))).data;
    assert.equal(preview.sheet, "Matriz de lotes");
    assert.deepEqual(preview.sheets, ["Read me", "Matriz de lotes"]);
    assert.equal(preview.summary.created, 4);
    // Sistemas Water System e Fleet; famílias Pumps, Motors e Cranes; subfamília Centrifugal.
    assert.equal(preview.summary.packagesCreated, 6);
    assert.equal(await Lot.count(), 0);
    await seller.del(`/api/v1/seller/lot-imports/${preview.importId}`);
    assert.equal((await commit(preview)).data.error.code, "IMPORT_NOT_FOUND");
  });

  await t.test("commit creates the lots and one draft package per grouping value", async () => {
    const { summary } = await importRows(FIRST);
    assert.equal(summary.created, 4);
    const lots = await Lot.findAll({ order: [["lotNumber", "ASC"]] });
    assert.deepEqual(
      lots.map((l) => [l.lotNumber, l.status]),
      [
        ["L-10", "available"],
        ["L-2", "available"],
        ["L-3", "sold"],
        ["L-4", "unavailable"]
      ]
    );
    // Preço nunca entra.
    assert.equal(Object.keys(lots[0].get()).some((k) => /price|value/i.test(k)), false);
    assert.equal(lots.find((l) => l.lotNumber === "L-3").soldBySheet, true);

    const water = await pkgBy("linked_system", "Water System");
    assert.equal(water.status, "draft");
    assert.equal(water.name, "Water System");
    // Ordem natural do nº do lote.
    assert.deepEqual(await lotsOf(water), ["L-2", "L-10"]);
    assert.ok(await pkgBy("family", "Pumps"));
    assert.ok(await pkgBy("subfamily", "Centrifugal"));
    assert.equal(await Package.count(), 6);
    // Rascunho não aparece no catálogo.
    assert.equal((await anon.get("/api/v1/catalog/packages")).data.items.length, 0);
  });

  await t.test("importing the same file again changes nothing", async () => {
    const preview = (await upload(h.lotWorkbook(FIRST))).data;
    assert.equal(preview.summary.created, 0);
    assert.equal(preview.summary.updated, 0);
    assert.equal(preview.summary.packagesCreated, 0);
    assert.equal(preview.summary.packagesUpdated, 0);
  });

  await t.test("the preview is refused when the lots changed after it", async () => {
    const preview = (await upload(h.lotWorkbook([...FIRST, ["L-5", "Site C", "Fictitious valve", "", "Water System", "", "", "", ""]]))).data;
    await Lot.update({ title: "Changed meanwhile" }, { where: { lotNumber: "L-2" } });
    assert.equal((await commit(preview)).data.error.code, "IMPORT_STALE");
    assert.equal(await Lot.count(), 4);
  });

  await t.test("a sold automatic package sells the lots that the spreadsheet adds to it later", async () => {
    const water = await pkgBy("linked_system", "Water System");
    const sold = await seller.put(`/api/v1/seller/packages/${water.id}/status`, { json: { status: "sold" } });
    assert.equal(sold.status, 200);
    assert.equal(sold.data.sale.sold, 2);

    const next = [
      ...FIRST.filter((r) => r[0] !== "L-4"),
      ["L-5", "Site C", "Fictitious valve", "", "Water System", "", "", "", ""],
      ["L-6", "Site C", "Fictitious hoist", "", "Lifting", "", "", "", ""]
    ];
    const { summary } = await importRows(next);
    assert.equal(summary.created, 2);
    assert.equal(summary.withdrawn, 1);
    assert.equal(summary.updated, 1);
    assert.equal((await Lot.findOne({ where: { lotNumber: "L-5" } })).status, "sold");
    assert.equal((await Lot.findOne({ where: { lotNumber: "L-6" } })).status, "available");
    assert.ok((await Lot.findOne({ where: { lotNumber: "L-4" } })).withdrawnAt);
    assert.deepEqual(await lotsOf(water), ["L-2", "L-5", "L-10"]);
    // "Fleet" ficou sem lotes, mas o pacote não é apagado.
    const fleet = await pkgBy("linked_system", "Fleet");
    assert.deepEqual(await lotsOf(fleet), []);
  });

  await t.test("the spreadsheet never takes a lot back from sold", async () => {
    const back = FIRST.map((r) => (r[0] === "L-3" ? [...r.slice(0, 7), "Available", r[8]] : r));
    await importRows([...back, ["L-5", "Site C", "Fictitious valve", "", "Water System", "", "", "", ""]]);
    const crane = await Lot.findOne({ where: { lotNumber: "L-3" } });
    assert.equal(crane.status, "sold");
    assert.equal(crane.soldBySheet, true);
    // L-4 voltou à planilha: deixa de ser retirado.
    assert.equal((await Lot.findOne({ where: { lotNumber: "L-4" } })).withdrawnAt, null);
  });

  await t.test("seller lot list: filters, sorting and the package of the lot", async () => {
    const all = (await seller.get("/api/v1/seller/lots?sort=lotNumber")).data;
    // Retirado (L-6) fica fora da lista padrão.
    assert.deepEqual(all.items.map((l) => l.lotNumber).sort(), ["L-10", "L-2", "L-3", "L-4", "L-5"]);
    assert.equal((await seller.get("/api/v1/seller/lots?status=sold")).data.total, 4);
    assert.deepEqual((await seller.get("/api/v1/seller/lots?q=crane")).data.items.map((l) => l.lotNumber), ["L-3"]);
    assert.deepEqual((await seller.get("/api/v1/seller/lots?withdrawn=1")).data.items.map((l) => l.lotNumber), ["L-6"]);
    const facets = (await seller.get("/api/v1/seller/lots/facets")).data;
    assert.ok(facets);
    const pump = all.items.find((l) => l.lotNumber === "L-10");
    const detail = (await seller.get(`/api/v1/seller/lots/${pump.id}`)).data;
    assert.ok(detail.packages.some((p) => p.name === "Water System" && p.soldThisLot));
  });

  await t.test("export: every lot not withdrawn, in the import format; importing it back changes nothing", async () => {
    const res = await seller.get("/api/v1/seller/lots/export?lang=pt");
    assert.equal(res.status, 200);
    assert.match(res.headers.get("content-disposition"), /MineRecycle - Lotes - \d{4}-\d{2}-\d{2}\.xlsx/);
    assert.equal(res.headers.get("cache-control"), "private, no-store");
    const XLSX = require("xlsx");
    const wb = XLSX.read(res.data, { type: "buffer" });
    assert.deepEqual(wb.SheetNames, ["Matriz de lotes"]);
    const rows = XLSX.utils.sheet_to_json(wb.Sheets["Matriz de lotes"], { header: 1, defval: "" });
    // L-6 está retirado: fica fora.
    assert.deepEqual(rows.slice(1).map((r) => r[0]), ["L-2", "L-3", "L-4", "L-5", "L-10"]);
    // L-2 foi vendido pelo pacote Water System: STATUS como a planilha disse, situação do sistema ao lado.
    const l2 = rows.find((r) => r[0] === "L-2");
    assert.equal(l2[7], "");
    assert.equal(l2[8], "Vendido");
    // Coluna "Ajuste manual" (2026-11-24): vazia, o lote não foi ajustado à mão.
    assert.equal(l2[9], "");
    assert.match(l2[10], /Water System/);

    const preview = (await upload(res.data, "export.xlsx")).data;
    assert.equal(preview.canCommit, true);
    for (const k of ["created", "updated", "restored", "withdrawn", "packagesCreated", "packagesUpdated", "packagesEmptied"]) {
      assert.equal(preview.summary[k], 0, k);
    }
    await seller.del(`/api/v1/seller/lot-imports/${preview.importId}`);
    assert.equal((await anon.get("/api/v1/seller/lots/export")).status, 401);
  });

});
