"use strict";

// Configuração antiga do catálogo (situações visíveis). Sem uso desde 2026-11-17: a regra agora é fixa
// (PUBLIC_STATUSES em domain/constants.js). O registro continua no banco, sem efeito.
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(
      `INSERT INTO setting (key, value, updated_at) VALUES ('showcase_statuses', '["active"]'::jsonb, now())
       ON CONFLICT (key) DO NOTHING`
    );
  },

  async down() {}
};
