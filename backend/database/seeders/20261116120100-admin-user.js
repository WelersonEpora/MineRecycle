"use strict";

const { randomUUID } = require("node:crypto");
const bcrypt = require("bcryptjs");

// Usuário administrador inicial, a partir de ADMIN_EMAIL/ADMIN_PASSWORD. Sem senha padrão: falha se faltarem.
// O sequelize-cli registra o seeder como executado, então ele roda uma vez por banco (mesmo padrão do FinMind).
// Dados estruturais apenas: os dados fictícios ficam em `npm run seed:demo`, que nunca roda no deploy.
module.exports = {
  async up(queryInterface) {
    const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD;
    if (!email || !password) {
      throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must be set to create the initial administrator.");
    }

    const now = new Date();
    const passwordHash = await bcrypt.hash(password, 12);
    const [existing] = await queryInterface.sequelize.query("SELECT id FROM app_user WHERE email = :email", {
      replacements: { email },
      type: queryInterface.sequelize.QueryTypes.SELECT
    });

    if (existing) {
      await queryInterface.bulkUpdate("app_user", { role: "admin", active: true, updated_at: now }, { id: existing.id });
      return;
    }
    await queryInterface.bulkInsert("app_user", [
      { id: randomUUID(), email, name: "Administrator", password_hash: passwordHash, role: "admin", active: true, created_at: now, updated_at: now }
    ]);
  },

  async down() {}
};
