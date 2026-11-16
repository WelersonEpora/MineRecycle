"use strict";

const { ValidationError } = require("./errors");

// Validações pequenas de entrada da API. Cada falha vira 400 com o campo em `details`.
function fail(field, code) {
  throw new ValidationError(`Invalid field: ${field}`, { field, code });
}

function requiredString(value, field, { max = 255, min = 1 } = {}) {
  if (typeof value !== "string") fail(field, "required");
  const trimmed = value.trim();
  if (trimmed.length < min) fail(field, "required");
  if (trimmed.length > max) fail(field, "too_long");
  return trimmed;
}

function optionalString(value, field, { max = 255 } = {}) {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") fail(field, "invalid");
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.length > max) fail(field, "too_long");
  return trimmed;
}

function oneOf(value, field, allowed) {
  if (!allowed.includes(value)) fail(field, "invalid");
  return value;
}

function positiveInt(value, field, { max = Number.MAX_SAFE_INTEGER } = {}) {
  const n = typeof value === "string" && value.trim() !== "" ? Number(value) : value;
  if (!Number.isInteger(n) || n < 1 || n > max) fail(field, "invalid");
  return n;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function uuid(value, field) {
  if (typeof value !== "string" || !UUID_RE.test(value)) fail(field, "invalid");
  return value.toLowerCase();
}

function isUuid(value) {
  return typeof value === "string" && UUID_RE.test(value);
}

function pagination(query, { defaultSize = 25, maxSize = 200 } = {}) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const pageSize = Math.min(maxSize, Math.max(1, Number.parseInt(query.pageSize, 10) || defaultSize));
  return { page, pageSize, offset: (page - 1) * pageSize };
}

module.exports = { fail, requiredString, optionalString, oneOf, positiveInt, uuid, isUuid, pagination };
