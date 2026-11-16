"use strict";

// Testes de integração contra um Postgres real (database de teste, nunca o de desenvolvimento):
// aplica as migrations e roda test/integration/*.test.js com MR_TEST_DB=1.
const path = require("node:path");
const fs = require("node:fs");
const { spawnSync } = require("node:child_process");

const root = path.resolve(__dirname, "..");
require("dotenv").config({ path: path.resolve(root, "..", ".env") });

const env = {
  ...process.env,
  MR_TEST_DB: "1",
  NODE_ENV: "test",
  POSTGRES_DATABASE: process.env.POSTGRES_DATABASE_TEST || "minerecycle_test",
  JWT_SECRET: process.env.JWT_SECRET || "integration-test-secret",
  LOG_LEVEL: process.env.LOG_LEVEL || "silent"
};

if (!/test/i.test(env.POSTGRES_DATABASE)) {
  console.error(`Refusing to run: database "${env.POSTGRES_DATABASE}" does not look like a test database.`);
  process.exit(1);
}

const run = (args) => spawnSync(process.execPath, args, { cwd: root, env, stdio: "inherit" });

const migrate = run([require.resolve("sequelize-cli/lib/sequelize"), "db:migrate", "--config", "sequelize.config.js"]);
if (migrate.status !== 0) process.exit(migrate.status || 1);

const dir = path.join(root, "test", "integration");
const files = fs
  .readdirSync(dir)
  .filter((f) => f.endsWith(".test.js"))
  .map((f) => path.join("test", "integration", f));

// Um arquivo por vez: todos usam o mesmo database.
const result = run(["--test", "--test-concurrency=1", ...files]);
process.exit(result.status ?? 1);
