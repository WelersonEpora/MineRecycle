"use strict";

const path = require("node:path");
const { randomUUID } = require("node:crypto");
const XLSX = require("xlsx");
const { Op } = require("sequelize");
const { sequelize, Package, PackageLine, Attachment } = require("../models");
const { NotFoundError, ValidationError } = require("../shared/errors");
const { uuid, isUuid, optionalString } = require("../shared/validate");
const { storage, keys } = require("../storage");
const sheet = require("../import/spreadsheet");
const { buildImportPlan, validateMapping } = require("../import/import-plan");
const lineService = require("./line.service");
const attachmentService = require("./attachment.service");
const packageService = require("./package.service");
const { storCodeFromFileName } = require("../import/stor-code");


// Importação de planilha por pacote, em três passos:
//   1. start: o vendedor envia o .xlsx; ele fica guardado (imports/<id>.xlsx) e a API devolve abas, cabeçalho
//      detectado, amostra e um mapeamento sugerido.
//   2. preview: com aba, linha do cabeçalho e mapeamento escolhidos, devolve o relatório (erros, avisos, unidades
//      desconhecidas) sem gravar nada.
//   3. commit: substitui as linhas do pacote numa transação. Com erros, só grava se o vendedor pedir para pular as
//      linhas inválidas.

const IMPORT_EXTENSIONS = [".xlsx", ".xls"];
const MAX_REPORT_ITEMS = 200;

async function findPackage(packageId) {
  const pkg = await Package.findByPk(uuid(packageId, "packageId"));
  if (!pkg) throw new NotFoundError("Package not found.");
  return pkg;
}

async function loadWorkbook(importId) {
  if (!isUuid(importId)) throw new NotFoundError("Import not found.", null, "IMPORT_NOT_FOUND");
  let buffer;
  try {
    buffer = await storage.get(keys.importFile(importId.toLowerCase()));
  } catch (_err) {
    throw new NotFoundError("Import not found or already finished. Upload the file again.", null, "IMPORT_NOT_FOUND");
  }
  const workbook = sheet.readWorkbook(buffer);
  if (!workbook) throw new ValidationError("Could not read the spreadsheet.", null, "IMPORT_UNREADABLE");
  return { workbook, buffer };
}

function columnLetter(index) {
  return XLSX.utils.encode_col(index);
}

function shortCell(value) {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  const s = String(value);
  return s.length > 120 ? `${s.slice(0, 117)}...` : s;
}

// Resolve aba e linha do cabeçalho (número da linha no Excel) escolhidos, ou os detectados.
function resolveLayout(workbook, options = {}) {
  const sheetName = workbook.SheetNames.includes(options.sheet) ? options.sheet : workbook.SheetNames[0];
  const { rows, firstRowNumber, truncated } = sheet.sheetRows(workbook, sheetName);
  let headerIndex;
  if (Number.isInteger(options.headerRow) && options.headerRow >= firstRowNumber && options.headerRow - firstRowNumber < rows.length) {
    headerIndex = options.headerRow - firstRowNumber;
  } else {
    headerIndex = sheet.detectHeaderRow(rows);
  }
  return { sheetName, rows, firstRowNumber, headerIndex, truncated };
}

function describe(importId, workbook, options = {}) {
  const layout = resolveLayout(workbook, options);
  const headers = sheet.headersOf(layout.rows, layout.headerIndex);
  return {
    importId,
    sheets: workbook.SheetNames,
    sheet: layout.sheetName,
    headerRow: layout.firstRowNumber + layout.headerIndex,
    firstRow: layout.firstRowNumber,
    headers: headers.map((label, index) => ({ index, letter: columnLetter(index), label })),
    // Linhas antes do cabeçalho também, para o vendedor ver onde ele está.
    preview: layout.rows.slice(0, layout.headerIndex + 9).map((row, i) => ({
      rowNumber: layout.firstRowNumber + i,
      cells: headers.map((_, c) => shortCell((row || [])[c]))
    })),
    suggestedMapping: sheet.suggestMapping(layout.rows[layout.headerIndex]),
    dataRowCount: Math.max(0, layout.rows.length - layout.headerIndex - 1),
    truncated: Boolean(layout.truncated)
  };
}

// Código STOR no nome do arquivo e a quais pacotes ele já pertence, para a tela conferir se a planilha é deste pacote.
async function storDocumentInfo(pkg, fileName) {
  const code = storCodeFromFileName(fileName);
  if (!code) return null;
  const owners = await packageService.findByStorDocument(code);
  return {
    code,
    inThisPackage: owners.some((o) => o.id === pkg.id),
    // Planilha ligada ao pacote, mas ainda não liberada para importar (aguarda validação do cliente).
    pending: (pkg.storDocumentsPending || []).includes(code),
    otherPackages: owners.filter((o) => o.id !== pkg.id).map((o) => ({ id: o.id, number: o.number, name: o.name }))
  };
}

async function start(packageId, file) {
  const pkg = await findPackage(packageId);
  if (!file) throw new ValidationError("No file received.", { field: "file", code: "required" });
  const originalName = Buffer.from(file.originalname || "", "latin1").toString("utf8");
  const ext = path.extname(originalName).toLowerCase();
  if (!IMPORT_EXTENSIONS.includes(ext)) {
    throw new ValidationError("Upload an Excel file (.xlsx or .xls).", { field: "file", code: "file_type" }, "IMPORT_FILE_TYPE");
  }
  const workbook = sheet.readWorkbook(file.buffer);
  if (!workbook || workbook.SheetNames.length === 0) throw new ValidationError("Could not read the spreadsheet.", null, "IMPORT_UNREADABLE");

  const importId = randomUUID();
  await storage.put(keys.importFile(importId), file.buffer);
  return { ...describe(importId, workbook), storDocument: await storDocumentInfo(pkg, originalName) };
}

async function describeExisting(importId, options) {
  const { workbook } = await loadWorkbook(importId);
  return describe(importId.toLowerCase(), workbook, parseOptions(options));
}

function parseOptions(body = {}) {
  const mapping = {};
  for (const field of sheet.MAPPABLE_FIELDS) {
    const v = body.mapping?.[field];
    mapping[field] = v === null || v === undefined || v === "" ? null : Number(v);
  }
  return {
    sheet: typeof body.sheet === "string" ? body.sheet : undefined,
    headerRow: body.headerRow === undefined ? undefined : Number(body.headerRow),
    mapping,
    inferHierarchy: body.inferHierarchy !== false,
    // Planilha sem coluna de nº do item: numerar pela ordem das linhas.
    numberRows: body.numberRows === true,
    skipInvalid: body.skipInvalid === true,
    keepFile: body.keepFile !== false,
    // Acrescentar ao pacote o código STOR do nome do arquivo (quando ainda não está nele).
    addStorDocument: body.addStorDocument === true,
    confirmPending: body.confirmPending === true,
    fileName: optionalString(body.fileName, "fileName", { max: 200 })
  };
}

function plan(workbook, options) {
  const layout = resolveLayout(workbook, options);
  const columnCount = sheet.headersOf(layout.rows, layout.headerIndex).length;
  const problems = validateMapping(options.mapping, columnCount, { numberRows: options.numberRows });
  if (problems.length) throw new ValidationError("Column mapping is incomplete.", { mapping: problems }, "IMPORT_MAPPING_INVALID");
  const result = buildImportPlan(layout.rows, {
    headerRowIndex: layout.headerIndex,
    firstRowNumber: layout.firstRowNumber,
    mapping: options.mapping,
    inferHierarchy: options.inferHierarchy,
    numberRows: options.numberRows
  });
  return { layout, result };
}

function countBy(items) {
  return items.reduce((acc, i) => ((acc[i.code] = (acc[i.code] || 0) + 1), acc), {});
}

function report(result) {
  return {
    stats: result.stats,
    errorCount: result.errors.length,
    warningCount: result.warnings.length,
    errorsByCode: countBy(result.errors),
    warningsByCode: countBy(result.warnings),
    errors: result.errors.slice(0, MAX_REPORT_ITEMS),
    warnings: result.warnings.slice(0, MAX_REPORT_ITEMS),
    sampleLines: result.lines.slice(0, 15)
  };
}

async function preview(packageId, importId, body) {
  const pkg = await findPackage(packageId);
  const { workbook } = await loadWorkbook(importId);
  const { result } = plan(workbook, parseOptions(body));
  const existingLineCount = await PackageLine.count({ where: { packageId: pkg.id } });
  const linkedAttachmentCount = await Attachment.count({ where: { packageId: pkg.id, lineId: { [Op.ne]: null } } });
  return { ...report(result), existingLineCount, linkedAttachmentCount };
}

async function commit(packageId, importId, body, userId) {
  const pkg = await findPackage(packageId);
  const { workbook, buffer } = await loadWorkbook(importId);
  const options = parseOptions(body);
  const { result } = plan(workbook, options);

  if (result.errors.length && !options.skipInvalid) {
    throw new ValidationError("The spreadsheet has invalid rows.", report(result), "IMPORT_HAS_ERRORS");
  }
  if (result.lines.length === 0) throw new ValidationError("No valid rows to import.", report(result), "IMPORT_EMPTY");
  const fileCode = storCodeFromFileName(options.fileName);
  if (fileCode && (pkg.storDocumentsPending || []).includes(fileCode) && !options.confirmPending) {
    throw new ValidationError("This STOR document is pending validation.", { code: fileCode }, "IMPORT_DOCUMENT_PENDING");
  }

  const outcome = await sequelize.transaction(async (transaction) => {
    const replaced = await lineService.replaceLines(pkg.id, result.lines, { transaction });
    await pkg.update({ updatedBy: userId }, { transaction });
    const storDocumentAdded = options.addStorDocument
      ? await packageService.addStorDocument(pkg, storCodeFromFileName(options.fileName), { transaction })
      : false;
    return { ...replaced, storDocumentAdded };
  });

  let attachment = null;
  if (options.keepFile) {
    const fileName = options.fileName && /\.xlsx?$/i.test(options.fileName) ? options.fileName : `package-${pkg.number}-lines.xlsx`;
    attachment = await attachmentService.createFromBuffer({
      packageId: pkg.id,
      kind: "list",
      // Interno: a planilha pode ter colunas de valor; só o vendedor logado a vê, nunca o comprador.
      visibility: "internal",
      title: null,
      originalName: fileName,
      buffer,
      userId
    });
  }
  await storage.remove(keys.importFile(importId.toLowerCase()));

  return { ...outcome, skippedInvalidRows: result.stats.invalidRows, warningCount: result.warnings.length, attachment };
}

async function cancel(importId) {
  if (isUuid(importId)) await storage.remove(keys.importFile(importId.toLowerCase()));
}

module.exports = { start, describeExisting, preview, commit, cancel, parseOptions, plan };
