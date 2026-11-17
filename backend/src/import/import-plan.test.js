"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const XLSX = require("xlsx");
const sheet = require("./spreadsheet");
const { buildImportPlan, validateMapping, insertionOrder } = require("./import-plan");

// Planilha no formato da lista de material elétrico do cliente: título antes do cabeçalho e as colunas
// Item, Qtde, U.M, Descrição dos Materiais. Conteúdo fictício.
function sampleWorkbook() {
  const aoa = [
    ["LISTA DE MATERIAL ELÉTRICO", null, null, null],
    [null, null, null, null],
    ["Item", "Qtde", "U.M", "Descrição dos Materiais"],
    [1, 10, "pç", "Disjuntor tripolar 100 A"],
    [2, "12,5", "MT", "Cabo de cobre 4 mm²"],
    [null, null, null, null],
    [3, 1, "CJ", "Kit de painel"],
    ["3.1", 2, "UN", "Porta do painel"],
    ["3.2", 4, "PEÇ", "Dobradiça"],
    [4, "abc", "UN", "Quantidade inválida"],
    [2, 1, "UN", "Item repetido"],
    [5, 3, "bobina", "Unidade desconhecida"],
    [null, 2, "UN", "Sem número"]
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), "Lista");
  return XLSX.read(XLSX.write(wb, { type: "buffer", bookType: "xlsx" }), { type: "buffer" });
}

function prepared() {
  const wb = sampleWorkbook();
  const { rows, firstRowNumber } = sheet.sheetRows(wb, "Lista");
  const headerRowIndex = sheet.detectHeaderRow(rows);
  const mapping = sheet.suggestMapping(rows[headerRowIndex]);
  return { rows, firstRowNumber, headerRowIndex, mapping };
}

test("detects the header row after title rows and suggests the mapping", () => {
  const { headerRowIndex, mapping, firstRowNumber } = prepared();
  assert.equal(firstRowNumber + headerRowIndex, 3);
  assert.equal(mapping.itemNo, 0);
  assert.equal(mapping.quantity, 1);
  assert.equal(mapping.unit, 2);
  assert.equal(mapping.description, 3);
  assert.equal(mapping.storCode, null);
});

test("builds lines, normalizes units and reports errors with Excel row numbers", () => {
  const { rows, firstRowNumber, headerRowIndex, mapping } = prepared();
  const plan = buildImportPlan(rows, { headerRowIndex, firstRowNumber, mapping, inferHierarchy: true });

  assert.deepEqual(
    plan.lines.map((l) => [l.itemNo, l.quantity, l.unit]),
    [
      ["1", "10", "PC"],
      ["2", "12.5", "M"],
      ["3", "1", "SET"],
      ["3.1", "2", "PC"],
      ["3.2", "4", "PC"],
      ["5", "3", "BOBINA"]
    ]
  );
  assert.equal(plan.lines[1].unitRaw, "MT");
  assert.equal(plan.lines[0].sourceRow, 4);

  const errors = plan.errors.map((e) => [e.row, e.code]);
  assert.deepEqual(errors, [
    [10, "quantity_invalid"],
    [11, "item_no_duplicate"],
    [13, "item_no_missing"]
  ]);
  assert.ok(plan.warnings.some((w) => w.code === "unit_unknown" && w.row === 12));
  assert.deepEqual(plan.stats.unknownUnits, { bobina: 1 });
  assert.equal(plan.stats.skippedEmpty, 1);
  assert.equal(plan.stats.validRows, 6);
  assert.equal(plan.stats.invalidRows, 3);
});

test("infers kit hierarchy from item numbering", () => {
  const { rows, firstRowNumber, headerRowIndex, mapping } = prepared();
  const plan = buildImportPlan(rows, { headerRowIndex, firstRowNumber, mapping, inferHierarchy: true });
  const byItem = Object.fromEntries(plan.lines.map((l) => [l.itemNo, l]));
  assert.equal(byItem["3.1"].parentItemNo, "3");
  assert.equal(byItem["3.2"].parentItemNo, "3");
  assert.equal(byItem["3"].parentItemNo, null);
  assert.equal(plan.stats.childLines, 2);

  const flat = buildImportPlan(rows, { headerRowIndex, firstRowNumber, mapping, inferHierarchy: false });
  assert.ok(flat.lines.every((l) => l.parentItemNo === null));
});

test("insertion order puts parents before children", () => {
  const order = insertionOrder([
    { itemNo: "1.1", sortOrder: 1 },
    { itemNo: "1", sortOrder: 2 },
    { itemNo: "1.1.1", sortOrder: 3 }
  ]).map((l) => l.itemNo);
  assert.deepEqual(order, ["1", "1.1", "1.1.1"]);
});

test("mapping validation", () => {
  assert.deepEqual(validateMapping({ itemNo: 0, description: 1, quantity: 2, unit: 3 }, 4), []);
  const missing = validateMapping({ itemNo: 0, description: 1, quantity: null, unit: 3 }, 4);
  assert.deepEqual(missing, [{ field: "quantity", code: "required" }]);
  const dup = validateMapping({ itemNo: 0, description: 0, quantity: 2, unit: 3 }, 4);
  assert.equal(dup[0].code, "duplicate_column");
  const out = validateMapping({ itemNo: 0, description: 1, quantity: 2, unit: 9 }, 4);
  assert.equal(out[0].code, "invalid_column");
});

test("numberRows: item number comes from row order when the sheet has no item column", () => {
  // Planilha fictícia sem nº do item; o código se repete entre linhas.
  const rows = [
    ["Local", "Descrição", "Código", "Und", "Qtd total"],
    ["Box A", "Tijolo X", "111", "KG", 1000],
    [],
    ["Box B", "Tijolo X", "111", "KG", 500],
    ["Box C", "Tijolo Y", "222", "KG", "abc"],
    ["Box D", "Tijolo Z", "333", "KG", 250]
  ];
  const mapping = { itemNo: 2, description: 1, quantity: 4, unit: 3, storCode: 2, tag: null, warehouseLocation: 0 };
  const plan = buildImportPlan(rows, { headerRowIndex: 0, mapping, inferHierarchy: true, numberRows: true });
  assert.deepEqual(
    plan.lines.map((l) => [l.itemNo, l.storCode, l.quantity]),
    [
      ["1", "111", "1000"],
      ["2", "111", "500"],
      ["4", "333", "250"]
    ]
  );
  assert.deepEqual(plan.errors.map((e) => e.code), ["quantity_invalid"]);
  assert.equal(plan.stats.childLines, 0);
});

test("mapping validation with numberRows ignores the item column", () => {
  assert.deepEqual(validateMapping({ itemNo: null, description: 1, quantity: 2, unit: 3 }, 4, { numberRows: true }), []);
  assert.deepEqual(validateMapping({ itemNo: 1, description: 1, quantity: 2, unit: 3 }, 4, { numberRows: true }), []);
  assert.deepEqual(validateMapping({ itemNo: null, description: 1, quantity: 2, unit: 3 }, 4), [{ field: "itemNo", code: "required" }]);
});
