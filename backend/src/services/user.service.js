"use strict";

const { User } = require("../models");
const { ValidationError, NotFoundError, ConflictError } = require("../shared/errors");
const { requiredString, oneOf, uuid } = require("../shared/validate");
const { USER_ROLES } = require("../domain/constants");
const { hashPassword, userDto } = require("./auth.service");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function list() {
  const users = await User.findAll({ order: [["name", "ASC"]] });
  return users.map(userDto);
}

async function create(body) {
  const email = requiredString(body.email, "email").toLowerCase();
  if (!EMAIL_RE.test(email)) throw new ValidationError("Invalid email.", { field: "email", code: "invalid" });
  const name = requiredString(body.name, "name", { max: 120 });
  const role = oneOf(body.role || "seller", "role", USER_ROLES);
  const passwordHash = await hashPassword(body.password);
  if (await User.findOne({ where: { email } })) throw new ConflictError("A user with this email already exists.", { field: "email" }, "EMAIL_TAKEN");
  const user = await User.create({ email, name, role, passwordHash, active: true });
  return userDto(user);
}

async function update(id, body, actingUserId) {
  const user = await User.findByPk(uuid(id, "id"));
  if (!user) throw new NotFoundError("User not found.");
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

module.exports = { list, create, update };
