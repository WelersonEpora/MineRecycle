"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { isResetPhrase, RESET_TABLES } = require("./data-reset");

test("reset phrase: exact text in English or Portuguese", () => {
  assert.equal(isResetPhrase("DELETE ALL"), true);
  assert.equal(isResetPhrase("APAGAR TUDO"), true);
  assert.equal(isResetPhrase("  APAGAR TUDO "), true);
});

test("reset phrase: anything else is refused", () => {
  for (const v of ["apagar tudo", "Delete all", "APAGAR", "", null, undefined, 1, ["APAGAR TUDO"]]) assert.equal(isResetPhrase(v), false);
});

test("reset keeps users, settings and origins", () => {
  for (const kept of ["app_user", "setting", "origin"]) assert.equal(RESET_TABLES.includes(kept), false);
  for (const gone of ["lot", "package", "attachment", "inquiry", "access_link"]) assert.equal(RESET_TABLES.includes(gone), true);
});
