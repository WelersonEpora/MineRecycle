"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { buildLotImportPlan } = require("./lot-plan");

let rowNumber = 7;
const row = (lotNumber, over = {}) => ({
  rowNumber: rowNumber++,
  values: {
    lotNumber,
    siteName: "Site A",
    title: `Item ${lotNumber}`,
    masterSupplier: "Acme",
    linkedSystem: "Kiln",
    commercialFamily: null,
    subfamily: null,
    status: null,
    ...over
  }
});
const sheet = (rows, extra = {}) => ({ headerRow: 6, columns: {}, missing: [], rows, truncated: false, ...extra });
const existing = (lotNumber, over = {}) => ({
  id: `id-${lotNumber}`,
  lotNumber,
  siteName: "Site A",
  title: `Item ${lotNumber}`,
  masterSupplier: "Acme",
  linkedSystem: "Kiln",
  commercialFamily: null,
  subfamily: null,
  sheetStatus: "available",
  soldBySheet: false,
  status: "available",
  withdrawnAt: null,
  saleCount: 0,
  ...over
});
const plan = (rows, existingLots = [], autoPackages = [], extra) => buildLotImportPlan({ sheet: sheet(rows, extra), existingLots, autoPackages });

test("first import creates lots and automatic packages", () => {
  const p = plan([row("2", { commercialFamily: "Motors" }), row("1", { status: "Sold" })]);
  assert.deepEqual(p.errors, []);
  assert.deepEqual(p.lots.create.map((c) => [c.lotNumber, c.data.status, c.data.soldBySheet]), [
    ["1", "sold", true],
    ["2", "available", false]
  ]);
  assert.deepEqual(p.statusChanges, [{ lotNumber: "1", from: null, to: "sold" }]);
  assert.deepEqual(p.packages.create.map((c) => [c.source, c.sourceValue, c.lotNumbers]), [
    ["linked_system", "Kiln", ["1", "2"]],
    ["family", "Motors", ["2"]]
  ]);
  assert.equal(p.summary.created, 2);
});

test("re-import updates sheet fields, keeps the seller description and counts unchanged lots", () => {
  const p = plan(
    [row("1", { title: "Item 1 (revised)" }), row("2")],
    [existing("1", { description: "Seller text" }), existing("2")]
  );
  assert.equal(p.lots.update.length, 1);
  assert.deepEqual(p.lots.update[0].changes, { title: { from: "Item 1", to: "Item 1 (revised)" } });
  assert.equal("description" in p.lots.update[0].data, false);
  assert.equal(p.lots.unchanged, 1);
});

test("lots missing from the sheet are withdrawn, and come back when they reappear", () => {
  const gone = plan([row("1")], [existing("1"), existing("2")]);
  assert.deepEqual(gone.lots.withdraw, [{ id: "id-2", lotNumber: "2" }]);

  const back = plan([row("1"), row("2")], [existing("1"), existing("2", { withdrawnAt: new Date() })]);
  assert.deepEqual(back.lots.restore, [{ id: "id-2", lotNumber: "2" }]);
  assert.equal(back.lots.update[0].restored, true);
  // Retirado que continua fora da planilha: nada muda.
  assert.equal(plan([row("1")], [existing("1"), existing("2", { withdrawnAt: new Date() })]).lots.unchanged, 2);
});

test("sold by the sheet is never undone by a later import", () => {
  const p = plan([row("1", { status: null })], [existing("1", { sheetStatus: "sold", soldBySheet: true, status: "sold" })]);
  assert.equal(p.lots.update[0].data.status, "sold");
  assert.equal(p.lots.update[0].data.soldBySheet, true);
  assert.deepEqual(p.lots.update[0].changes, { sheetStatus: { from: "sold", to: "available" } });
  assert.deepEqual(p.statusChanges, []);
});

test("a lot sold by a package stays sold, and the sheet disagreement is reported", () => {
  const p = plan([row("1")], [existing("1", { status: "sold", saleCount: 1 })]);
  assert.deepEqual(p.disagreements, [{ lotNumber: "1", sheetStatus: "available" }]);
  assert.equal(p.lots.unchanged, 1);
});

test("court officer makes the lot unavailable; back to available when the sheet clears", () => {
  const out = plan([row("1", { status: "Collected by court officer" })], [existing("1")]);
  assert.deepEqual(out.statusChanges, [{ lotNumber: "1", from: "available", to: "unavailable" }]);
  const back = plan([row("1")], [existing("1", { sheetStatus: "unavailable", status: "unavailable" })]);
  assert.deepEqual(back.statusChanges, [{ lotNumber: "1", from: "unavailable", to: "available" }]);
});

test("blocking errors: empty or duplicate lot number, empty title, unknown status, too long", () => {
  const p = plan([row(null), row("1"), row("1"), row("2", { title: null }), row("3", { status: "Reserved" }), row("4", { siteName: "x".repeat(121) })]);
  assert.deepEqual(
    p.errors.map((e) => e.code),
    ["LOT_NUMBER_EMPTY", "LOT_NUMBER_DUPLICATE", "LOT_TITLE_EMPTY", "LOT_STATUS_UNKNOWN", "LOT_VALUE_TOO_LONG"]
  );
  const dup = p.errors.find((e) => e.code === "LOT_NUMBER_DUPLICATE");
  assert.equal(dup.value, "1");
  assert.equal(dup.firstRow, dup.row - 1);
});

test("blocking errors on the sheet itself", () => {
  assert.deepEqual(plan([], [], [], { headerRow: null }).errors.map((e) => e.code), ["LOT_SHEET_NO_HEADER"]);
  assert.deepEqual(plan([row("1")], [], [], { missing: ["subfamily"] }).errors, [{ code: "LOT_SHEET_MISSING_COLUMNS", fields: ["subfamily"] }]);
  assert.deepEqual(plan([]).errors.map((e) => e.code), ["LOT_SHEET_EMPTY"]);
});

test("withdrawn lots leave automatic packages", () => {
  const p = plan([row("1")], [existing("1"), existing("2")], [{ id: "pk", source: "linked_system", sourceValue: "Kiln", lotNumbers: ["1", "2"] }]);
  assert.deepEqual(p.packages.update, [{ packageId: "pk", source: "linked_system", sourceValue: "Kiln", add: [], remove: ["2"], lotNumbers: ["1"] }]);
});

test("the fingerprint changes with the file or the database", () => {
  const rows = [row("1")];
  const base = buildLotImportPlan({ sheet: sheet(rows), existingLots: [], autoPackages: [], fileHash: "a" }).fingerprint;
  assert.equal(buildLotImportPlan({ sheet: sheet(rows), existingLots: [], autoPackages: [], fileHash: "a" }).fingerprint, base);
  assert.notEqual(buildLotImportPlan({ sheet: sheet(rows), existingLots: [], autoPackages: [], fileHash: "b" }).fingerprint, base);
  assert.notEqual(buildLotImportPlan({ sheet: sheet(rows), existingLots: [existing("9")], autoPackages: [], fileHash: "a" }).fingerprint, base);
});
