"use strict";

const { User } = require("../models");
const { ValidationError, NotFoundError, ConflictError } = require("../shared/errors");
const { requiredString, oneOf, uuid } = require("../shared/validate");
const { USER_ROLES } = require("../domain/constants");
const { hashPassword, userDto } = require("./auth.service");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Usuários excluídos (deleted_at) não aparecem e não podem ser editados; só voltam por uma nova inclusão do e-mail.
async function list() {
  const users = await User.findAll({ where: { deletedAt: null }, order: [["name", "ASC"]] });
  return users.map(userDto);
}

async function findExisting(id) {
  const user = await User.findOne({ where: { id: uuid(id, "id"), deletedAt: null } });
  if (!user) throw new NotFoundError("User not found.");
  return user;
}

async function create(body) {
  const email = requiredString(body.email, "email").toLowerCase();
  if (!EMAIL_RE.test(email)) throw new ValidationError("Invalid email.", { field: "email", code: "invalid" });
  const name = requiredString(body.name, "name", { max: 120 });
  const role = oneOf(body.role || "seller", "role", USER_ROLES);
  const passwordHash = await hashPassword(body.password);
  const existing = await User.findOne({ where: { email } });
  if (existing && !existing.deletedAt) throw new ConflictError("A user with this email already exists.", { field: "email" }, "EMAIL_TAKEN");
  if (existing) {
    // E-mail de usuário excluído: reativa o mesmo registro, com os dados informados agora (o histórico continua ligado).
    Object.assign(existing, { name, role, passwordHash, active: true, deletedAt: null });
    await existing.save();
    return { ...userDto(existing), reactivated: true };
  }
  const user = await User.create({ email, name, role, passwordHash, active: true });
  return userDto(user);
}

// Exclusão lógica. Ninguém exclui a si mesmo; como só admin ativo exclui, sempre sobra pelo menos um admin ativo.
// A sessão aberta do excluído cai na próxima requisição (viewer.service.js só aceita usuário ativo e não excluído).
async function remove(id, actingUserId) {
  const user = await findExisting(id);
  if (user.id === actingUserId) throw new ValidationError("You cannot delete yourself.", { field: "id", code: "self" }, "USER_DELETE_SELF");
  user.active = false;
  user.deletedAt = new Date();
  await user.save();
}

async function update(id, body, actingUserId) {
  const user = await findExisting(id);
  const isSelf = user.id === actingUserId;

  if (body.name !== undefined) user.name = requiredString(body.name, "name", { max: 120 });
  if (body.role !== undefined) {
    const role = oneOf(body.role, "role", USER_ROLES);
    if (isSelf && role !== "admin") throw new ValidationError("You cannot remove your own administrator role.", { field: "role", code: "self" });
    user.role = role;
  }
  if (body.active !== undefined) {
    if (typeof body.active !== "boolean") throw new ValidationError("Invalid field: active", { field: "active", code: "invalid" });
    if (isSelf && !body.active) throw new ValidationError("You cannot deactivate yourself.", { field: "active", code: "self" });
    user.active = body.active;
  }
  if (body.password) user.passwordHash = await hashPassword(body.password);
  await user.save();
  return userDto(user);
}

module.exports = { list, create, update, remove };
