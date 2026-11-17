"use strict";

// Visibilidade "internal" de anexo: só o vendedor logado vê (nem o comprador com link). Usada pela planilha original
// guardada na importação, que pode ter colunas de valor. Proposta continua nunca pública: restrita ou interna.
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const sql = (q) => queryInterface.sequelize.query(q, { transaction });
      await sql(`ALTER TABLE attachment DROP CONSTRAINT ck_attachment_visibility`);
      await sql(`ALTER TABLE attachment ADD CONSTRAINT ck_attachment_visibility CHECK (visibility IN ('public','restricted','internal'))`);
      await sql(`ALTER TABLE attachment DROP CONSTRAINT ck_attachment_proposal_restricted`);
      await sql(
        `ALTER TABLE attachment ADD CONSTRAINT ck_attachment_proposal_restricted CHECK (kind <> 'proposal' OR visibility IN ('restricted','internal'))`
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const sql = (q) => queryInterface.sequelize.query(q, { transaction });
      await sql(`UPDATE attachment SET visibility = 'restricted' WHERE visibility = 'internal'`);
      await sql(`ALTER TABLE attachment DROP CONSTRAINT ck_attachment_proposal_restricted`);
      await sql(`ALTER TABLE attachment ADD CONSTRAINT ck_attachment_proposal_restricted CHECK (kind <> 'proposal' OR visibility = 'restricted')`);
      await sql(`ALTER TABLE attachment DROP CONSTRAINT ck_attachment_visibility`);
      await sql(`ALTER TABLE attachment ADD CONSTRAINT ck_attachment_visibility CHECK (visibility IN ('public','restricted'))`);
    });
  }
};
