"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { parseSheetStatus, lotStatus, isLotOffered, planManualStatus, reimportStatus } = require("./lot-status");

test("sheet status: known values, ignoring case, accents and spacing", () => {
  assert.equal(parseSheetStatus(null), "available");
  assert.equal(parseSheetStatus("  "), "available");
  assert.equal(parseSheetStatus("Sold"), "sold");
  assert.equal(parseSheetStatus(" SOLD "), "sold");
  assert.equal(parseSheetStatus("Vendido"), "sold");
  assert.equal(parseSheetStatus("Collected by court officer"), "unavailable");
  assert.equal(parseSheetStatus("collected by Court Officer."), "unavailable");
  assert.equal(parseSheetStatus("Indisponível"), "unavailable");
});

test("sheet status: unknown values are rejected (null)", () => {
  assert.equal(parseSheetStatus("Reserved"), null);
  assert.equal(parseSheetStatus("Sol"), null);
});

test("lot status: sold by the sheet or by a package wins", () => {
  assert.equal(lotStatus({}), "available");
  assert.equal(lotStatus({ soldBySheet: true }), "sold");
  assert.equal(lotStatus({ saleCount: 1 }), "sold");
  // A planilha voltou a ficar vazia, mas "vendido" pela planilha não se desfaz.
  assert.equal(lotStatus({ soldBySheet: true, sheetStatus: "available" }), "sold");
  assert.equal(lotStatus({ saleCount: 2, sheetStatus: "unavailable" }), "sold");
});

test("lot status: unavailable follows the sheet", () => {
  assert.equal(lotStatus({ sheetStatus: "unavailable" }), "unavailable");
  assert.equal(lotStatus({ sheetStatus: "available" }), "available");
});

test("offered lots: not withdrawn and not unavailable", () => {
  assert.equal(isLotOffered({ status: "available", withdrawnAt: null }), true);
  assert.equal(isLotOffered({ status: "sold", withdrawnAt: null }), true);
  assert.equal(isLotOffered({ status: "unavailable", withdrawnAt: null }), false);
  assert.equal(isLotOffered({ status: "available", withdrawnAt: new Date() }), false);
});

test("lot status: a manual adjustment beats the sheet, but not a package sale", () => {
  assert.equal(lotStatus({ soldBySheet: true, sheetStatus: "sold", manualStatus: "available" }), "available");
  assert.equal(lotStatus({ sheetStatus: "unavailable", manualStatus: "available" }), "available");
  assert.equal(lotStatus({ manualStatus: "sold" }), "sold");
  assert.equal(lotStatus({ manualStatus: "unavailable" }), "unavailable");
  assert.equal(lotStatus({ saleCount: 1, manualStatus: "available" }), "sold");
});

test("manual adjustment: allowed values, blocked when withdrawn or sold by a package", () => {
  const base = { status: "sold", soldBySheet: true, sheetStatus: "sold", withdrawnAt: null, saleCount: 0 };
  assert.deepEqual(planManualStatus(base, "available"), { manualStatus: "available", status: "available" });
  assert.deepEqual(planManualStatus(base, "unavailable"), { manualStatus: "unavailable", status: "unavailable" });
  // Voltar a seguir a planilha: o "Sold" da planilha vale de novo.
  assert.deepEqual(planManualStatus(base, null), { manualStatus: null, status: "sold" });
  assert.deepEqual(planManualStatus(base, "reserved"), { error: "LOT_STATUS_INVALID" });
  assert.deepEqual(planManualStatus({ ...base, withdrawnAt: new Date() }, "available"), { error: "LOT_WITHDRAWN" });
  assert.deepEqual(planManualStatus({ ...base, saleCount: 1 }, "available"), { error: "LOT_SOLD_BY_PACKAGE" });
});

test("re-import: the manual adjustment stays while the sheet STATUS is the same", () => {
  const current = { sheetStatus: "sold", soldBySheet: true, manualStatus: "available" };
  assert.deepEqual(reimportStatus(current, "sold"), { manualStatus: "available", manualCleared: false, soldBySheet: true });
});

test("re-import: a new sheet STATUS clears the adjustment and recomputes sold-by-sheet", () => {
  // Vendido pela planilha, ajustado para disponível, e a planilha corrigida: fica disponível (não volta a vendido).
  const current = { sheetStatus: "sold", soldBySheet: true, manualStatus: "available" };
  assert.deepEqual(reimportStatus(current, "available"), { manualStatus: null, manualCleared: true, soldBySheet: false });
  assert.deepEqual(reimportStatus({ sheetStatus: "available", soldBySheet: false, manualStatus: "sold" }, "unavailable"), {
    manualStatus: null,
    manualCleared: true,
    soldBySheet: false
  });
});

test("re-import without adjustment: Sold is still one-way; new lots follow the sheet", () => {
  assert.deepEqual(reimportStatus({ sheetStatus: "sold", soldBySheet: true, manualStatus: null }, "available"), {
    manualStatus: null,
    manualCleared: false,
    soldBySheet: true
  });
  assert.deepEqual(reimportStatus(undefined, "sold"), { manualStatus: null, manualCleared: false, soldBySheet: true });
});
