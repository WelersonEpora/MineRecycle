"use strict";

const bcrypt = require("bcryptjs");
const { User } = require("../models");
const { UnauthorizedError, ValidationError } = require("../shared/errors");
const { signSession } = require("../shared/tokens");
const env = require("../config/env");

// Tamanho mínimo da senha (decisão do usuário em 2026-11-17: a partir de 9 caracteres).
const MIN_PASSWORD_LENGTH = 9;

// Hash fixo para comparar quando o e-mail não existe: o tempo de resposta não revela quais e-mails têm conta.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 12);

function userDto(user) {
  return { id: user.id, email: user.email, name: user.name, role: user.role, active: user.active, lastLoginAt: user.lastLoginAt };
}

async function login(email, password) {
  if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
    throw new ValidationError("Email and password are required.");
  }
  const user = await User.findOne({ where: { email: email.trim().toLowerCase() } });
  const ok = await bcrypt.compare(password, user ? user.passwordHash : DUMMY_HASH);
  if (!user || !ok || !user.active || user.deletedAt) throw new UnauthorizedError("Invalid email or password.", null, "INVALID_CREDENTIALS");

  user.lastLoginAt = new Date();
  await user.save();
  const token = signSession({ typ: "seller", sub: user.id }, env.sessionMaxAgeMs / 1000);
  return { token, user: userDto(user) };
}

async function changeOwnPassword(userId, currentPassword, newPassword) {
  const user = await User.findByPk(userId);
  if (!user || !(await bcrypt.compare(String(currentPassword || ""), user.passwordHash))) {
    throw new ValidationError("Current password is incorrect.", { field: "currentPassword", code: "invalid" });
  }
  user.passwordHash = await hashPassword(newPassword);
  await user.save();
}

async function hashPassword(password) {
  if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH || password.length > 200) {
    throw new ValidationError(`Password must have at least ${MIN_PASSWORD_LENGTH} characters.`, { field: "password", code: "too_short" });
  }
  return bcrypt.hash(password, 12);
}

module.exports = { login, changeOwnPassword, hashPassword, userDto };
