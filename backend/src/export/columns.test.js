"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const XLSX = require("xlsx");
const { LINE_COLUMNS, PACKAGE_COLUMNS, IMPORT_COLUMNS } = require("./columns");
const { LANGS } = require("./labels");
const { buildWorkbook, toBuffer, fileName, treeOrder } = require("./workbook");
const sheet = require("../import/spreadsheet");

// Dados fictícios.
const pkg = {
  id: "p1",
  number: 12,
  name: "Sample Crushers",
  type: "equipment",
  category: "process_equipment",
  origin: { name: "Sample Origin", code: "SMP" },
  locations: ["uberaba", "to_be_confirmed"],
  status: "under_negotiation",
  storNumbers: [7, 8],
  storFolder: "7-8 Sample Folder",
  storDocuments: ["1000001", "1000002"],
  storDocumentsPending: ["1000002"],
  lineCount: 3,
  attachmentCount: 2,
  description: "=1+1 is text, not a formula",
  updatedAt: "2026-11-19T10:00:00Z",
  lines: [
    { id: "a", parentLineId: null, itemNo: "1", description: "Jaw crusher", quantity: "1.0000", unit: "SET", storCode: "S-0", tag: "C-01", warehouseLocation: null },
    { id: "c", parentLineId: null, itemNo: "2", description: "Spare liner", quantity: "1250.5000", unit: "KG", storCode: null, tag: "T2", warehouseLocation: null },
    { id: "b", parentLineId: "a", itemNo: "1.1", description: "Motor", quantity: "1.0000", unit: "PC", storCode: "S-1", tag: null, warehouseLocation: "A-1" }
  ]
};

const read = (wb) => XLSX.read(toBuffer(wb), { type: "buffer", cellDates: true, cellStyles: true });

test("every column has a label in every language and a known type", () => {
  for (const c of [...LINE_COLUMNS, ...PACKAGE_COLUMNS]) {
    for (const lang of LANGS) assert.ok(c.label[lang], `${c.key} label ${lang}`);
    assert.ok(["string", "number", "date"].includes(c.type), c.key);
  }
  assert.equal(new Set(LINE_COLUMNS.map((c) => c.key)).size, LINE_COLUMNS.length);
  assert.equal(new Set(PACKAGE_COLUMNS.map((c) => c.key)).size, PACKAGE_COLUMNS.length);
});

test("importer fields come from the column registry", () => {
  assert.deepEqual(sheet.MAPPABLE_FIELDS, IMPORT_COLUMNS.map((c) => c.key));
  assert.deepEqual(sheet.REQUIRED_FIELDS, ["itemNo", "description", "quantity", "unit"]);
});

// Ida e volta: o cabeçalho exportado, em qualquer idioma, é mapeado sozinho pelo importador para o campo certo, e
// as colunas que não são de item (pacote) não são tomadas por nenhum campo.
for (const lang of LANGS) {
  test(`exported item headers map back to every importable field (${lang})`, () => {
    const wb = read(buildWorkbook([pkg], { lang, baseUrl: "https://example.test" }));
    const name = sheet.defaultSheet(wb.SheetNames);
    assert.equal(name, wb.SheetNames[1], "importer opens the items sheet, not the first one");
    const { rows } = sheet.sheetRows(wb, name);
    assert.equal(sheet.detectHeaderRow(rows), 0);
    const mapping = sheet.suggestMapping(rows[0]);
    for (const c of LINE_COLUMNS) {
      const idx = LINE_COLUMNS.indexOf(c);
      if (c.import) assert.equal(mapping[c.key], idx, `${c.key} (${lang})`);
      else assert.ok(!Object.values(mapping).includes(idx), `${c.key} must not be mapped (${lang})`);
    }
  });
}

test("items sheet: children under their parent, outline level, numbers as numbers", () => {
  const wb = read(buildWorkbook([pkg], { lang: "pt", baseUrl: "https://example.test" }));
  assert.deepEqual(wb.SheetNames, ["Pacotes", "Itens"]);
  const rows = XLSX.utils.sheet_to_json(wb.Sheets.Itens, { header: 1 });
  assert.deepEqual(rows[0].slice(0, 4), ["ID do pacote", "Pacote", "Item", "Descrição"]);
  assert.deepEqual(rows.slice(1).map((r) => r[2]), ["1", "1.1", "2"]);
  assert.equal(rows[1][0], 12);
  assert.equal(rows[3][4], 1250.5);
  const levels = (wb.Sheets.Itens["!rows"] || []).map((r) => r?.level || 0);
  assert.equal(levels[2], 1, "1.1 is grouped under 1");
});

test("packages sheet: translated values, pending marked, text never a formula", () => {
  const wb = read(buildWorkbook([pkg], { lang: "pt", baseUrl: "https://example.test/" }));
  const [header, row] = XLSX.utils.sheet_to_json(wb.Sheets.Pacotes, { header: 1 });
  const col = (label) => row[header.indexOf(label)];
  assert.equal(col("ID"), 12);
  assert.equal(col("Tipo"), "Equipamento");
  assert.equal(col("Situação"), "Em negociação");
  assert.equal(col("Locais"), "Uberaba; A confirmar");
  assert.equal(col("Ativos"), "7, 8");
  assert.equal(col("Doc."), "1000001, 1000002 (pendente)");
  assert.equal(col("Página pública"), "https://example.test/packages/12");
  const descCell = Object.entries(wb.Sheets.Pacotes).find(([, v]) => v && v.v === pkg.description)[1];
  assert.equal(descCell.t, "s");
  assert.equal(descCell.f, undefined);
  assert.ok(!header.some((h) => /price|preço|valor|value/i.test(h)));
});

test("tree order keeps every line, even with a broken parent", () => {
  const lines = [
    { id: "x", parentLineId: "missing", itemNo: "9" },
    { id: "y", parentLineId: "z", itemNo: "8.1" },
    { id: "z", parentLineId: "y", itemNo: "8" }
  ];
  assert.equal(treeOrder(lines).length, 3);
});

test("default sheet: items sheet of an exported file, otherwise the first", () => {
  assert.equal(sheet.defaultSheet(["Packages", "Items"]), "Items");
  assert.equal(sheet.defaultSheet(["Pacotes", "Itens"]), "Itens");
  assert.equal(sheet.defaultSheet(["Lista", "Resumo"]), "Lista");
});

test("file name has only the ID and the date", () => {
  const date = new Date("2026-11-19T12:00:00Z");
  assert.equal(fileName({ number: 12, lang: "pt", date }), "minerecycle-pacote-12-2026-11-19.xlsx");
  assert.equal(fileName({ lang: "en", date }), "minerecycle-packages-2026-11-19.xlsx");
});
