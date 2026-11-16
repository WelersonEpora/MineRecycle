"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { parseQuantity } = require("./quantity");

test("numeric cells", () => {
  assert.deepEqual(parseQuantity(12), { value: "12" });
  assert.deepEqual(parseQuantity(0.5), { value: "0.5" });
  assert.deepEqual(parseQuantity(1234.25), { value: "1234.25" });
});

test("fractional quantities with more than 4 decimals are rounded and flagged", () => {
  assert.deepEqual(parseQuantity(1.123456), { value: "1.1235", warning: "quantity_rounded" });
});

test("Brazilian text format", () => {
  assert.equal(parseQuantity("12,5").value, "12.5");
  assert.equal(parseQuantity("1.234,56").value, "1234.56");
  assert.equal(parseQuantity(" 3 ").value, "3");
});

test("English text format with both separators", () => {
  assert.equal(parseQuantity("1,234.5").value, "1234.5");
});

test("ambiguous thousands are read Brazilian-style and flagged", () => {
  assert.deepEqual(parseQuantity("1.500"), { value: "1500", warning: "quantity_ambiguous" });
  assert.deepEqual(parseQuantity("1,500"), { value: "1.5", warning: "quantity_ambiguous" });
});

test("simple decimal point", () => {
  assert.deepEqual(parseQuantity("2.75"), { value: "2.75" });
});

test("empty is null without error", () => {
  assert.deepEqual(parseQuantity(null), { value: null });
  assert.deepEqual(parseQuantity(""), { value: null });
});

test("invalid values", () => {
  assert.equal(parseQuantity("abc").error, "quantity_invalid");
  assert.equal(parseQuantity("12 pç").error, "quantity_invalid");
  assert.equal(parseQuantity("1.2.3").error, "quantity_invalid");
  assert.equal(parseQuantity(-3).error, "quantity_negative");
  assert.equal(parseQuantity(Number.NaN).error, "quantity_invalid");
});
