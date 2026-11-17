"use strict";

// Códigos dos documentos (planilhas) do STOR ligados ao pacote, ex.: {1809438,1809439}. Só a área do vendedor vê; servem
// para conferir, na importação, se a planilha escolhida é deste pacote (o código vem no começo do nome do arquivo).
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const sql = (q) => queryInterface.sequelize.query(q, { transaction });
      await sql(`ALTER TABLE package ADD COLUMN stor_documents varchar(16)[] NOT NULL DEFAULT '{}'`);
      // Cada código tem 7 dígitos (CHECK não aceita subconsulta, então a lista é conferida como texto).
      await sql(
        `ALTER TABLE package ADD CONSTRAINT ck_package_stor_documents CHECK (array_to_string(stor_documents, ',') ~ '^([0-9]{7}(,[0-9]{7})*)?$')`
      );
      await sql(`CREATE INDEX ix_package_stor_documents ON package USING gin (stor_documents)`);
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const sql = (q) => queryInterface.sequelize.query(q, { transaction });
      await sql(`DROP INDEX ix_package_stor_documents`);
      await sql(`ALTER TABLE package DROP CONSTRAINT ck_package_stor_documents`);
      await sql(`ALTER TABLE package DROP COLUMN stor_documents`);
    });
  }
};
