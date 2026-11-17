"use strict";

// Identificação do pacote no STOR, separada do nome público:
// - stor_folder: nome da pasta no STOR, grafia original; chave estável dos scripts de dados (única quando preenchida).
//   Só a área do vendedor vê.
// - stor_numbers: números do pacote na planilha de estratégia de vendas (IDs dos ativos). Não são chave: o mesmo número
//   pode estar em mais de um pacote. Ordenam a vitrine e a lista do vendedor; o comprador não os vê.
// - stor_documents_pending: códigos de stor_documents cuja planilha ainda não deve ser importada (aguarda validação).
// O nome (`name`) passa a ser o nome público, em inglês.
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const sql = (q) => queryInterface.sequelize.query(q, { transaction });
      await sql(`ALTER TABLE package ADD COLUMN stor_folder varchar(200)`);
      await sql(`CREATE UNIQUE INDEX uq_package_stor_folder ON package (stor_folder) WHERE stor_folder IS NOT NULL`);
      await sql(`ALTER TABLE package ADD COLUMN stor_numbers integer[] NOT NULL DEFAULT '{}'`);
      await sql(`ALTER TABLE package ADD CONSTRAINT ck_package_stor_numbers CHECK (0 < ALL (stor_numbers) AND 1000 > ALL (stor_numbers))`);
      await sql(`ALTER TABLE package ADD COLUMN stor_documents_pending varchar(16)[] NOT NULL DEFAULT '{}'`);
      await sql(`ALTER TABLE package ADD CONSTRAINT ck_package_stor_documents_pending CHECK (stor_documents_pending <@ stor_documents)`);
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const sql = (q) => queryInterface.sequelize.query(q, { transaction });
      await sql(`ALTER TABLE package DROP CONSTRAINT ck_package_stor_documents_pending`);
      await sql(`ALTER TABLE package DROP COLUMN stor_documents_pending`);
      await sql(`ALTER TABLE package DROP CONSTRAINT ck_package_stor_numbers`);
      await sql(`ALTER TABLE package DROP COLUMN stor_numbers`);
      await sql(`DROP INDEX uq_package_stor_folder`);
      await sql(`ALTER TABLE package DROP COLUMN stor_folder`);
    });
  }
};
