"use strict";

// Ajuste manual da situação do lote (decisão de 2026-11-24): vale sobre a planilha até ela mudar o STATUS do lote,
// e não vale para lote vendido por pacote. Dados fictícios.
const test = require("node:test");
const assert = require("node:assert/strict");
const h = require("./helpers");

const skip = !h.ENABLED && "needs a test database (npm run test:integration)";

// [lotNumber, site, title, supplier, system, family, subfamily, status]
const ROWS = [
  ["M-1", "Site A", "Fictitious gearbox", "Acme", "Drive", "Gears", "", "Sold"],
  ["M-2", "Site A", "Fictitious motor", "Acme", "Drive", "Motors", "", ""],
  ["M-3", "Site B", "Fictitious valve", "Beta", "Water", "Valves", "", ""]
];

test("manual lot status", { skip }, async (t) => {
  const server = await h.startServer();
  t.after(async () => {
    await server.close();
    await h.cleanup();
  });
  await h.resetDatabase();
  const seller = await h.loggedInSeller(server.base);
  const anon = h.client(server.base);
  const { Lot } = require("../../src/models");

  const importRows = async (rows) => {
    const preview = (await seller.post("/api/v1/seller/lot-imports", { form: h.fileForm({}, [{ field: "file", name: "inventory.xlsx", buffer: h.lotWorkbook(rows) }]) })).data;
    assert.equal(preview.canCommit, true, JSON.stringify(preview.errors.items));
    const res = await seller.post(`/api/v1/seller/lot-imports/${preview.importId}/commit`, { json: { fingerprint: preview.fingerprint, sheet: preview.sheet } });
    assert.equal(res.status, 200, JSON.stringify(res.data));
    return preview;
  };
  const lotId = async (lotNumber) => (await Lot.findOne({ where: { lotNumber } })).id;
  const setStatus = async (lotNumber, json) => seller.put(`/api/v1/seller/lots/${await lotId(lotNumber)}/status`, { json });
  const getLot = async (lotNumber) => (await seller.get(`/api/v1/seller/lots/${await lotId(lotNumber)}`)).data;

  await importRows(ROWS);

  await t.test("only sellers adjust, and only to known values", async () => {
    const id = await lotId("M-2");
    assert.equal((await anon.put(`/api/v1/seller/lots/${id}/status`, { json: { status: "sold" } })).status, 401);
    const bad = await setStatus("M-2", { status: "reserved" });
    assert.equal(bad.status, 400);
    assert.equal(bad.data.error.code, "LOT_STATUS_INVALID");
  });

  await t.test("a lot sold by the sheet can be made available by hand, with who, when and a note", async () => {
    const res = await setStatus("M-1", { status: "available", note: "Deal fell through" });
    assert.equal(res.status, 200, JSON.stringify(res.data));
    assert.equal(res.data.status, "available");
    assert.equal(res.data.manualStatus, "available");
    assert.equal(res.data.manualStatusNote, "Deal fell through");
    assert.ok(res.data.manualStatusAt);
    assert.ok(res.data.manualStatusByName);
    assert.equal(res.data.soldBySheet, true);
  });

  await t.test("re-importing the same STATUS keeps the adjustment", async () => {
    const preview = await importRows(ROWS);
    assert.equal(preview.manualCleared.total, 0);
    const lot = await getLot("M-1");
    assert.equal(lot.status, "available");
    assert.equal(lot.manualStatus, "available");
  });

  await t.test("a new STATUS in the sheet clears the adjustment", async () => {
    const preview = await importRows([["M-1", "Site A", "Fictitious gearbox", "Acme", "Drive", "Gears", "", ""], ...ROWS.slice(1)]);
    assert.deepEqual(preview.manualCleared.items.map((c) => c.lotNumber), ["M-1"]);
    const lot = await getLot("M-1");
    assert.equal(lot.status, "available");
    assert.equal(lot.manualStatus, null);
    assert.equal(lot.manualStatusNote, null);
    assert.equal(lot.soldBySheet, false);
  });

  await t.test("off sale by hand, then back to following the sheet", async () => {
    assert.equal((await setStatus("M-3", { status: "unavailable" })).data.status, "unavailable");
    const back = await setStatus("M-3", { status: null });
    assert.equal(back.data.status, "available");
    assert.equal(back.data.manualStatus, null);
    assert.equal(back.data.manualStatusAt, null);
  });

  await t.test("a lot sold by a package cannot be adjusted", async () => {
    const lot = await Lot.findOne({ where: { lotNumber: "M-2" } });
    const pkg = await h.packageWithLots(seller, { number: 70, name: "Fictitious motors", lots: [lot], status: "active" });
    const sold = await seller.put(`/api/v1/seller/packages/${pkg.id}/status`, { json: { status: "sold", confirm: true } });
    assert.equal(sold.status, 200, JSON.stringify(sold.data));
    const res = await setStatus("M-2", { status: "available" });
    assert.equal(res.status, 409);
    assert.equal(res.data.error.code, "LOT_SOLD_BY_PACKAGE");
    assert.deepEqual(res.data.error.details.packages, [70]);
  });
});
