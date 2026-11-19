"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { planPackageSale, planPackageUnsale, saleSummary } = require("./package-sale");

const lot = (id, over = {}) => ({
  id,
  lotNumber: `L-${id}`,
  status: "available",
  soldBySheet: false,
  sheetStatus: "available",
  withdrawnAt: null,
  salePackageIds: [],
  ...over
});

test("selling a package sells all its offered lots", () => {
  const plan = planPackageSale("p1", [lot("a"), lot("b")]);
  assert.deepEqual(plan.sales, ["a", "b"]);
  assert.deepEqual(
    plan.changes.map((c) => [c.lotId, c.from, c.to]),
    [
      ["a", "available", "sold"],
      ["b", "available", "sold"]
    ]
  );
  assert.deepEqual(plan.alreadySold, []);
});

test("selling warns about lots already sold elsewhere, and still records this sale", () => {
  const plan = planPackageSale("p1", [
    lot("a", { status: "sold", salePackageIds: ["p2"] }),
    lot("b", { status: "sold", soldBySheet: true }),
    lot("c")
  ]);
  assert.deepEqual(plan.sales, ["a", "b", "c"]);
  assert.deepEqual(plan.changes.map((c) => c.lotId), ["c"]);
  assert.deepEqual(
    plan.alreadySold.map((s) => [s.lotId, s.bySheet, s.byPackageIds]),
    [
      ["a", false, ["p2"]],
      ["b", true, []]
    ]
  );
});

test("selling skips withdrawn and unavailable lots", () => {
  const plan = planPackageSale("p1", [lot("a", { withdrawnAt: new Date() }), lot("b", { status: "unavailable", sheetStatus: "unavailable" })]);
  assert.deepEqual(plan.sales, []);
  assert.deepEqual(plan.skipped.map((s) => [s.lotId, s.reason]), [
    ["a", "withdrawn"],
    ["b", "unavailable"]
  ]);
});

test("selling twice changes nothing", () => {
  const plan = planPackageSale("p1", [lot("a", { status: "sold", salePackageIds: ["p1"] })]);
  assert.deepEqual(plan.sales, []);
  assert.deepEqual(plan.changes, []);
});

test("undoing a sale frees only the lots sold by this package", () => {
  const plan = planPackageUnsale("p1", [
    lot("a", { status: "sold", salePackageIds: ["p1"] }),
    lot("b", { status: "sold", salePackageIds: ["p1", "p2"] }),
    lot("c", { status: "sold", soldBySheet: true, salePackageIds: ["p1"] }),
    lot("d", { status: "sold", salePackageIds: ["p2"] })
  ]);
  assert.deepEqual(plan.removeSales, ["a", "b", "c"]);
  assert.deepEqual(plan.changes.map((c) => [c.lotId, c.to]), [["a", "available"]]);
  assert.deepEqual(plan.stillSold.map((s) => [s.lotId, s.bySheet, s.byPackageIds]), [
    ["b", false, ["p2"]],
    ["c", true, []]
  ]);
});

test("undoing a sale returns a lot taken by the court officer to unavailable", () => {
  const plan = planPackageUnsale("p1", [lot("a", { status: "sold", sheetStatus: "unavailable", salePackageIds: ["p1"] })]);
  assert.deepEqual(plan.changes.map((c) => c.to), ["unavailable"]);
});

test("summary counts offered lots only", () => {
  const s = saleSummary([
    lot("a"),
    lot("b", { status: "sold" }),
    lot("c", { status: "unavailable" }),
    lot("d", { withdrawnAt: new Date() })
  ]);
  assert.deepEqual(s, { total: 2, sold: 1, available: 1, nothingAvailable: false });
  assert.equal(saleSummary([lot("a", { status: "sold" })]).nothingAvailable, true);
  assert.equal(saleSummary([]).nothingAvailable, true);
});
