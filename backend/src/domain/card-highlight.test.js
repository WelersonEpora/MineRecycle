"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { cardHighlight } = require("./card-highlight");

test("no items: no highlight", () => {
  assert.equal(cardHighlight({ type: "bulk", lineCount: 0 }), null);
});

test("equipment shows units of main items, else item count", () => {
  assert.deepEqual(cardHighlight({ type: "equipment", lineCount: 13, unitCount: 4 }), { kind: "units", value: 4 });
  assert.deepEqual(cardHighlight({ type: "equipment", lineCount: 5, unitCount: 0 }), { kind: "items", value: 5 });
});

test("bulk shows total weight only when every item is in kg or t", () => {
  assert.deepEqual(cardHighlight({ type: "bulk", lineCount: 3, weightLineCount: 3, totalWeightT: 184.25 }), { kind: "weight", value: 184.25 });
  assert.deepEqual(cardHighlight({ type: "bulk", lineCount: 3, weightLineCount: 2, totalWeightT: 10 }), { kind: "items", value: 3 });
  assert.deepEqual(cardHighlight({ type: "bulk", lineCount: 2, weightLineCount: 2, totalWeightT: 0 }), { kind: "items", value: 2 });
});

test("values from the database may arrive as strings", () => {
  assert.deepEqual(cardHighlight({ type: "bulk", lineCount: "2", weightLineCount: "2", totalWeightT: "0.5004" }), { kind: "weight", value: 0.5 });
});
