"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const XLSX = require("xlsx");
const h = require("./helpers");

const skip = !h.ENABLED && "needs a test database (npm run test:integration)";

function xlsxBuffer(aoa) {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), "Lista");
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
}

const HEADER = ["Item", "Qtde", "U.M", "Descrição dos Materiais"];
const FIRST = xlsxBuffer([
  ["LISTA DE MATERIAL ELÉTRICO"],
  [],
  HEADER,
  [1, 10, "pç", "Disjuntor tripolar 100 A"],
  [2, "12,5", "MT", "Cabo de cobre"],
  [3, 1, "CJ", "Kit de painel"],
  ["3.1", 2, "UN", "Porta do painel"],
  [4, "abc", "UN", "Quantidade inválida"]
]);

test("spreadsheet import", { skip }, async (t) => {
  const server = await h.startServer();
  t.after(async () => {
    await server.close();
    await h.cleanup();
  });
  await h.resetDatabase();
  const seller = await h.loggedInSeller(server.base);
  const anon = h.client(server.base);

  const pkg = (await seller.post("/api/v1/seller/packages", { json: { number: 1, name: "Electrical", type: "bulk", locations: ["uberaba"] } })).data;
  const base = `/api/v1/seller/packages/${pkg.id}/imports`;

  await t.test("rejects non-Excel files", async () => {
    const res = await seller.post(base, { form: h.fileForm({}, [{ field: "file", name: "list.csv", buffer: Buffer.from("a,b") }]) });
    assert.equal(res.status, 400);
    assert.equal(res.data.error.code, "IMPORT_FILE_TYPE");
  });

  let importId;
  let mapping;
  await t.test("upload returns detected header and suggested mapping", async () => {
    const res = await seller.post(base, { form: h.fileForm({}, [{ field: "file", name: "lista.xlsx", buffer: FIRST }]) });
    assert.equal(res.status, 201);
    assert.equal(res.data.headerRow, 3);
    assert.deepEqual(
      res.data.headers.map((x) => x.label),
      HEADER
    );
    mapping = res.data.suggestedMapping;
    assert.deepEqual([mapping.itemNo, mapping.quantity, mapping.unit, mapping.description], [0, 1, 2, 3]);
    importId = res.data.importId;
  });

  await t.test("preview reports errors without writing", async () => {
    const res = await seller.post(`${base}/${importId}/preview`, { json: { mapping, headerRow: 3 } });
    assert.equal(res.status, 200);
    assert.equal(res.data.stats.validRows, 4);
    assert.deepEqual(res.data.errorsByCode, { quantity_invalid: 1 });
    assert.equal(res.data.errors[0].row, 8);
    assert.equal(res.data.existingLineCount, 0);
  });

  await t.test("incomplete mapping is refused", async () => {
    const res = await seller.post(`${base}/${importId}/preview`, { json: { mapping: { ...mapping, unit: null } } });
    assert.equal(res.status, 400);
    assert.equal(res.data.error.code, "IMPORT_MAPPING_INVALID");
  });

  await t.test("numberRows numbers items by row order and ignores the item column", async () => {
    const res = await seller.post(`${base}/${importId}/preview`, { json: { mapping: { ...mapping, itemNo: null }, numberRows: true } });
    assert.equal(res.status, 200);
    assert.equal(res.data.stats.validRows, 4);
    assert.equal(res.data.stats.childLines, 0);
    assert.deepEqual(res.data.errorsByCode, { quantity_invalid: 1 });
  });

  await t.test("commit with errors is refused unless invalid rows are skipped", async () => {
    const refused = await seller.post(`${base}/${importId}/commit`, { json: { mapping } });
    assert.equal(refused.status, 400);
    assert.equal(refused.data.error.code, "IMPORT_HAS_ERRORS");

    const ok = await seller.post(`${base}/${importId}/commit`, { json: { mapping, skipInvalid: true, fileName: "lista.xlsx" } });
    assert.equal(ok.status, 200);
    assert.equal(ok.data.inserted, 4);
    assert.equal(ok.data.skippedInvalidRows, 1);
    assert.equal(ok.data.attachment.kind, "list");
    assert.equal(ok.data.attachment.visibility, "internal");
  });

  await t.test("finished import cannot be committed twice", async () => {
    const res = await seller.post(`${base}/${importId}/commit`, { json: { mapping, skipInvalid: true } });
    assert.equal(res.status, 404);
    assert.equal(res.data.error.code, "IMPORT_NOT_FOUND");
  });

  await t.test("lines are stored with normalized units, fractional quantities and hierarchy", async () => {
    const res = await seller.get(`/api/v1/seller/packages/${pkg.id}/lines`);
    const byItem = Object.fromEntries(res.data.items.map((l) => [l.itemNo, l]));
    assert.deepEqual(Object.keys(byItem), ["1", "2", "3", "3.1"]);
    assert.equal(byItem["1"].unit, "PC");
    assert.equal(byItem["1"].unitRaw, "pç");
    assert.equal(byItem["2"].unit, "M");
    assert.equal(byItem["2"].quantity, "12.5");
    assert.equal(byItem["3.1"].parentLineId, byItem["3"].id);
  });

  await t.test("public sees the lines only after the package is active", async () => {
    assert.equal((await anon.get("/api/v1/catalog/packages/1/lines")).status, 404);
    await seller.put(`/api/v1/seller/packages/${pkg.id}/status`, { json: { status: "active" } });
    const res = await anon.get("/api/v1/catalog/packages/1/lines?q=cabo");
    assert.equal(res.status, 200);
    assert.equal(res.data.total, 1);
    assert.equal(res.data.items[0].itemNo, "2");
  });

  await t.test("re-import replaces lines and keeps line attachments by item number", async () => {
    const lines = (await seller.get(`/api/v1/seller/packages/${pkg.id}/lines`)).data.items;
    const line2 = lines.find((l) => l.itemNo === "2");
    const line1 = lines.find((l) => l.itemNo === "1");
    const upload = (lineId) =>
      seller.post(`/api/v1/seller/packages/${pkg.id}/attachments`, {
        form: h.fileForm({ kind: "datasheet", visibility: "restricted", lineId }, [{ name: "sheet.pdf", buffer: Buffer.from("%PDF-1.4\n%%EOF") }])
      });
    const att2 = (await upload(line2.id)).data[0];
    const att1 = (await upload(line1.id)).data[0];

    const second = xlsxBuffer([HEADER, [2, 7, "M", "Cabo de cobre (revisado)"], [5, 1, "UN", "Novo item"]]);
    const started = (await seller.post(base, { form: h.fileForm({}, [{ field: "file", name: "v2.xlsx", buffer: second }]) })).data;
    const res = await seller.post(`${base}/${started.importId}/commit`, { json: { mapping: started.suggestedMapping, keepFile: false } });
    assert.equal(res.status, 200);
    assert.equal(res.data.removed, 4);
    assert.equal(res.data.inserted, 2);
    assert.equal(res.data.relinkedAttachments, 1);
    assert.equal(res.data.unlinkedAttachments, 1);
    assert.equal(res.data.attachment, null);

    const newLines = (await seller.get(`/api/v1/seller/packages/${pkg.id}/lines`)).data.items;
    const newLine2 = newLines.find((l) => l.itemNo === "2");
    const atts = (await seller.get(`/api/v1/seller/packages/${pkg.id}/attachments`)).data;
    assert.equal(atts.find((a) => a.id === att2.id).lineId, newLine2.id);
    assert.equal(atts.find((a) => a.id === att1.id).lineId, null);
  });

  await t.test("STOR code in the file name is checked against the packages", async () => {
    const other = (
      await seller.post("/api/v1/seller/packages", { json: { name: "Other", type: "bulk", locations: ["uberaba"], storDocuments: ["1809601"] } })
    ).data;
    const startWith = async (name) =>
      (await seller.post(base, { form: h.fileForm({}, [{ field: "file", name, buffer: FIRST }]) })).data;

    const plain = await startWith("lista.xlsx");
    assert.equal(plain.storDocument, null);

    const elsewhere = await startWith("1809601_REV0_VER0_Lista.xlsx");
    assert.equal(elsewhere.storDocument.code, "1809601");
    assert.equal(elsewhere.storDocument.inThisPackage, false);
    assert.deepEqual(elsewhere.storDocument.otherPackages.map((p) => p.id), [other.id]);

    const fresh = await startWith("1809999_REV0_VER0_Lista.xlsx");
    assert.deepEqual(fresh.storDocument, { code: "1809999", inThisPackage: false, pending: false, otherPackages: [] });
    const res = await seller.post(`${base}/${fresh.importId}/commit`, {
      json: { mapping, headerRow: 3, skipInvalid: true, keepFile: false, addStorDocument: true, fileName: "1809999_REV0_VER0_Lista.xlsx" }
    });
    assert.equal(res.status, 200);
    assert.equal(res.data.storDocumentAdded, true);
    assert.deepEqual((await seller.get(`/api/v1/seller/packages/${pkg.id}`)).data.storDocuments, ["1809999"]);

    // Documento pendente de validação: a importação exige confirmação.
    await seller.patch(`/api/v1/seller/packages/${pkg.id}`, { json: { storDocumentsPending: ["1809999"] } });
    const pend = await startWith("1809999_REV0_VER0_Lista.xlsx");
    assert.equal(pend.storDocument.pending, true);
    const opts = { mapping, headerRow: 3, skipInvalid: true, keepFile: false, fileName: "1809999_REV0_VER0_Lista.xlsx" };
    const refused = await seller.post(`${base}/${pend.importId}/commit`, { json: opts });
    assert.equal(refused.data.error.code, "IMPORT_DOCUMENT_PENDING");
    assert.equal((await seller.post(`${base}/${pend.importId}/commit`, { json: { ...opts, confirmPending: true } })).status, 200);
    await seller.patch(`/api/v1/seller/packages/${pkg.id}`, { json: { storDocumentsPending: [] } });

    const again = await startWith("1809999_REV0_VER0_Lista.xlsx");
    assert.equal(again.storDocument.inThisPackage, true);
    await seller.del(`${base}/${again.importId}`);
    for (const id of [plain.importId, elsewhere.importId]) await seller.del(`${base}/${id}`);
  });

  await t.test("anonymous users cannot import", async () => {
    const res = await anon.post(base, { form: h.fileForm({}, [{ field: "file", name: "x.xlsx", buffer: FIRST }]) });
    assert.equal(res.status, 401);
  });
});
