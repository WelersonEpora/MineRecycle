"use strict";

// Exportação dos pacotes para planilha (só vendedores). Lê do banco e entrega à regra pura em export/workbook.js.
const { PackageLine, Origin } = require("../models");
const { isUuid } = require("../shared/validate");
const { PACKAGE_TYPES, LOCATIONS, PACKAGE_STATUSES } = require("../domain/constants");
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

function build(packages, { lang, pkg = null, filters = {} }) {
  const l = langOf(lang);
  return { buffer: toBuffer(buildWorkbook(packages, { lang: l, baseUrl: env.publicBaseUrl })), fileName: fileName({ pkg, filters, lang: l }) };
}

// Filtros da lista para o nome do arquivo: só valores válidos (o resto da URL não entra no nome); origem pela sigla.
async function filtersForName(query) {
  const pick = (value, allowed) => (allowed.includes(value) ? value : null);
  const origin = isUuid(query.originId) ? await Origin.findByPk(query.originId.toLowerCase(), { attributes: ["code"] }) : null;
  return {
    type: pick(query.type, PACKAGE_TYPES),
    location: pick(query.location, LOCATIONS),
    status: pick(query.status, PACKAGE_STATUSES),
    originCode: origin?.code || null,
    q: typeof query.q === "string" ? query.q.trim() : ""
  };
}

// Lista do vendedor: os mesmos filtros da tela (tipo, origem, local, busca e situação), na mesma ordem.
async function exportList(query = {}) {
  const packages = await packageService.listForSeller(query);
  return build(await withLines(packages), { lang: query.lang, filters: await filtersForName(query) });
}

async function exportOne(id, query = {}) {
  const pkg = await packageService.getForSeller(id);
  return build(await withLines([pkg]), { lang: query.lang, pkg });
}

module.exports = { exportList, exportOne };
