"use strict";

// Pedidos (decisão de 2026-11-17, segunda parte): canal de entrada (o formulário ou um contato direto que o vendedor
// registra à mão), quem registrou e o desfecho, que só existe em pedido concluído.
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const sql = (q) => queryInterface.sequelize.query(q, { transaction });
      await sql(`ALTER TABLE inquiry
        ADD COLUMN channel varchar(16) NOT NULL DEFAULT 'form',
        ADD COLUMN outcome varchar(16),
        ADD COLUMN created_by uuid REFERENCES app_user (id) ON UPDATE CASCADE ON DELETE SET NULL,
        ADD CONSTRAINT ck_inquiry_channel CHECK (channel IN ('form', 'email', 'whatsapp', 'phone', 'other')),
        ADD CONSTRAINT ck_inquiry_outcome CHECK (outcome IS NULL OR outcome IN ('sold', 'not_pursued', 'no_reply')),
        ADD CONSTRAINT ck_inquiry_outcome_done CHECK (outcome IS NULL OR status = 'done')`);
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`ALTER TABLE inquiry DROP COLUMN created_by, DROP COLUMN outcome, DROP COLUMN channel`);
  }
};
