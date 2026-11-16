"use strict";

const crypto = require("node:crypto");
const jwt = require("jsonwebtoken");
const env = require("../config/env");

// Token do link do comprador: 32 bytes aleatórios. O banco guarda só o SHA-256; o token em claro aparece uma vez,
// na criação do link.
function newLinkToken() {
  return crypto.randomBytes(32).toString("base64url");
}

function hashLinkToken(token) {
  return crypto.createHash("sha256").update(String(token)).digest("hex");
}

// Sessões (cookie httpOnly): `typ` separa vendedor de comprador, para um token não servir no lugar do outro.
function signSession(payload, expiresInSeconds) {
  return jwt.sign(payload, env.jwt.secret, { expiresIn: Math.max(1, Math.floor(expiresInSeconds)) });
}

function verifySession(token, expectedType) {
  const payload = jwt.verify(token, env.jwt.secret);
  if (payload.typ !== expectedType) throw new Error("Wrong session type");
  return payload;
}

module.exports = { newLinkToken, hashLinkToken, signSession, verifySession };
