"use strict";

// Monta a planilha de exportação dos pacotes (só vendedores). Regra pura: recebe os dados já lidos e devolve o
// arquivo. Aba 1 = pacotes, aba 2 = itens (com os cabeçalhos que o importador reconhece; ele abre esta aba por padrão
// pelo nome, ver import/spreadsheet.js defaultSheet).

const XLSX = require("xlsx");
const { LINE_COLUMNS, PACKAGE_COLUMNS } = require("./columns");
const { SHEETS, langOf } = require("./labels");

// Profundidade de cada item pela cadeia de pais (0 = nível de cima). Pai fora da lista conta como nível de cima;
// ciclo (não deveria existir) é cortado.
function depths(lines) {
  const parentOf = new Map(lines.map((l) => [l.id, l.parentLineId || null]));
  const memo = new Map();
  const depth = (id, seen = new Set()) => {
    if (memo.has(id)) return memo.get(id);
    const parent = parentOf.get(id);
    const d = parent && parentOf.has(parent) && !seen.has(parent) ? depth(parent, new Set([...seen, id])) + 1 : 0;
    memo.set(id, d);
    return d;
  };
  return new Map(lines.map((l) => [l.id, depth(l.id)]));
}

// Itens na ordem da lista do pacote, com cada filho logo abaixo do seu pai (para o agrupamento do Excel funcionar).
function treeOrder(lines) {
  const ids = new Set(lines.map((l) => l.id));
  const children = new Map();
  const roots = [];
  for (const l of lines) {
    if (l.parentLineId && ids.has(l.parentLineId) && l.parentLineId !== l.id) {
      if (!children.has(l.parentLineId)) children.set(l.parentLineId, []);
      children.get(l.parentLineId).push(l);
    } else {
      roots.push(l);
    }
  }
  const out = [];
  const visited = new Set();
  const walk = (l) => {
    if (visited.has(l.id)) return;
    visited.add(l.id);
    out.push(l);
    for (const c of children.get(l.id) || []) walk(c);
  };
  roots.forEach(walk);
  lines.forEach(walk); // sobra só em ciclo: entra no fim, sem perder linha
  return out;
}

function sheetFrom(columns, records, ctx, rowLevels = null) {
  const header = columns.map((c) => c.label[ctx.lang]);
  const rows = records.map((r) => columns.map((c) => c.value(r.record, { ...ctx, ...r.ctx }) ?? null));
  // cellDates: datas como data do Excel; textos ficam sempre como texto (nunca fórmula).
  const ws = XLSX.utils.aoa_to_sheet([header, ...rows], { cellDates: true, dateNF: "yyyy-mm-dd hh:mm" });
  ws["!cols"] = columns.map((c) => ({ wch: c.width || 12 }));
  ws["!autofilter"] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: Math.max(rows.length, 1), c: columns.length - 1 } }) };
  if (rowLevels) ws["!rows"] = [{}, ...rowLevels.map((level) => (level ? { level: Math.min(level, 7) } : {}))];
  return ws;
}

// packages: [{ number, name, type, ..., lines: [{ id, parentLineId, itemNo, ... }] }] na ordem da lista.
function buildWorkbook(packages, { lang, baseUrl }) {
  const ctx = { lang: langOf(lang), baseUrl: String(baseUrl || "").replace(/\/+$/, "") };
  const lineRecords = [];
  const levels = [];
  for (const pkg of packages) {
    const lines = pkg.lines || [];
    const depth = depths(lines);
    for (const line of treeOrder(lines)) {
      lineRecords.push({ record: line, ctx: { pkg } });
      levels.push(depth.get(line.id) || 0);
    }
  }
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheetFrom(PACKAGE_COLUMNS, packages.map((p) => ({ record: p })), ctx), SHEETS[ctx.lang].packages);
  XLSX.utils.book_append_sheet(wb, sheetFrom(LINE_COLUMNS, lineRecords, ctx, levels), SHEETS[ctx.lang].lines);
  return wb;
}

function toBuffer(wb) {
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx", compression: true });
}

// Nome do arquivo: só ID e data, nada do conteúdo.
function fileName({ number = null, lang = "en", date = new Date() } = {}) {
  const day = date.toISOString().slice(0, 10);
  const [one, many] = langOf(lang) === "pt" ? ["pacote", "pacotes"] : ["package", "packages"];
  return number ? `minerecycle-${one}-${number}-${day}.xlsx` : `minerecycle-${many}-${day}.xlsx`;
}

module.exports = { buildWorkbook, toBuffer, fileName, treeOrder, depths };
