"use strict";

// Exportação dos pacotes para planilha (só vendedores). Lê do banco e entrega à regra pura em export/workbook.js.
const { PackageLine } = require("../models");
const env = require("../config/env");
const packageService = require("./package.service");
const { buildWorkbook, toBuffer, fileName } = require("../export/workbook");
const { langOf } = require("../export/labels");

const LINE_ATTRIBUTES = ["id", "packageId", "parentLineId", "itemNo", "description", "quantity", "unit", "unitRaw", "storCode", "tag", "warehouseLocation"];

async function withLines(packages) {
  const ids = packages.map((p) => p.id);
  const lines = ids.length
    ? await PackageLine.findAll({
        where: { packageId: ids },
        attributes: LINE_ATTRIBUTES,
        order: [["sortOrder", "ASC"], ["itemNo", "ASC"]],
        raw: true
      })
    : [];
  const byPackage = new Map(ids.map((id) => [id, []]));
  for (const l of lines) byPackage.get(l.packageId).push(l);
  return packages.map((p) => ({ ...p, lines: byPackage.get(p.id) }));
}

function build(packages, { lang, number = null }) {
  const l = langOf(lang);
  return { buffer: toBuffer(buildWorkbook(packages, { lang: l, baseUrl: env.publicBaseUrl })), fileName: fileName({ number, lang: l }) };
}

// Lista do vendedor: os mesmos filtros da tela (tipo, origem, local, busca e situação), na mesma ordem.
async function exportList(query = {}) {
  const packages = await packageService.listForSeller(query);
  return build(await withLines(packages), { lang: query.lang });
}

async function exportOne(id, query = {}) {
  const pkg = await packageService.getForSeller(id);
  return build(await withLines([pkg]), { lang: query.lang, number: pkg.number });
}

module.exports = { exportList, exportOne };
