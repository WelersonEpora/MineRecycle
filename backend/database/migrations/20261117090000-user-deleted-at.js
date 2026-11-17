"use strict";

// Exclusão lógica de usuário (decisão de 2026-11-17): deleted_at preenchido = excluído. O registro fica para manter o
// histórico (links criados, arquivos enviados, configuração alterada). Excluído também fica inativo, então não entra.
// Incluir de novo o mesmo e-mail reativa o registro (user.service.js).
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const sql = (q) => queryInterface.sequelize.query(q, { transaction });
      await sql(`ALTER TABLE app_user ADD COLUMN deleted_at timestamptz`);
      await sql(`ALTER TABLE app_user ADD CONSTRAINT ck_app_user_deleted_inactive CHECK (deleted_at IS NULL OR active = false)`);
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const sql = (q) => queryInterface.sequelize.query(q, { transaction });
      await sql(`ALTER TABLE app_user DROP CONSTRAINT ck_app_user_deleted_inactive`);
      await sql(`ALTER TABLE app_user DROP COLUMN deleted_at`);
    });
  }
};
