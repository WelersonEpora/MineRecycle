"use strict";

const { AccessLog } = require("../models");
const logger = require("../shared/logger");

// Registro de acessos pelo link do comprador. Uma falha aqui não derruba o que o comprador está fazendo.
async function record(accessLinkId, action, { packageId = null, attachmentId = null } = {}, req = null) {
  try {
    await AccessLog.create({
      accessLinkId,
      action,
      packageId,
      attachmentId,
      ip: req?.ip ? String(req.ip).slice(0, 64) : null,
      userAgent: req?.get ? String(req.get("user-agent") || "").slice(0, 512) || null : null
    });
  } catch (err) {
    logger.warn({ err: { message: err.message }, action }, "Could not record access log");
  }
}

module.exports = { record };
