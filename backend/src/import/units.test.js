"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { normalizeUnit } = require("./units");

test("piece variants become PC", () => {
  for (const raw of ["UN", "un", "Und.", "pç", "PÇ", "PEÇ", "peça", "Peças", "PC", "pcs"]) {
    assert.equal(normalizeUnit(raw).unit, "PC", raw);
    assert.equal(normalizeUnit(raw).known, true, raw);
  }
});

test("metre variants become M; square and cubic metres are kept apart", () => {
  for (const raw of ["MT", "m", "M", "mts", "Metro"]) assert.equal(normalizeUnit(raw).unit, "M", raw);
  assert.equal(normalizeUnit("m²").unit, "M2");
  assert.equal(normalizeUnit("M2").unit, "M2");
  assert.equal(normalizeUnit("m³").unit, "M3");
});

test("other common units", () => {
  assert.equal(normalizeUnit("kg").unit, "KG");
  assert.equal(normalizeUnit("TON").unit, "T");
  assert.equal(normalizeUnit("CJ").unit, "SET");
  assert.equal(normalizeUnit("Jogo").unit, "SET");
  assert.equal(normalizeUnit("RL").unit, "ROLL");
  assert.equal(normalizeUnit("cx").unit, "BOX");
  assert.equal(normalizeUnit("lote").unit, "LOT");
});

test("keeps the raw value", () => {
  assert.deepEqual(normalizeUnit(" pç "), { unit: "PC", raw: "pç", known: true });
});

test("unknown unit is upper-cased and flagged", () => {
  assert.deepEqual(normalizeUnit("bobina x"), { unit: "BOBINAX", raw: "bobina x", known: false });
});

test("empty unit", () => {
  assert.deepEqual(normalizeUnit(null), { unit: null, raw: null, known: false });
  assert.deepEqual(normalizeUnit("  "), { unit: null, raw: null, known: false });
});
