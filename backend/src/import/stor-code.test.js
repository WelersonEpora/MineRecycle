"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { isStorDocumentCode, storCodeFromFileName } = require("./stor-code");

test("STOR document code from the downloaded file name", () => {
  assert.equal(storCodeFromFileName("1809601_REV0_VER0_Lista de materiais.xlsx"), "1809601");
  assert.equal(storCodeFromFileName(String.raw`C:\Downloads\1809438 lista.xlsx`), "1809438");
  assert.equal(storCodeFromFileName("1809438.xlsx"), "1809438");
  assert.equal(storCodeFromFileName("lista.xlsx"), null);
  assert.equal(storCodeFromFileName("18096011_x.xlsx"), null);
  assert.equal(storCodeFromFileName("2024-06 lista.xlsx"), null);
  assert.equal(storCodeFromFileName(undefined), null);
});

test("STOR document code format", () => {
  assert.ok(isStorDocumentCode("1809601"));
  assert.ok(!isStorDocumentCode("180960"));
  assert.ok(!isStorDocumentCode("18096O1"));
  assert.ok(!isStorDocumentCode(1809601));
});
