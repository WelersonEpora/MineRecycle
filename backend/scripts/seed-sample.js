"use strict";

// Carga LOCAL dos arquivos reais do cliente (_sample-data), só para desenvolvimento. Os dados são confidenciais:
// este script não imprime nomes de arquivo, cabeçalhos nem conteúdo, só contagens.
//   - cada .xlsx vira um pacote a granel (rascunho), pela mesma rotina da importação de planilha;
//   - as imagens extraídas de cada PDF (serviço pdf-extract do compose) viram as fotos de um pacote de equipamento.
// Pacotes da amostra usam os números 901 em diante e são recriados a cada execução.
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { Op } = require("sequelize");
const { sequelize, Package } = require("../src/models");
const sheet = require("../src/import/spreadsheet");
const { buildImportPlan, validateMapping } = require("../src/import/import-plan");
const lineService = require("../src/services/line.service");
const attachmentService = require("../src/services/attachment.service");
const packageService = require("../src/services/package.service");
const images = require("../src/media/images");

if (process.env.NODE_ENV === "production") {
  console.error("seed:sample is for local development only.");
  process.exit(1);
}

const backendRoot = path.resolve(__dirname, "..");
const SAMPLE_DIR = path.resolve(backendRoot, process.env.SAMPLE_DATA_DIR || "../_sample-data");
const EXTRACT_DIR = process.env.SAMPLE_EXTRACT_DIR ? path.resolve(backendRoot, process.env.SAMPLE_EXTRACT_DIR) : null;
const FIRST_NUMBER = 901;
const MIN_PHOTO_SIDE = 300;

function listFiles(dir, exts) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => exts.includes(path.extname(f).toLowerCase()))
    .sort()
    .map((f) => path.join(dir, f));
}

async function importSpreadsheet(file, number) {
  const workbook = sheet.readWorkbook(fs.readFileSync(file));
  if (!workbook) return console.log(`Spreadsheet ${number}: could not be read, skipped.`);
  const sheetName = workbook.SheetNames[0];
  const { rows, firstRowNumber } = sheet.sheetRows(workbook, sheetName);
  const headerRowIndex = sheet.detectHeaderRow(rows);
  const mapping = sheet.suggestMapping(rows[headerRowIndex]);
  const columns = sheet.headersOf(rows, headerRowIndex).length;
  const problems = validateMapping(mapping, columns);
  if (problems.length) {
    console.log(`Spreadsheet ${number}: columns not recognized (${problems.map((p) => p.field).join(", ")}); import it through the seller screen.`);
    return;
  }
  const plan = buildImportPlan(rows, { headerRowIndex, firstRowNumber, mapping, inferHierarchy: true });
  const pkg = await Package.create({
    number,
    name: `Sample bulk package ${number}`,
    type: "bulk",
    locations: ["uberaba"],
    status: "draft",
    description: "Loaded from local sample data (development only)."
  });
  await lineService.replaceLinesTx(pkg.id, plan.lines);
  console.log(
    `Package ${number} (bulk, draft): ${plan.lines.length} lines, ${plan.stats.invalidRows} invalid rows skipped, ` +
      `${Object.keys(plan.stats.unknownUnits).length} unknown units`
  );
}

async function importPdfPhotos(dir, number) {
  const files = fs.readdirSync(dir).sort().map((f) => path.join(dir, f));
  const seen = new Set();
  const photos = [];
  for (const f of files) {
    const buffer = fs.readFileSync(f);
    const info = await images.probe(buffer);
    // Descarta logotipos, ícones e máscaras pequenas que o pdfimages também extrai, e imagens repetidas.
    if (!info || info.width < MIN_PHOTO_SIDE || info.height < MIN_PHOTO_SIDE) continue;
    const hash = crypto.createHash("sha1").update(buffer).digest("hex");
    if (seen.has(hash)) continue;
    seen.add(hash);
    photos.push({ buffer, ext: info.format === "jpeg" ? ".jpg" : `.${info.format}` });
  }
  const pkg = await Package.create({
    number,
    name: `Sample equipment package ${number}`,
    type: "equipment",
    locations: ["conceicao_do_araguaia"],
    status: "draft",
    description: "Photos extracted from local sample data (development only)."
  });
  await lineService.replaceLinesTx(pkg.id, [
    { itemNo: "1", description: "Transformer (sample)", quantity: "1", unit: "PC", unitRaw: "UN", parentItemNo: null, sortOrder: 1 }
  ]);
  let i = 0;
  for (const p of photos) {
    i += 1;
    await attachmentService.createFromBuffer({
      packageId: pkg.id,
      kind: "photo",
      visibility: "restricted",
      originalName: `photo-${String(i).padStart(3, "0")}${p.ext}`,
      buffer: p.buffer
    });
  }
  console.log(`Package ${number} (equipment, draft): ${photos.length} photos`);
}

async function main() {
  if (!fs.existsSync(SAMPLE_DIR)) {
    console.log("Sample data folder not found. Nothing done.");
    return;
  }
  const old = await Package.findAll({ where: { number: { [Op.gte]: FIRST_NUMBER } }, attributes: ["id"] });
  for (const p of old) await packageService.remove(p.id);

  let number = FIRST_NUMBER;
  const spreadsheets = listFiles(SAMPLE_DIR, [".xlsx", ".xls"]);
  for (const file of spreadsheets) await importSpreadsheet(file, number++);

  const pdfCount = listFiles(SAMPLE_DIR, [".pdf"]).length;
  if (pdfCount && (!EXTRACT_DIR || !fs.existsSync(EXTRACT_DIR))) {
    console.log(`${pdfCount} PDF(s) found but no extracted images: run the "sample" profile of docker/compose.dev.yml.`);
  } else if (EXTRACT_DIR) {
    const dirs = fs
      .readdirSync(EXTRACT_DIR)
      .map((d) => path.join(EXTRACT_DIR, d))
      .filter((d) => fs.statSync(d).isDirectory())
      .sort();
    for (const dir of dirs) await importPdfPhotos(dir, number++);
  }
  console.log(`Done: ${spreadsheets.length} spreadsheet(s), ${pdfCount} PDF(s). Sample packages are drafts (visible to sellers only).`);
}

main()
  .then(() => sequelize.close())
  .catch(async (err) => {
    console.error(err.message);
    await sequelize.close();
    process.exit(1);
  });
