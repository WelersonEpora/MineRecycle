"use strict";

const pinoHttp = require("pino-http");
const { ValidationError: SequelizeValidationError, UniqueConstraintError, DatabaseError } = require("sequelize");
const { MulterError } = require("multer");
const logger = require("./logger");
const {
  AppError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  TooManyRequestsError,
  PayloadTooLargeError,
  ValidationError
} = require("./errors");
const viewerService = require("../services/viewer.service");

// Log de requisição só com método, caminho e status: nada de corpo nem query string.
const requestLogger = pinoHttp({
  logger,
  autoLogging: { ignore: (req) => req.url === "/health" },
  serializers: {
    req: (req) => ({ method: req.method, url: String(req.url || "").split("?")[0] }),
    res: (res) => ({ statusCode: res.statusCode })
  }
});

// Quem está olhando: vendedor (cookie de sessão), comprador (cookie do link) ou anônimo. Não falha: rotas públicas
// usam `req.viewer` para decidir o que mostrar; as do vendedor usam requireSeller.
async function resolveViewer(req, _res, next) {
  try {
    req.viewer = await viewerService.resolve(req.cookies || {});
    next();
  } catch (err) {
    next(err);
  }
}

function requireSeller(req, _res, next) {
  if (!req.viewer?.seller) return next(new UnauthorizedError("Session missing or expired. Please log in again."));
  return next();
}

function requireAdmin(req, _res, next) {
  if (req.viewer?.seller?.role !== "admin") return next(new ForbiddenError("Administrators only."));
  return next();
}

function requireBuyer(req, _res, next) {
  if (!req.viewer?.link) return next(new UnauthorizedError("Access link missing or expired.", null, "LINK_REQUIRED"));
  return next();
}

// Janela fixa em memória, por IP: uma instância só, sem Redis (mesmo critério do FinMind).
function rateLimit({ windowMs, max, key = (req) => req.ip }) {
  const hits = new Map();
  return function limit(req, _res, next) {
    const id = key(req);
    const now = Date.now();
    const entry = hits.get(id);
    if (!entry || now - entry.start >= windowMs) {
      hits.set(id, { count: 1, start: now });
      return next();
    }
    if (entry.count >= max) return next(new TooManyRequestsError());
    entry.count += 1;
    return next();
  };
}

function notFound(req, _res, next) {
  next(new NotFoundError(`Route not found: ${req.method} ${req.path}`));
}

function errorHandler(err, req, res, _next) {
  const log = req.log || logger;
  let error = err;

  if (err instanceof MulterError) {
    error = err.code === "LIMIT_FILE_SIZE" ? new PayloadTooLargeError() : new ValidationError(err.message, { code: err.code });
  } else if (err instanceof UniqueConstraintError) {
    error = new AppError("A record with the same data already exists.", 409, "CONFLICT", {
      fields: Object.keys(err.fields || {})
    });
  } else if (err instanceof SequelizeValidationError) {
    error = new ValidationError("Invalid data.", err.errors.map((e) => ({ field: e.path, message: e.message })));
  } else if (err instanceof DatabaseError) {
    log.warn({ err: { message: err.message } }, "Database error");
    error = new ValidationError("One or more values have an invalid format.");
  } else if (err?.type === "entity.parse.failed") {
    error = new ValidationError("Malformed JSON body.");
  }

  if (error instanceof AppError) {
    if (error.statusCode >= 500) log.error({ err: error }, error.message);
    return res.status(error.statusCode).json({ error: { code: error.code, message: error.message, details: error.details } });
  }

  log.error({ err }, "Unexpected error");
  return res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Internal server error.", details: null } });
}

module.exports = {
  requestLogger,
  resolveViewer,
  requireSeller,
  requireAdmin,
  requireBuyer,
  rateLimit,
  notFound,
  errorHandler
};
