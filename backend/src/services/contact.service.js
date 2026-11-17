"use strict";

const { Setting } = require("../models");
const { ValidationError } = require("../shared/errors");
const { optionalString } = require("../shared/validate");

// Contato comercial da equipe (decisão de 2026-11-17): um e-mail e um WhatsApp, mostrados na página do pacote ao lado
// do formulário de pedido. Fica na tabela setting (chave "contact"); só admin altera.
const KEY = "contact";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseEmail(value, field) {
  const email = optionalString(value, field, { max: 255 });
  if (email && !EMAIL_RE.test(email)) throw new ValidationError("Invalid email.", { field, code: "invalid" }, "EMAIL_INVALID");
  return email ? email.toLowerCase() : null;
}

// WhatsApp: só dígitos, com o código do país (o wa.me exige assim). Aceita "+55 (11) 99999-9999".
function parseWhatsapp(value) {
  const raw = optionalString(value, "whatsapp", { max: 40 });
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 15) {
    throw new ValidationError("Use the full number with country code.", { field: "whatsapp", code: "invalid" }, "WHATSAPP_INVALID");
  }
  return digits;
}

async function get() {
  const row = await Setting.findByPk(KEY);
  return { email: row?.value?.email || null, whatsapp: row?.value?.whatsapp || null };
}

async function set(body, userId) {
  const value = { email: parseEmail(body.email, "email"), whatsapp: parseWhatsapp(body.whatsapp) };
  await Setting.upsert({ key: KEY, value, updatedBy: userId });
  return value;
}

module.exports = { get, set, parseEmail };
