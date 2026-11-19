"use strict";

// Importação de pacotes pela planilha do sistema (abas Pacotes e Itens, ver export/columns.js). Regra pura: recebe a
// planilha lida e o estado atual (pacotes, itens e origens) e devolve o plano, sem tocar no banco.
//
// Regras (decisões de 2026-11-19):
// - A chave é o ID. ID existente atualiza; ID vazio cria (rascunho, próximo ID); ID desconhecido impede.
// - Nunca apaga pacote: pacote fora do arquivo fica como está.
// - Situação e colunas de leitura (contagens, data, página pública) são ignoradas.
// - Sem aba Itens: só os dados dos pacotes. Com aba Itens: ela é a lista completa dos pacotes do arquivo.
// - Itens de pacote novo se ligam a ele pelo nome (que não pode se repetir entre os novos).
// - Linhas e colunas ocultas (filtro, grupo recolhido) contam: para tirar um item, apague a linha.
// - Coluna de pacote que falta: o campo fica como está. Coluna de item que falta: o campo fica vazio (pede confirmação).
//
// Problemas: { level, code, ... }. level "error" impede; "confirm" pede confirmação (key estável, enviada de volta
// no commit); "info" só informa.

const { createHash } = require("node:crypto");
const sheet = require("./spreadsheet");
const { buildImportPlan } = require("./import-plan");
const { LINE_COLUMNS, PACKAGE_COLUMNS, IMPORT_COLUMNS } = require("../export/columns");
const { SHEETS, enumValue, fold } = require("../export/labels");
const { parsePackageInput, reconcilePending } = require("../domain/package-input");
const { ValidationError } = require("../shared/errors");

const PACKAGE_SHEETS = Object.values(SHEETS).map((s) => s.packages);
const ITEM_SHEETS = Object.values(SHEETS).map((s) => s.lines);
const SENSITIVE_STATUSES = ["sold", "under_negotiation"];
const MAX_ISSUES_PER_CODE = 50;
// Folga na comparação da data de atualização (o Excel guarda a data com arredondamento).
const UPDATED_AT_TOLERANCE_MS = 2000;
const PACKAGE_FIELDS = ["name", "type", "category", "originId", "locations", "description", "storFolder", "storNumbers", "storDocuments", "storDocumentsPending"];
const LINE_FIELDS = ["description", "quantity", "unit", "storCode", "tag", "warehouseLocation", "parentItemNo"];

const isBlank = (v) => v === null || v === undefined || String(v).trim() === "";

// Cabeçalho (primeira linha) -> { found: Map(key -> índice), unknown: [rótulos] }, pelos rótulos em qualquer idioma.
function matchHeader(columns, headerRow) {
  const byLabel = new Map();
  for (const c of columns) for (const l of Object.values(c.label)) byLabel.set(sheet.normalizeHeader(l), c);
  const found = new Map();
  const unknown = [];
  (headerRow || []).forEach((h, i) => {
    const n = sheet.normalizeHeader(h);
    if (!n) return;
    const c = byLabel.get(n);
    if (c && !found.has(c.key)) found.set(c.key, i);
    else unknown.push(String(h).trim());
  });
  return { found, unknown };
}

// Linhas de dados ocultas (filtro do Excel ou grupo recolhido). Precisa da planilha lida com cellStyles.
function hiddenRowCount(workbook, sheetName, dataRows) {
  const meta = workbook.Sheets[sheetName]?.["!rows"] || [];
  let n = 0;
  for (let i = 1; i <= dataRows; i += 1) if (meta[i]?.hidden) n += 1;
  return n;
}

function sameValue(a, b) {
  const norm = (v) => (v === undefined || v === "" ? null : v);
  return JSON.stringify(norm(a)) === JSON.stringify(norm(b));
}

function originLabel(origins, id) {
  const o = origins.find((x) => x.id === id);
  return o ? `${o.name} (${o.code})` : null;
}

// "Nome (SIGLA)", "SIGLA" ou "Nome" -> origem cadastrada.
function findOrigin(origins, text) {
  if (isBlank(text)) return null;
  const inParens = /\(([^()]+)\)\s*$/.exec(text);
  const candidates = [inParens?.[1], text].filter(Boolean).map(fold);
  return origins.find((o) => candidates.includes(fold(o.code))) || origins.find((o) => candidates.includes(fold(o.name))) || null;
}

function lineValue(l, field) {
  if (field === "quantity") return l.quantity === null || l.quantity === undefined ? null : Number(l.quantity);
  return l[field] ?? null;
}

function compareLines(before, after) {
  const old = new Map(before.map((l) => [l.itemNo, l]));
  const now = new Set(after.map((l) => l.itemNo));
  let added = 0;
  let changed = 0;
  for (const l of after) {
    const prev = old.get(l.itemNo);
    if (!prev) added += 1;
    else if (LINE_FIELDS.some((f) => !sameValue(lineValue(prev, f), lineValue(l, f)))) changed += 1;
  }
  const removedLines = before.filter((l) => !now.has(l.itemNo));
  const reordered = before.length === after.length && before.some((l, i) => l.itemNo !== after[i]?.itemNo);
  return {
    before: before.length,
    after: after.length,
    added,
    removed: removedLines.length,
    changed,
    reordered,
    unlinkedAttachments: removedLines.reduce((n, l) => n + (l.attachmentCount || 0), 0),
    changedAny: added > 0 || changed > 0 || removedLines.length > 0 || reordered
  };
}

// workbook: lida com cellStyles (para as linhas ocultas). state: { packages: [...com lines], origins }.
// onlyNumber: "Importar pacote" (só o pacote aberto; o resto do arquivo é ignorado).
function planPackageImport(workbook, state, { onlyNumber = null } = {}) {
  const issues = [];
  const issue = (level, code, extra = {}) => issues.push({ level, code, ...extra });
  const byNumber = new Map(state.packages.map((p) => [p.number, p]));
  const origins = state.origins || [];
  const planned = [];
  const done = () => finish(planned, issues, { onlyNumber, state, itemsSheet: false });

  // ---------- Aba Pacotes ----------
  const pkgSheet = workbook.SheetNames.find((n) => PACKAGE_SHEETS.includes(n));
  if (!pkgSheet) {
    issue("error", "no_packages_sheet");
    return done();
  }
  const { rows: pRows, firstRowNumber: pFirst } = sheet.sheetRows(workbook, pkgSheet);
  const pHead = matchHeader(PACKAGE_COLUMNS, pRows[0]);
  for (const key of ["number", "name"]) {
    if (!pHead.found.has(key)) issue("error", "missing_column", { sheet: pkgSheet, column: PACKAGE_COLUMNS.find((c) => c.key === key).label });
  }
  if (issues.length) return done();
  if (pHead.unknown.length) issue("info", "unknown_columns", { sheet: pkgSheet, columns: pHead.unknown });
  const absent = PACKAGE_COLUMNS.filter((c) => c.read && !pHead.found.has(c.key));
  if (absent.length) issue("info", "package_columns_missing", { columns: absent.map((c) => c.label) });

  const cell = (row, key) => (pHead.found.has(key) ? row[pHead.found.get(key)] : undefined);
  const seenNumbers = new Map();
  let ignoredPackages = 0;
  let onlyFound = false;

  for (let i = 1; i < pRows.length; i += 1) {
    const row = pRows[i] || [];
    if (row.every(isBlank)) continue;
    const excelRow = pFirst + i;
    const idText = isBlank(cell(row, "number")) ? null : String(cell(row, "number")).trim();
    const number = idText === null ? null : /^\d+$/.test(idText) ? Number(idText) : NaN;
    const name = isBlank(cell(row, "name")) ? null : String(cell(row, "name")).replace(/\s+/g, " ").trim();
    const ref = { row: excelRow, number: Number.isNaN(number) ? idText : number, name };

    if (onlyNumber !== null && number !== onlyNumber) {
      ignoredPackages += 1;
      continue;
    }
    if (number === onlyNumber && onlyNumber !== null) onlyFound = true;
    if (Number.isNaN(number)) {
      issue("error", "package_id_invalid", { sheet: pkgSheet, ...ref });
      continue;
    }
    const current = number === null ? null : byNumber.get(number);
    if (number !== null && !current) {
      issue("error", "package_id_unknown", { sheet: pkgSheet, ...ref });
      continue;
    }
    if (number !== null && seenNumbers.has(number)) {
      issue("error", "package_id_duplicate", { sheet: pkgSheet, ...ref, firstRow: seenNumbers.get(number) });
      continue;
    }
    if (number !== null) seenNumbers.set(number, excelRow);

    // Campos do formulário a partir das colunas presentes.
    const body = {};
    for (const c of PACKAGE_COLUMNS) if (c.read && pHead.found.has(c.key)) Object.assign(body, c.read(cell(row, c.key)));
    let rowFailed = false;
    if (body.origin !== undefined) {
      const origin = findOrigin(origins, body.origin);
      if (!origin) {
        issue("error", "origin_unknown", { sheet: pkgSheet, ...ref, value: body.origin });
        rowFailed = true;
      } else if (!origin.active && origin.id !== current?.originId) {
        issue("error", "origin_inactive", { sheet: pkgSheet, ...ref, value: body.origin });
        rowFailed = true;
      } else body.originId = origin.id;
      delete body.origin;
    } else if (!current) {
      issue("error", "field_invalid", { sheet: pkgSheet, ...ref, field: "originId", reason: "required" });
      rowFailed = true;
    }

    let data;
    try {
      data = parsePackageInput(body, { partial: Boolean(current) });
      reconcilePending(data, current || {});
    } catch (err) {
      if (!(err instanceof ValidationError)) throw err;
      issue("error", "field_invalid", { sheet: pkgSheet, ...ref, field: err.details?.field, reason: err.details?.code, value: err.details?.value });
      rowFailed = true;
    }
    if (rowFailed) continue;
    if (body.originId) data.originId = body.originId;

    // Situação não é importada: só avisa se o arquivo diz outra coisa.
    const statusText = cell(row, "status");
    const fileStatus = isBlank(statusText) ? null : enumValue("status", statusText);
    if (fileStatus && fileStatus !== (current ? current.status : "draft")) issue("info", "status_ignored", { ...ref, value: String(statusText) });

    // Alteração no sistema depois da exportação.
    const fileUpdated = cell(row, "updatedAt");
    if (current && fileUpdated instanceof Date && new Date(current.updatedAt).getTime() - fileUpdated.getTime() > UPDATED_AT_TOLERANCE_MS) {
      issue("confirm", "changed_after_export", { key: `changed_after_export:${number}`, ...ref, updatedAt: new Date(current.updatedAt).toISOString() });
    }

    const changes = [];
    if (current) {
      for (const field of PACKAGE_FIELDS) {
        if (data[field] === undefined || sameValue(data[field], current[field] ?? null)) continue;
        if (field === "originId") changes.push({ field: "origin", from: originLabel(origins, current.originId), to: originLabel(origins, data.originId) });
        else changes.push({ field, from: current[field] ?? null, to: data[field] });
      }
    }
    planned.push({ ref, key: current ? `n:${number}` : `new:${fold(name)}`, current, data, changes, isNew: !current, items: null, lines: null });
  }

  if (onlyNumber !== null && !onlyFound) issue("error", "package_not_in_file", { number: onlyNumber });
  if (ignoredPackages) issue("info", "other_packages_ignored", { count: ignoredPackages });
  const hiddenPkg = hiddenRowCount(workbook, pkgSheet, pRows.length - 1);

  // Nomes dos pacotes novos: ligam os itens ao pacote, então não se repetem.
  const newByName = new Map();
  for (const p of planned.filter((x) => x.isNew)) {
    if (newByName.has(p.key)) issue("error", "new_package_name_duplicate", { sheet: pkgSheet, ...p.ref, firstRow: newByName.get(p.key).ref.row });
    else newByName.set(p.key, p);
  }

  // Pasta STOR: não se repete entre os pacotes (arquivo e sistema).
  const folderOwner = new Map();
  const inFile = new Set(planned.filter((p) => p.current).map((p) => p.current.id));
  for (const p of state.packages) if (!inFile.has(p.id) && p.storFolder) folderOwner.set(p.storFolder, { ref: { number: p.number, name: p.name } });
  for (const p of planned) {
    const folder = p.data.storFolder !== undefined ? p.data.storFolder : p.current?.storFolder;
    if (!folder) continue;
    if (folderOwner.has(folder)) issue("error", "stor_folder_taken", { ...p.ref, value: folder, other: folderOwner.get(folder).ref });
    else folderOwner.set(folder, p);
  }

  // ---------- Aba Itens ----------
  const itemSheet = workbook.SheetNames.find((n) => ITEM_SHEETS.includes(n));
  let hiddenItems = 0;
  if (!itemSheet) {
    issue("info", "no_items_sheet");
  } else {
    const { rows: iRows, firstRowNumber: iFirst } = sheet.sheetRows(workbook, itemSheet);
    const header = iRows[0] || [];
    const mapping = sheet.suggestMapping(header);
    const pkgCols = matchHeader(
      LINE_COLUMNS.filter((c) => !c.import),
      header
    );
    const mappedIdx = new Set([...Object.values(mapping).filter((v) => v !== null), ...pkgCols.found.values()]);
    const unknownItems = header.map((h, i) => (!isBlank(h) && !mappedIdx.has(i) ? String(h).trim() : null)).filter(Boolean);
    if (unknownItems.length) issue("info", "unknown_columns", { sheet: itemSheet, columns: unknownItems });

    const missingRequired = IMPORT_COLUMNS.filter((c) => c.import.required && mapping[c.key] === null);
    for (const c of missingRequired) issue("error", "missing_column", { sheet: itemSheet, column: c.label });
    if (!pkgCols.found.has("packageNumber")) {
      issue("error", "missing_column", { sheet: itemSheet, column: LINE_COLUMNS.find((c) => c.key === "packageNumber").label });
    }
    if (!missingRequired.length && pkgCols.found.has("packageNumber")) {
      const missingOptional = IMPORT_COLUMNS.filter((c) => !c.import.required && mapping[c.key] === null);
      for (const c of missingOptional) issue("confirm", "item_column_missing", { key: `item_column_missing:${c.key}`, sheet: itemSheet, column: c.label });

      // Linhas por pacote.
      const groups = new Map(planned.map((p) => [p.key, new Set()]));
      const byPlannedNumber = new Map(planned.filter((p) => p.current).map((p) => [p.current.number, p]));
      const at = (row, key) => (pkgCols.found.has(key) ? row[pkgCols.found.get(key)] : null);
      const itemCells = (row) => Object.values(mapping).filter((v) => v !== null).map((idx) => row[idx]);
      let ignoredItems = 0;
      for (let i = 1; i < iRows.length; i += 1) {
        const row = iRows[i] || [];
        if (itemCells(row).every(isBlank)) continue;
        const excelRow = iFirst + i;
        const idText = isBlank(at(row, "packageNumber")) ? null : String(at(row, "packageNumber")).trim();
        if (idText !== null) {
          const n = /^\d+$/.test(idText) ? Number(idText) : NaN;
          if (onlyNumber !== null && n !== onlyNumber) {
            ignoredItems += 1;
            continue;
          }
          const target = byPlannedNumber.get(n);
          if (!target) issue("error", "item_package_not_in_file", { sheet: itemSheet, row: excelRow, number: idText });
          else groups.get(target.key).add(i);
          continue;
        }
        if (onlyNumber !== null) {
          ignoredItems += 1;
          continue;
        }
        const name = at(row, "packageName");
        const target = isBlank(name) ? null : newByName.get(`new:${fold(name)}`);
        if (!target) issue("error", "item_package_unknown", { sheet: itemSheet, row: excelRow, name: isBlank(name) ? null : String(name) });
        else groups.get(target.key).add(i);
      }
      if (ignoredItems) issue("info", "other_items_ignored", { count: ignoredItems });

      for (const p of planned) {
        const rowsOf = groups.get(p.key);
        // Só as linhas deste pacote (as outras ficam vazias e são puladas), mantendo o número da linha do Excel.
        const matrix = iRows.map((r, i) => (i === 0 || rowsOf.has(i) ? r : []));
        const result = buildImportPlan(matrix, { headerRowIndex: 0, firstRowNumber: iFirst, mapping, inferHierarchy: true });
        for (const e of result.errors) issue("error", "item_invalid", { sheet: itemSheet, row: e.row, field: e.field, reason: e.code, value: e.value, package: p.ref });
        for (const w of result.warnings) issue("info", "item_warning", { sheet: itemSheet, row: w.row, field: w.field, reason: w.code, value: w.value, package: p.ref });
        p.lines = result.lines;
        p.items = compareLines(p.current?.lines || [], result.lines);
      }
    }
    hiddenItems = hiddenRowCount(workbook, itemSheet, iRows.length - 1);
  }
  if (hiddenPkg + hiddenItems) issue("info", "hidden_rows", { count: hiddenPkg + hiddenItems });

  // Avisos por pacote, depois de saber o que muda nos itens.
  for (const p of planned) {
    if (p.items) {
      if (p.items.after === 0 && p.isNew) issue("confirm", "package_without_items", { key: `package_without_items:${p.key}`, ...p.ref });
      else if (p.items.after === 0 && p.items.before > 0) issue("confirm", "items_removed_all", { key: `items_removed_all:${p.key}`, ...p.ref, count: p.items.before });
      if (p.items.unlinkedAttachments) {
        issue("confirm", "attachments_unlinked", { key: `attachments_unlinked:${p.key}`, ...p.ref, count: p.items.unlinkedAttachments });
      }
    }
    const touched = p.changes.length > 0 || Boolean(p.items?.changedAny);
    if (p.current && touched && SENSITIVE_STATUSES.includes(p.current.status)) {
      issue("confirm", "status_sensitive", { key: `status_sensitive:${p.key}`, ...p.ref, status: p.current.status });
    }
    p.action = p.isNew ? "create" : touched ? "update" : "unchanged";
  }

  return finish(planned, issues, { onlyNumber, state, itemsSheet: Boolean(itemSheet) });
}

function finish(planned, issues, { onlyNumber, state, itemsSheet }) {
  const confirmKeys = issues.filter((i) => i.level === "confirm").map((i) => i.key);
  const errorCount = issues.filter((i) => i.level === "error").length;
  // Impressão digital do plano e do estado dos pacotes envolvidos: o commit refaz o plano e recusa se ela mudou
  // (arquivo, escolha ou banco diferentes do que a pessoa viu na verificação).
  const fingerprint = createHash("sha256")
    .update(
      JSON.stringify({
        onlyNumber,
        packages: planned.map((p) => ({
          key: p.key,
          action: p.action,
          data: p.data,
          lines: p.lines,
          updatedAt: p.current ? new Date(p.current.updatedAt).toISOString() : null
        })),
        maxNumber: Math.max(0, ...state.packages.map((p) => p.number)),
        confirmKeys
      })
    )
    .digest("hex");
  const count = (action) => planned.filter((p) => p.action === action).length;
  return {
    packages: planned,
    issues,
    confirmKeys,
    canImport: errorCount === 0 && planned.length > 0,
    fingerprint,
    summary: {
      create: count("create"),
      update: count("update"),
      unchanged: count("unchanged"),
      itemsSheet,
      errors: errorCount,
      confirmations: confirmKeys.length
    }
  };
}

// Relatório para a tela: problemas agrupados por código, com no máximo MAX_ISSUES_PER_CODE exemplos cada.
function reportIssues(issues) {
  const byCode = new Map();
  for (const i of issues) {
    const k = `${i.level}:${i.code}`;
    if (!byCode.has(k)) byCode.set(k, { level: i.level, code: i.code, total: 0, items: [] });
    const g = byCode.get(k);
    g.total += 1;
    if (g.items.length < MAX_ISSUES_PER_CODE) g.items.push(i);
  }
  const order = { error: 0, confirm: 1, info: 2 };
  return [...byCode.values()].sort((a, b) => order[a.level] - order[b.level]);
}

module.exports = { planPackageImport, reportIssues, findOrigin, PACKAGE_SHEETS, ITEM_SHEETS };
