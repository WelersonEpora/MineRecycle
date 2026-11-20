"use strict";

const bcrypt = require("bcryptjs");
const { sequelize, Lot, Package, Attachment, Inquiry, AccessLink, Setting, User } = require("../models");
const { storage } = require("../storage");
const { ValidationError } = require("../shared/errors");
const logger = require("../shared/logger");
const { isResetPhrase, RESET_TABLES, RESET_STORAGE_PREFIXES } = require("../domain/data-reset");
const { LOCK_KEY } = require("./lot-import.service");

// Limpeza geral (decisão de 2026-11-19): só admin, em Configuração. Apaga lotes, pacotes, anexos (registros e
// arquivos), pedidos e links de comprador; ficam usuários, contato comercial e origens. A numeração recomeça.
const KEY = "data_reset";

async function counts(transaction) {
  const [lots, packages, attachments, attachmentBytes, inquiries, accessLinks] = await Promise.all([
    Lot.count({ transaction }),
    Package.count({ transaction }),
    Attachment.count({ transaction }),
    Attachment.sum("sizeBytes", { transaction }),
    Inquiry.count({ transaction }),
    AccessLink.count({ transaction })
  ]);
  return { lots, packages, attachments, attachmentBytes: Number(attachmentBytes) || 0, inquiries, accessLinks };
}

// O que a limpeza apagaria agora e a última limpeza feita (quem e quando).
async function summary() {
  const row = await Setting.findByPk(KEY);
  return { counts: await counts(), lastReset: row?.value || null };
}

async function run(body, userId) {
  if (!isResetPhrase(body.confirm)) {
    throw new ValidationError("Type the confirmation phrase.", { field: "confirm", code: "invalid" }, "RESET_CONFIRM_INVALID");
  }
  const user = await User.findByPk(userId);
  if (!user || !(await bcrypt.compare(String(body.password || ""), user.passwordHash))) {
    throw new ValidationError("Password is incorrect.", { field: "password", code: "invalid" }, "RESET_PASSWORD_INVALID");
  }

  // Mesma trava da importação de lotes: uma importação confirmada no meio da limpeza não se cruza com ela.
  const deleted = await sequelize.transaction(async (transaction) => {
    await sequelize.query(`SELECT pg_advisory_xact_lock(${LOCK_KEY})`, { transaction });
    const before = await counts(transaction);
    await sequelize.query(`TRUNCATE ${RESET_TABLES.join(", ")} RESTART IDENTITY`, { transaction });
    const value = { at: new Date().toISOString(), userId: user.id, userName: user.name, counts: before };
    await Setting.upsert({ key: KEY, value, updatedBy: user.id }, { transaction });
    return before;
  });

  // Arquivos só depois de gravado: se algo falhar aqui, os dados já estão limpos e `npm run files:orphans` recolhe
  // o que sobrar.
  let filesRemoved = true;
  for (const prefix of RESET_STORAGE_PREFIXES) {
    try {
      await storage.removePrefix(prefix);
    } catch (err) {
      filesRemoved = false;
      logger.error({ err: { message: err.message }, prefix }, "Data reset: could not remove stored files");
    }
  }
  logger.warn({ userId: user.id, counts: deleted }, "Data reset done");
  return { deleted, filesRemoved };
}

module.exports = { summary, run };
