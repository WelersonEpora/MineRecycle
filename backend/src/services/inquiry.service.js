"use strict";

const { Op } = require("sequelize");
const { sequelize, Inquiry, Package, User, AccessLink } = require("../models");
const { NotFoundError, ValidationError } = require("../shared/errors");
const { optionalString, oneOf, uuid, isUuid, pagination } = require("../shared/validate");
const { packageAccess, canSendInquiry } = require("../domain/access-policy");
const { INQUIRY_STATUSES } = require("../domain/constants");
const { parseEmail } = require("./contact.service");

// Pedido de informação do comprador (decisão de 2026-11-17). Um pacote por pedido. Nenhum campo é obrigatório
// sozinho, mas é preciso e-mail ou telefone para a equipe responder. Sem campo de preço ou oferta: só a mensagem.
// A equipe atende pelo painel (sem e-mail de aviso por enquanto): situação, responsável e nota interna.

const LANGUAGES = ["en", "pt"];

function parseCreate(body) {
  const data = {
    name: optionalString(body.name, "name", { max: 120 }),
    company: optionalString(body.company, "company", { max: 160 }),
    email: parseEmail(body.email, "email"),
    phone: optionalString(body.phone, "phone", { max: 40 }),
    country: optionalString(body.country, "country", { max: 80 }),
    message: optionalString(body.message, "message", { max: 4000 }),
    language: LANGUAGES.includes(body.language) ? body.language : "en"
  };
  if (!data.email && !data.phone) {
    throw new ValidationError("Enter an email or a phone number.", { field: "email", code: "required" }, "INQUIRY_CONTACT_REQUIRED");
  }
  return data;
}

// Visitante ou comprador com link, sobre um pacote que ele pode ver e que não foi vendido. Pacote fora do alcance dá o
// mesmo 404 de pacote inexistente.
async function create(number, body, viewer) {
  const n = Number(number);
  const pkg = Number.isInteger(n) && n > 0 ? await Package.findOne({ where: { number: n } }) : null;
  const access = packageAccess(pkg, viewer);
  if (!access) throw new NotFoundError("Package not found.");
  if (!canSendInquiry(pkg, access)) {
    throw new ValidationError("This package does not take requests.", null, "INQUIRY_NOT_ALLOWED");
  }
  const data = parseCreate(body || {});
  await Inquiry.create({
    ...data,
    packageId: pkg.id,
    packageName: pkg.name,
    accessLinkId: access === "buyer" ? viewer.link.id : null
  });
}

// ---------- Área do vendedor ----------

const INCLUDE = [
  { model: Package, as: "package", attributes: ["id", "number", "name", "status"] },
  { model: AccessLink, as: "link", attributes: ["id", "label"] },
  { model: User, as: "assignee", attributes: ["id", "name"] },
  { model: User, as: "updater", attributes: ["id", "name"] }
];

function inquiryDto(i) {
  return {
    id: i.id,
    package: i.package
      ? { id: i.package.id, number: i.package.number, name: i.package.name, status: i.package.status }
      : { id: null, number: null, name: i.packageName, status: null },
    link: i.link ? { id: i.link.id, label: i.link.label } : null,
    name: i.name,
    company: i.company,
    email: i.email,
    phone: i.phone,
    country: i.country,
    message: i.message,
    language: i.language,
    status: i.status,
    assignee: i.assignee ? { id: i.assignee.id, name: i.assignee.name } : null,
    note: i.note,
    updatedBy: i.updater ? { id: i.updater.id, name: i.updater.name } : null,
    createdAt: i.createdAt,
    updatedAt: i.updatedAt
  };
}

function escapeLike(s) {
  return s.replace(/[\\%_]/g, (c) => `\\${c}`);
}

const SEARCH_FIELDS = ["name", "company", "email", "phone", "country", "message", "packageName"];

// Filtros: situação ("open" = novo + em atendimento), responsável ("me", "none" ou id), pacote e busca.
function listWhere(query, userId) {
  const where = {};
  if (query.status === "open") where.status = ["new", "in_progress"];
  else if (INQUIRY_STATUSES.includes(query.status)) where.status = query.status;
  if (query.assignee === "me") where.assignedTo = userId;
  else if (query.assignee === "none") where.assignedTo = null;
  else if (isUuid(query.assignee)) where.assignedTo = query.assignee.toLowerCase();
  if (isUuid(query.packageId)) where.packageId = query.packageId.toLowerCase();
  const q = typeof query.q === "string" ? query.q.trim().slice(0, 100) : "";
  if (q) {
    const like = { [Op.iLike]: `%${escapeLike(q)}%` };
    where[Op.or] = SEARCH_FIELDS.map((f) => ({ [f]: like }));
  }
  return where;
}

async function counts() {
  const rows = await Inquiry.findAll({
    attributes: ["status", [sequelize.fn("count", sequelize.col("id")), "n"]],
    group: ["status"],
    raw: true
  });
  const out = Object.fromEntries(INQUIRY_STATUSES.map((s) => [s, 0]));
  for (const r of rows) out[r.status] = Number(r.n);
  return out;
}

async function list(query, userId) {
  const { page, pageSize, offset } = pagination(query, { defaultSize: 25, maxSize: 100 });
  const { rows, count } = await Inquiry.findAndCountAll({
    where: listWhere(query, userId),
    include: INCLUDE,
    order: [["createdAt", "DESC"]],
    limit: pageSize,
    offset
  });
  // Equipe para o campo Responsável: vendedores ativos (a lista de usuários é só do admin).
  const team = await User.findAll({ where: { active: true, deletedAt: null }, attributes: ["id", "name"], order: [["name", "ASC"]] });
  return {
    items: rows.map(inquiryDto),
    total: count,
    page,
    pageSize,
    counts: await counts(),
    team: team.map((u) => ({ id: u.id, name: u.name }))
  };
}

async function findOr404(id) {
  const inquiry = await Inquiry.findByPk(uuid(id, "id"));
  if (!inquiry) throw new NotFoundError("Request not found.");
  return inquiry;
}

// Situação, responsável e nota interna. "Assumir" = assignedTo "me". Pedido novo que ganha responsável passa a "em
// atendimento", a não ser que a situação venha junto.
async function update(id, body, userId) {
  const inquiry = await findOr404(id);
  const data = {};
  if (body.status !== undefined) data.status = oneOf(body.status, "status", INQUIRY_STATUSES);
  if (body.assignedTo !== undefined) {
    if (body.assignedTo === null || body.assignedTo === "") data.assignedTo = null;
    else {
      const uid = body.assignedTo === "me" ? userId : uuid(body.assignedTo, "assignedTo");
      const user = await User.findOne({ where: { id: uid, active: true, deletedAt: null } });
      if (!user) throw new ValidationError("Choose an active user.", { field: "assignedTo", code: "invalid" });
      data.assignedTo = uid;
    }
    if (data.assignedTo && data.status === undefined && inquiry.status === "new") data.status = "in_progress";
  }
  if (body.note !== undefined) data.note = optionalString(body.note, "note", { max: 4000 });
  await inquiry.update({ ...data, updatedBy: userId });
  return inquiryDto(await Inquiry.findByPk(inquiry.id, { include: INCLUDE }));
}

// Exclusão definitiva: spam, ou dado pessoal que não deve ficar.
async function remove(id) {
  const inquiry = await findOr404(id);
  await inquiry.destroy();
}

module.exports = { create, list, counts, update, remove };
