"use strict";

const { Origin, Package, sequelize } = require("../models");
const { ValidationError, NotFoundError, ConflictError } = require("../shared/errors");
const { requiredString, uuid, isUuid } = require("../shared/validate");

// Cadastro de origens (Configuração, só admin). Sem exclusão: origem fora de uso é desativada e deixa de ser oferecida
// no cadastro de pacote, mas continua nos pacotes que já a usam.

const CODE_RE = /^[A-Z0-9-]{1,10}$/;

function originDto(o, packageCount) {
  return { id: o.id, name: o.name, code: o.code, active: o.active, ...(packageCount === undefined ? {} : { packageCount }) };
}

async function list() {
  const origins = await Origin.findAll({
    attributes: { include: [[sequelize.literal(`(SELECT count(*) FROM package p WHERE p.origin_id = "Origin"."id")::int`), "packageCount"]] },
    order: [["name", "ASC"]]
  });
  return origins.map((o) => originDto(o, o.get("packageCount")));
}

function parse(body, { partial }) {
  const out = {};
  if (!partial || body.name !== undefined) out.name = requiredString(body.name, "name", { max: 120 });
  if (!partial || body.code !== undefined) {
    const code = requiredString(body.code, "code", { max: 10 }).toUpperCase();
    if (!CODE_RE.test(code)) throw new ValidationError("Use up to 10 letters, digits or hyphens.", { field: "code", code: "invalid" });
    out.code = code;
  }
  if (body.active !== undefined) {
    if (typeof body.active !== "boolean") throw new ValidationError("Invalid field: active", { field: "active", code: "invalid" });
    out.active = body.active;
  }
  return out;
}

async function assertCodeFree(code, exceptId) {
  const clash = await Origin.findOne({ where: { code } });
  if (clash && clash.id !== exceptId) throw new ConflictError("Another origin already uses this code.", { field: "code" }, "ORIGIN_CODE_TAKEN");
}

async function create(body) {
  const data = parse(body, { partial: false });
  await assertCodeFree(data.code);
  return originDto(await Origin.create({ ...data, active: data.active ?? true }), 0);
}

async function update(id, body) {
  const origin = await Origin.findByPk(uuid(id, "id"));
  if (!origin) throw new NotFoundError("Origin not found.");
  const data = parse(body, { partial: true });
  if (data.code) await assertCodeFree(data.code, origin.id);
  await origin.update(data);
  return originDto(origin, await Package.count({ where: { originId: origin.id } }));
}

// Origem para gravar no pacote: tem de existir; inativa só vale se o pacote já estava nela.
async function resolveForPackage(originId, currentOriginId = null) {
  const origin = isUuid(originId) ? await Origin.findByPk(originId.toLowerCase()) : null;
  if (!origin) throw new ValidationError("Choose an origin.", { field: "originId", code: "invalid" }, "ORIGIN_INVALID");
  if (!origin.active && origin.id !== currentOriginId) {
    throw new ValidationError("This origin is inactive.", { field: "originId", code: "inactive" }, "ORIGIN_INACTIVE");
  }
  return origin.id;
}

module.exports = { list, create, update, resolveForPackage, originDto };
