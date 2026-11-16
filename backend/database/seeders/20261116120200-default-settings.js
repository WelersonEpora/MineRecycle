"use strict";

// Configuração padrão da vitrine: só pacotes ativos. O admin muda na tela Settings.
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(
      `INSERT INTO setting (key, value, updated_at) VALUES ('showcase_statuses', '["active"]'::jsonb, now())
       ON CONFLICT (key) DO NOTHING`
    );
  },

  async down() {}
};
