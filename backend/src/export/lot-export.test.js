"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const XLSX = require("xlsx");
const { buildLotWorkbook, lotExportFileName } = require("./lot-export");
const { readWorkbook, defaultLotSheet, readLotSheet } = require("../import/lot-sheet");
const { buildLotImportPlan } = require("../import/lot-plan");

// Lotes fictícios como o banco os tem.
const LOTS = [
  {
    id: "a",
    lotNumber: "010",
    siteName: "Site A",
    title: "Fictitious pump",
    masterSupplier: "Acme",
    linkedSystem: "Water",
    commercialFamily: "Pumps",
    subfamily: null,
    sheetStatus: "available",
    soldBySheet: false,
    status: "sold",
    saleCount: 1,
    description: "Checked on site",
    packages: [{ number: 3, name: "Water" }, { number: 9, name: "Pump set" }],
    attachmentCount: 2
  },
  {
    id: "b",
    lotNumber: "2",
    siteName: "Site B",
    title: "Fictitious crane",
    masterSupplier: null,
    linkedSystem: null,
    commercialFamily: "Cranes",
    subfamily: "Overhead",
    sheetStatus: "sold",
    soldBySheet: true,
    status: "sold",
    saleCount: 0,
    description: null,
    packages: [],
    attachmentCount: 0
  },
  {
    id: "c",
    lotNumber: "3",
    siteName: "Site B",
    title: "Fictitious truck",
    masterSupplier: "Beta",
    linkedSystem: "Fleet",
    commercialFamily: null,
    subfamily: null,
    sheetStatus: "unavailable",
    soldBySheet: false,
    status: "unavailable",
    saleCount: 0,
    description: null,
    packages: [],
    attachmentCount: 0
  }
];

const rowsOf = (buffer) => {
  const wb = XLSX.read(buffer, { type: "buffer" });
  return { names: wb.SheetNames, rows: XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: "" }) };
};

test("one sheet in the import format, natural lot order, extra columns after", () => {
  const { names, rows } = rowsOf(buildLotWorkbook(LOTS, { lang: "pt" }));
  assert.deepEqual(names, ["Matriz de lotes"]);
  assert.deepEqual(rows[0], [
    "Lot Number",
    "Site Name",
    "Title / Equipment Description",
    "Master Supplier",
    "Equipamento ou sistema vinculado",
    "Família comercial",
    "Subfamília",
    "STATUS",
    "Situação no sistema",
    "Pacotes",
    "Descrição do vendedor",
    "Arquivos"
  ]);
  assert.deepEqual(rows.slice(1).map((r) => r[0]), ["2", "3", "010"]);
  const pump = rows[3];
  // Vendido por pacote: STATUS fica como a planilha disse; a situação do sistema vai na coluna extra.
  assert.equal(pump[7], "");
  assert.equal(pump[8], "Vendido");
  assert.equal(pump[9], "#3 Water; #9 Pump set");
  assert.equal(pump[10], "Checked on site");
  assert.equal(rows[1][7], "Sold");
  assert.equal(rows[2][7], "Collected by court officer");
  assert.ok(!rows[0].some((h) => /price|preço|valor|value/i.test(h)));
});

test("importing the export back changes nothing", () => {
  const workbook = readWorkbook(buildLotWorkbook(LOTS, { lang: "en" }));
  const sheet = readLotSheet(workbook, defaultLotSheet(workbook.SheetNames));
  assert.deepEqual(sheet.missing, []);
  const autoPackages = [
    { id: "p1", source: "linked_system", sourceValue: "Water", lotNumbers: ["010"] },
    { id: "p2", source: "linked_system", sourceValue: "Fleet", lotNumbers: ["3"] },
    { id: "p3", source: "family", sourceValue: "Pumps", lotNumbers: ["010"] },
    { id: "p4", source: "family", sourceValue: "Cranes", lotNumbers: ["2"] },
    { id: "p5", source: "subfamily", sourceValue: "Overhead", lotNumbers: ["2"] }
  ];
  const plan = buildLotImportPlan({ sheet, existingLots: LOTS, autoPackages, fileHash: "x" });
  assert.deepEqual(plan.errors, []);
  assert.equal(plan.summary.created, 0);
  assert.equal(plan.summary.updated, 0);
  assert.equal(plan.summary.withdrawn, 0);
  assert.equal(plan.summary.packagesCreated, 0);
  assert.equal(plan.summary.packagesUpdated, 0);
});

test("file name uses the Brazil date", () => {
  assert.equal(lotExportFileName(new Date("2026-11-20T01:30:00Z"), "pt"), "MineRecycle - Lotes - 2026-11-19.xlsx");
  assert.equal(lotExportFileName(new Date("2026-11-20T12:00:00Z"), "en"), "MineRecycle - Lots - 2026-11-20.xlsx");
});
