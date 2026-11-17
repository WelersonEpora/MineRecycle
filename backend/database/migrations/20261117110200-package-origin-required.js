"use strict";

// Origem obrigatória no pacote (a migration de dados anterior preencheu todos).
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`ALTER TABLE package ALTER COLUMN origin_id SET NOT NULL`);
  },
  async down(queryInterface) {
    await queryInterface.sequelize.query(`ALTER TABLE package ALTER COLUMN origin_id DROP NOT NULL`);
  }
};
