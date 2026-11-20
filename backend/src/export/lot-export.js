"use strict";

const XLSX = require("xlsx");
const { compareLotNumbers } = require("../domain/auto-packages");

// Exportação dos lotes para planilha (decisão de 2026-11-19). Regra pura: recebe os lotes e devolve o .xlsx.
//
// Uma aba só, "Matriz de lotes", no formato da importação: as 8 colunas que o importador lê, com os nomes da planilha
// do cliente, e depois colunas só informativas (o importador ignora o que não reconhece). Por isso o arquivo pode ser
// editado e importado de volta. Cuidados para a volta não estragar dados:
// - STATUS sai como a planilha disse (sheet_status), nunca a situação no sistema: um lote vendido por um pacote sairia
//   "Sold" e, reimportado, ficaria vendido pela planilha, o que não tem volta.
// - Sempre todos os lotes, sem filtro, e só os não retirados: lote fora do arquivo vira retirado na importação.
// Nunca há coluna de preço ou valor (o modelo não tem).

const SHEET_NAME = "Matriz de lotes";

// Mesmos nomes da planilha do cliente (reconhecidos por LOT_COLUMNS em import/lot-sheet.js).
const IMPORT_COLUMNS = [
  { header: "Lot Number", value: (l) => l.lotNumber },
  { header: "Site Name", value: (l) => l.siteName },
  { header: "Title / Equipment Description", value: (l) => l.title },
  { header: "Master Supplier", value: (l) => l.masterSupplier },
  { header: "Equipamento ou sistema vinculado", value: (l) => l.linkedSystem },
  { header: "Família comercial", value: (l) => l.commercialFamily },
  { header: "Subfamília", value: (l) => l.subfamily },
  { header: "STATUS", value: (l) => SHEET_STATUS_TEXT[l.sheetStatus] ?? "" }
];

// Texto que a importação reconhece (domain/lot-status.js). Disponível sai vazio, como na planilha do cliente.
const SHEET_STATUS_TEXT = { available: "", sold: "Sold", unavailable: "Collected by court officer" };

// Colunas informativas, no idioma da tela. Os nomes não podem coincidir com os da importação.
const LABELS = {
  en: {
    systemStatus: "System status",
    packages: "Packages",
    sellerDescription: "Seller description",
    files: "Files",
    status: { available: "Available", sold: "Sold", unavailable: "Off sale" }
  },
  pt: {
    systemStatus: "Situação no sistema",
    packages: "Pacotes",
    sellerDescription: "Descrição do vendedor",
    files: "Arquivos",
    status: { available: "Disponível", sold: "Vendido", unavailable: "Fora da venda" }
  }
};

// lots = [{ lotNumber, siteName, title, masterSupplier, linkedSystem, commercialFamily, subfamily, sheetStatus, status,
//           description, packages: [{ number, name }], attachmentCount }]
function buildLotWorkbook(lots, { lang = "en" } = {}) {
  const t = LABELS[lang] || LABELS.en;
  const header = [...IMPORT_COLUMNS.map((c) => c.header), t.systemStatus, t.packages, t.sellerDescription, t.files];
  const sorted = [...lots].sort((a, b) => compareLotNumbers(a.lotNumber, b.lotNumber));
  const rows = sorted.map((l) => [
    ...IMPORT_COLUMNS.map((c) => c.value(l) ?? ""),
    t.status[l.status] ?? l.status,
    (l.packages || []).map((p) => `#${p.number} ${p.name}`).join("; "),
    l.description ?? "",
    l.attachmentCount || 0
  ]);
  const sheet = XLSX.utils.aoa_to_sheet([header, ...rows]);
  // Nº do lote sempre como texto (não vira número nem perde zero à esquerda).
  for (let r = 1; r <= rows.length; r += 1) {
    const cell = sheet[XLSX.utils.encode_cell({ r, c: 0 })];
    if (cell) cell.t = "s";
  }
  sheet["!cols"] = [14, 18, 60, 28, 32, 28, 28, 26, 16, 40, 40, 8].map((wch) => ({ wch }));
  sheet["!autofilter"] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: rows.length, c: header.length - 1 } }) };
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, SHEET_NAME);
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
}

// "MineRecycle - Lotes - 2026-11-19.xlsx" (data no fuso do Brasil).
function lotExportFileName(now = new Date(), lang = "en") {
  const date = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(now);
  return `MineRecycle - ${lang === "pt" ? "Lotes" : "Lots"} - ${date}.xlsx`;
}

module.exports = { buildLotWorkbook, lotExportFileName, SHEET_NAME, IMPORT_COLUMNS };
