"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const XLSX = require("xlsx");
const { buildWorkbook, toBuffer } = require("../export/workbook");
const { planPackageImport } = require("./package-plan");

// Dados fictícios.
const ORIGINS = [
  { id: "o1", name: "Sample Origin", code: "SMP", active: true },
  { id: "o2", name: "Old Origin", code: "OLD", active: false }
];
const UPDATED = new Date("2026-11-19T10:00:00Z");

function samplePackages() {
  return [
    {
      id: "p1",
      number: 1,
      name: "Sample Crushers",
      type: "equipment",
      category: "process_equipment",
      originId: "o1",
      origin: { name: "Sample Origin", code: "SMP" },
      locations: ["uberaba"],
      status: "active",
      storNumbers: [7, 8],
      storFolder: "7-8 Sample",
      storDocuments: ["1000001"],
      storDocumentsPending: [],
      description: "Line one\nLine two",
      updatedAt: UPDATED,
      lineCount: 3,
      attachmentCount: 0,
      lines: [
        { itemNo: "1", parentItemNo: null, description: "Jaw crusher", quantity: 1, unit: "SET", storCode: "S-0", tag: "C-01", warehouseLocation: null, attachmentCount: 0 },
        { itemNo: "1.1", parentItemNo: "1", description: "Motor", quantity: 1, unit: "PC", storCode: null, tag: null, warehouseLocation: "A-1", attachmentCount: 2 },
        { itemNo: "2", parentItemNo: null, description: "Spare liner", quantity: 1250.5, unit: "KG", storCode: null, tag: null, warehouseLocation: null, attachmentCount: 0 }
      ]
    },
    {
      id: "p2",
      number: 2,
      name: "Sample Cables",
      type: "bulk",
      category: "electrical",
      originId: "o1",
      origin: { name: "Sample Origin", code: "SMP" },
      locations: ["niquelandia", "to_be_confirmed"],
      status: "sold",
      storNumbers: [],
      storFolder: null,
      storDocuments: [],
      storDocumentsPending: [],
      description: null,
      updatedAt: UPDATED,
      lineCount: 1,
      attachmentCount: 0,
      lines: [{ itemNo: "1", parentItemNo: null, description: "Cable", quantity: 300, unit: "M", storCode: null, tag: null, warehouseLocation: null, attachmentCount: 0 }]
    }
  ];
}

// Exporta (como o sistema faz) e devolve as abas como matrizes para o teste alterar.
function exported(packages = samplePackages(), lang = "pt") {
  const forExport = packages.map((p) => ({ ...p, lines: p.lines.map((l, i) => ({ ...l, id: `${p.id}-${l.itemNo}`, parentLineId: l.parentItemNo ? `${p.id}-${l.parentItemNo}` : null, sortOrder: i })) }));
  const wb = XLSX.read(toBuffer(buildWorkbook(forExport, { lang, baseUrl: "https://example.test" })), { type: "buffer", cellDates: true });
  return Object.fromEntries(wb.SheetNames.map((n) => [n, XLSX.utils.sheet_to_json(wb.Sheets[n], { header: 1, defval: null })]));
}

// Matrizes -> planilha lida como o serviço lê (cellDates e cellStyles). hidden: { aba: [índices de linha] }.
function workbook(sheets, { hidden = {} } = {}) {
  const wb = XLSX.utils.book_new();
  for (const [name, aoa] of Object.entries(sheets)) {
    const ws = XLSX.utils.aoa_to_sheet(aoa, { cellDates: true });
    if (hidden[name]) ws["!rows"] = aoa.map((_, i) => (hidden[name].includes(i) ? { hidden: true } : {}));
    XLSX.utils.book_append_sheet(wb, ws, name);
  }
  return XLSX.read(XLSX.write(wb, { type: "buffer", bookType: "xlsx" }), { type: "buffer", cellDates: true, cellStyles: true });
}

const state = (packages = samplePackages()) => ({ packages, origins: ORIGINS });
const plan = (sheets, opts = {}, st = state()) => planPackageImport(workbook(sheets, opts), st, opts);
const codes = (p, level) => p.issues.filter((i) => !level || i.level === level).map((i) => i.code);
const col = (aoa, label) => aoa[0].indexOf(label);

test("re-importing an untouched export changes nothing", () => {
  for (const lang of ["pt", "en"]) {
    const p = plan(exported(undefined, lang));
    assert.deepEqual(codes(p, "error"), [], lang);
    assert.deepEqual(codes(p, "confirm"), [], lang);
    assert.equal(p.canImport, true);
    assert.deepEqual(p.packages.map((x) => x.action), ["unchanged", "unchanged"], lang);
  }
});

test("edited fields and items become an update, with what changed", () => {
  const s = exported();
  s.Pacotes[1][col(s.Pacotes, "Nome público")] = "Sample Crushers (revised)";
  s.Pacotes[1][col(s.Pacotes, "Locais")] = "Uberaba; Niquelândia";
  s.Itens[3][col(s.Itens, "Qtde")] = 1300;
  const p = plan(s);
  const crushers = p.packages[0];
  assert.equal(crushers.action, "update");
  assert.deepEqual(
    crushers.changes.map((c) => c.field),
    ["name", "locations"]
  );
  assert.deepEqual(crushers.changes[1].to, ["uberaba", "niquelandia"]);
  assert.equal(crushers.items.changed, 1);
  assert.equal(p.packages[1].action, "unchanged");
});

test("a row without ID creates a package; its items follow by name", () => {
  const s = exported();
  const row = [...s.Pacotes[1]];
  row[col(s.Pacotes, "ID")] = null;
  row[col(s.Pacotes, "Nome público")] = "Sample New";
  row[col(s.Pacotes, "Pasta STOR")] = null;
  s.Pacotes.push(row);
  const item = [...s.Itens[1]];
  item[col(s.Itens, "ID do pacote")] = null;
  item[col(s.Itens, "Pacote")] = "sample new";
  s.Itens.push(item);
  const p = plan(s);
  assert.deepEqual(codes(p, "error"), []);
  const created = p.packages.find((x) => x.isNew);
  assert.equal(created.action, "create");
  assert.equal(created.data.name, "Sample New");
  assert.equal(created.data.originId, "o1");
  assert.equal(created.lines.length, 1);
});

test("blocking problems: unknown ID, invalid value, unknown origin, missing sheet or column", () => {
  const s = exported();
  s.Pacotes[1][col(s.Pacotes, "ID")] = 99;
  s.Pacotes[2][col(s.Pacotes, "Tipo")] = "Granel?";
  let p = plan(s);
  // Cada linha de item de um pacote recusado também é apontada.
  assert.deepEqual([...new Set(codes(p, "error"))].sort(), ["field_invalid", "item_package_not_in_file", "package_id_unknown"]);
  assert.equal(p.canImport, false);
  assert.equal(p.issues.find((i) => i.code === "field_invalid").field, "type");

  const o = exported();
  o.Pacotes[1][col(o.Pacotes, "Origem")] = "Nowhere";
  assert.ok(codes(plan(o), "error").includes("origin_unknown"));
  o.Pacotes[1][col(o.Pacotes, "Origem")] = "OLD";
  assert.ok(codes(plan(o), "error").includes("origin_inactive"));

  assert.deepEqual(codes(plan({ Lista: [["a"]] }), "error"), ["no_packages_sheet"]);
  const n = exported();
  n.Itens = n.Itens.map((r) => r.filter((_, i) => i !== col(n.Itens, "Descrição")));
  assert.ok(codes(plan(n), "error").includes("missing_column"));
});

test("without the Items sheet only package data is imported", () => {
  const s = exported();
  delete s.Itens;
  s.Pacotes[1][col(s.Pacotes, "Nome público")] = "Renamed";
  const p = plan(s);
  assert.ok(codes(p, "info").includes("no_items_sheet"));
  assert.equal(p.packages[0].action, "update");
  assert.equal(p.packages[0].lines, null);
});

test("confirmations: items removed, new package without items, attachments, sold package", () => {
  const s = exported();
  const idCol = col(s.Itens, "ID do pacote");
  s.Itens = s.Itens.filter((r, i) => i === 0 || r[idCol] !== 1);
  const row = [...s.Pacotes[2]];
  row[col(s.Pacotes, "ID")] = null;
  row[col(s.Pacotes, "Nome público")] = "Empty New";
  s.Pacotes.push(row);
  s.Pacotes[2][col(s.Pacotes, "Descrição")] = "Changed while sold";
  const p = plan(s);
  assert.deepEqual(codes(p, "confirm").sort(), ["attachments_unlinked", "items_removed_all", "package_without_items", "status_sensitive"]);
  assert.equal(p.issues.find((i) => i.code === "attachments_unlinked").count, 2);
  assert.ok(p.confirmKeys.includes("items_removed_all:n:1"));
  assert.equal(p.canImport, true);
});

test("change made in the system after the export asks for confirmation", () => {
  const packages = samplePackages();
  const s = exported(packages);
  packages[0].updatedAt = new Date(UPDATED.getTime() + 60000);
  const p = plan(s, {}, state(packages));
  assert.deepEqual(codes(p, "confirm"), ["changed_after_export"]);
});

test("status is never imported", () => {
  const s = exported();
  s.Pacotes[1][col(s.Pacotes, "Situação")] = "Vendido";
  const p = plan(s);
  assert.ok(codes(p, "info").includes("status_ignored"));
  assert.equal(p.packages[0].action, "unchanged");
});

test("hidden rows (filter or collapsed group) still count", () => {
  const s = exported();
  const p = plan(s, { hidden: { Itens: [2], Pacotes: [2] } });
  assert.equal(p.issues.find((i) => i.code === "hidden_rows").count, 2);
  assert.deepEqual(p.packages.map((x) => x.action), ["unchanged", "unchanged"]);
});

test("single package import ignores the other rows; refuses a file without it", () => {
  const p = plan(exported(), { onlyNumber: 2 });
  assert.deepEqual(p.packages.map((x) => x.ref.number), [2]);
  assert.ok(codes(p, "info").includes("other_packages_ignored"));
  assert.ok(codes(p, "info").includes("other_items_ignored"));
  const s = exported();
  s.Pacotes = [s.Pacotes[0], s.Pacotes[1]];
  s.Itens = s.Itens.filter((r, i) => i === 0 || r[0] === 1);
  assert.deepEqual(codes(plan(s, { onlyNumber: 2 }), "error"), ["package_not_in_file"]);
});

test("missing optional item column asks for confirmation; STOR folder cannot repeat", () => {
  const s = exported();
  const tag = col(s.Itens, "Tag");
  s.Itens = s.Itens.map((r) => r.filter((_, i) => i !== tag));
  assert.ok(plan(s).confirmKeys.includes("item_column_missing:tag"));

  const f = exported();
  f.Pacotes = [f.Pacotes[0], f.Pacotes[2]];
  f.Itens = f.Itens.filter((r, i) => i === 0 || r[0] === 2);
  f.Pacotes[1][col(f.Pacotes, "Pasta STOR")] = "7-8 Sample";
  assert.ok(codes(plan(f), "error").includes("stor_folder_taken"));
});

test("fingerprint changes when the database changes", () => {
  const packages = samplePackages();
  const s = exported(packages);
  const before = plan(s, {}, state(packages)).fingerprint;
  assert.equal(plan(s, {}, state(packages)).fingerprint, before);
  packages[1].updatedAt = new Date(UPDATED.getTime() + 1);
  assert.notEqual(plan(s, {}, state(packages)).fingerprint, before);
});
