"use strict";

// Categoria do pacote (decisão de 2026-11-17): define cor e ícone do cartão da vitrine quando o pacote não tem foto.
// Os 22 pacotes recebem a categoria na migration de dados seguinte; o vendedor pode trocar no cabeçalho do pacote.
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const sql = (q) => queryInterface.sequelize.query(q, { transaction });
      await sql(`ALTER TABLE package ADD COLUMN category varchar(24) NOT NULL DEFAULT 'other'`);
      await sql(
        `ALTER TABLE package ADD CONSTRAINT ck_package_category
           CHECK (category IN ('refractories', 'electrical', 'piping', 'process_equipment', 'office', 'other'))`
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const sql = (q) => queryInterface.sequelize.query(q, { transaction });
      await sql(`ALTER TABLE package DROP CONSTRAINT ck_package_category`);
      await sql(`ALTER TABLE package DROP COLUMN category`);
    });
  }
};
