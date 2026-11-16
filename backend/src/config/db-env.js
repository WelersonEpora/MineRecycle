"use strict";

// Conexão com o PostgreSQL (POSTGRES_*). Em produção é o Postgres compartilhado da VM (servidor02-infra),
// com database e usuário próprios do MineRecycle. Usado pelo servidor e pelo sequelize-cli.
const REQUIRED_KEYS = ["POSTGRES_HOST", "POSTGRES_PORT", "POSTGRES_DATABASE", "POSTGRES_USER", "POSTGRES_PASSWORD"];

function readDbConfig(source = process.env) {
  return {
    dialect: "postgres",
    host: source.POSTGRES_HOST,
    port: Number(source.POSTGRES_PORT || 5432),
    database: source.POSTGRES_DATABASE,
    username: source.POSTGRES_USER,
    password: source.POSTGRES_PASSWORD,
    requiredKeys: REQUIRED_KEYS
  };
}

module.exports = { readDbConfig };
