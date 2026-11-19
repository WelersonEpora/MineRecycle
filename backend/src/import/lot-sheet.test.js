"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const XLSX = require("xlsx");
const { readWorkbook, defaultLotSheet, readLotSheet } = require("./lot-sheet");

// Planilha fictícia no formato da "Matriz de lotes": título e notas antes do cabeçalho, colunas que não importam
// (inclusive preço) e nomes repetidos.
const HEADER = [
  null,
  "Lot Number",
  "Site Name",
  "Country",
  "Subpackage",
  "Title / Equipment Description",
  "Master Supplier",
  "Asking Price Euro",
  "Asking Price USD",
  "Subpackage",
  "STATUS",
  "Equipamento ou sistema vinculado",
  "Família comercial",
  "Subfamília"
];

function workbook({ header = HEADER, rows }) {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["Cover"]]), "Cover");
  const aoa = [[], ["Sample | lot matrix"], ["Notes about the matrix"], [], header, ...rows];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), "Matriz de lotes");
  return readWorkbook(XLSX.write(wb, { type: "buffer", bookType: "xlsx" }));
}

const row = (lot, title, extra = {}) => {
  const r = [null, lot, "Site A", "Nowhere", "x", title, "Acme", 1000, 1100, "y", extra.status ?? null, extra.system ?? "Kiln", extra.family ?? null, null];
  return r;
};

test("opens the lot matrix sheet by default", () => {
  assert.equal(defaultLotSheet(["Cover", "Admin", "Matriz de lotes", "Planilha1"]), "Matriz de lotes");
  assert.equal(defaultLotSheet(["Lots", "Other"]), "Lots");
  assert.equal(defaultLotSheet(["Sheet1", "Sheet2"]), "Sheet1");
});

test("finds the header below title rows and reads only the known columns", () => {
  const wb = workbook({ rows: [row(123456, " Motor  10 kW "), row("AB1-234", "Valve", { status: "Sold", family: "Valves" })] });
  const sheet = readLotSheet(wb, "Matriz de lotes");
  assert.equal(sheet.headerRow, 5);
  assert.deepEqual(sheet.missing, []);
  assert.equal(sheet.rows.length, 2);
  assert.equal(sheet.rows[0].rowNumber, 6);
  // Nº do lote numérico no Excel vira texto, sem ".0".
  assert.equal(sheet.rows[0].values.lotNumber, "123456");
  assert.equal(sheet.rows[1].values.status, "Sold");
  assert.equal(sheet.rows[1].values.commercialFamily, "Valves");
  // Nenhum valor de preço é lido.
  const read = JSON.stringify(sheet.rows);
  assert.ok(!read.includes("1000") && !read.includes("1100"));
  assert.deepEqual(Object.keys(sheet.rows[0].values).sort(), ["commercialFamily", "linkedSystem", "lotNumber", "masterSupplier", "siteName", "status", "subfamily", "title"]);
});

test("skips blank rows and keeps Excel row numbers", () => {
  const wb = workbook({ rows: [row("1", "A"), [], row("2", "B")] });
  const sheet = readLotSheet(wb, "Matriz de lotes");
  assert.deepEqual(sheet.rows.map((r) => r.rowNumber), [6, 8]);
});

test("reports missing columns", () => {
  const header = HEADER.map((h) => (h === "Subfamília" ? "Something else" : h));
  const sheet = readLotSheet(workbook({ header, rows: [row("1", "A")] }), "Matriz de lotes");
  assert.deepEqual(sheet.missing, ["subfamily"]);
});

test("a sheet without a lot number column has no header", () => {
  const sheet = readLotSheet(workbook({ header: ["A", "B", "C"], rows: [["1", "2", "3"]] }), "Matriz de lotes");
  assert.equal(sheet.headerRow, null);
  assert.equal(sheet.missing.length, 8);
});

test("unreadable files return null", () => {
  assert.equal(readWorkbook(Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x00])), null);
});
