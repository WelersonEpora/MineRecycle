"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { planAutoPackages, cleanGroupValue, groupKey, compareLotNumbers } = require("./auto-packages");

const lot = (lotNumber, linkedSystem, commercialFamily = null, subfamily = null, withdrawn = false) => ({
  lotNumber,
  linkedSystem,
  commercialFamily,
  subfamily,
  withdrawn
});

test("group values: trimmed, single spaces, case-insensitive key", () => {
  assert.equal(cleanGroupValue("  Rotary   Kiln "), "Rotary Kiln");
  assert.equal(cleanGroupValue("   "), null);
  assert.equal(groupKey("Motors"), groupKey(" motors "));
});

test("lot numbers sort naturally", () => {
  assert.deepEqual(["10", "2", "10A", "1"].sort(compareLotNumbers), ["1", "2", "10", "10A"]);
});

test("first import creates one package per value of each level", () => {
  const plan = planAutoPackages(
    [lot("3", "Kiln", "Motors"), lot("1", "Kiln", "Valves"), lot("2", "Conveyor", "motors "), lot("4", "Conveyor", null, "Small motors")],
    []
  );
  assert.deepEqual(
    plan.create.map((c) => [c.source, c.sourceValue, c.lotNumbers]),
    [
      ["linked_system", "Conveyor", ["2", "4"]],
      ["linked_system", "Kiln", ["1", "3"]],
      // "motors " e "Motors" são o mesmo grupo; o nome vem do primeiro lote na ordem natural.
      ["family", "motors", ["2", "3"]],
      ["family", "Valves", ["1"]],
      ["subfamily", "Small motors", ["4"]]
    ]
  );
  assert.deepEqual(plan.update, []);
});

test("re-import adds and removes lots of existing packages, matching the value case-insensitively", () => {
  const plan = planAutoPackages(
    [lot("1", "Kiln", "Motors"), lot("2", "Kiln", null), lot("3", "Dryer", "Motors")],
    [
      { id: "pk", source: "linked_system", sourceValue: "KILN", lotNumbers: ["1", "3"] },
      { id: "pm", source: "family", sourceValue: "Motors", lotNumbers: ["1", "3"] }
    ]
  );
  assert.deepEqual(plan.update, [{ packageId: "pk", source: "linked_system", sourceValue: "KILN", add: ["2"], remove: ["3"], lotNumbers: ["1", "2"] }]);
  assert.equal(plan.unchanged, 1);
  assert.deepEqual(plan.create.map((c) => c.sourceValue), ["Dryer"]);
});

test("a value that left the sheet empties its package (never deletes it)", () => {
  const plan = planAutoPackages([lot("1", "Kiln")], [{ id: "old", source: "family", sourceValue: "Cables", lotNumbers: ["1"] }]);
  assert.deepEqual(plan.emptied, [{ packageId: "old", source: "family", sourceValue: "Cables" }]);
  assert.deepEqual(plan.update[0].lotNumbers, []);
});

test("withdrawn lots leave the automatic packages", () => {
  const plan = planAutoPackages(
    [lot("1", "Kiln"), lot("2", "Kiln", null, null, true)],
    [{ id: "pk", source: "linked_system", sourceValue: "Kiln", lotNumbers: ["1", "2"] }]
  );
  assert.deepEqual(plan.update[0].remove, ["2"]);
});

test("the same value on two levels makes two packages", () => {
  const plan = planAutoPackages([lot("1", "Steel Structure", "Steel Structure")], []);
  assert.deepEqual(plan.create.map((c) => c.source), ["linked_system", "family"]);
});
