"use strict";

const path = require("node:path");
const dotenv = require("dotenv");
const { readDbConfig } = require("./db-env");

dotenv.config({ path: path.resolve(__dirname, "..", "..", "..", ".env") });

const db = readDbConfig();
for (const key of [...db.requiredKeys, "JWT_SECRET"]) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

const nodeEnv = process.env.NODE_ENV || "development";
const BACKEND_ROOT = path.resolve(__dirname, "..", "..");
// Sessão do vendedor: 12 h, sem refresh (o mesmo critério do FinMind). Uma constante para JWT e cookie.
const SESSION_HOURS = 12;

module.exports = {
  nodeEnv,
  appPort: Number(process.env.APP_PORT || 3000),
  db,
  jwt: { secret: process.env.JWT_SECRET, sessionHours: SESSION_HOURS },
  sessionMaxAgeMs: SESSION_HOURS * 60 * 60 * 1000,
  // Cookie Secure só com HTTPS. No compose local (http://localhost) fica desligado.
  cookieSecure: process.env.COOKIE_SECURE ? process.env.COOKIE_SECURE === "true" : nodeEnv === "production",
  storage: {
    driver: process.env.STORAGE_DRIVER || "local",
    localDir: path.resolve(BACKEND_ROOT, process.env.STORAGE_DIR || "storage/files")
  },
  // Base dos links enviados ao comprador (ex.: https://minerecycle.weslab.com.br).
  publicBaseUrl: (process.env.PUBLIC_BASE_URL || "http://localhost:8084").replace(/\/+$/, ""),
  uploadMaxBytes: Number(process.env.UPLOAD_MAX_MB || 50) * 1024 * 1024,
  logPretty: process.env.LOG_PRETTY === "true"
};
