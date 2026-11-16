"use strict";

const pino = require("pino");
const env = require("../config/env");

// Nada de cookie, cabeçalho de autorização ou token de link nos logs. Conteúdo e nome de arquivo enviado também
// não são logados em lugar nenhum (os dados do cliente são confidenciais).
const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  redact: {
    paths: [
      "req.headers.cookie",
      "req.headers.authorization",
      'res.headers["set-cookie"]',
      "token",
      "*.token",
      "password",
      "*.password"
    ],
    censor: "[redacted]"
  },
  transport: env.logPretty ? { target: "pino-pretty" } : undefined
});

module.exports = logger;
