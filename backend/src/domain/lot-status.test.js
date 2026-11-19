"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { parseSheetStatus, lotStatus, isLotOffered } = require("./lot-status");

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
