"use strict";

// Ajuste manual da situação do lote (decisão de 2026-11-24). O vendedor pode fixar a situação de um lote na tela
// (disponível, vendido ou fora da venda), com nota opcional; o ajuste vale até a planilha mudar o STATUS daquele lote
// numa reimportação. A venda por pacote continua mandando: lote vendido por pacote não aceita ajuste.
//
// - manual_status: a situação escolhida (NULL = segue a planilha e as vendas, como antes).
// - manual_status_note/_by/_at: nota, quem ajustou e quando.
// - ck_lot_sold_by_sheet: "vendido pela planilha" deixa de obrigar status 'sold' quando há ajuste manual.
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const sql = (q) => queryInterface.sequelize.query(q, { transaction });
      await sql(`ALTER TABLE lot
        ADD COLUMN manual_status varchar(16),
        ADD COLUMN manual_status_note text,
        ADD COLUMN manual_status_by uuid REFERENCES app_user(id) ON DELETE SET NULL ON UPDATE CASCADE,
        ADD COLUMN manual_status_at timestamptz`);
      await sql(`ALTER TABLE lot ADD CONSTRAINT ck_lot_manual_status CHECK (manual_status IS NULL OR manual_status IN ('available','sold','unavailable'))`);
      await sql(`ALTER TABLE lot ADD CONSTRAINT ck_lot_manual_status_at CHECK ((manual_status IS NULL) = (manual_status_at IS NULL))`);
      await sql(`ALTER TABLE lot DROP CONSTRAINT ck_lot_sold_by_sheet`);
      await sql(`ALTER TABLE lot ADD CONSTRAINT ck_lot_sold_by_sheet CHECK (NOT sold_by_sheet OR status = 'sold' OR manual_status IS NOT NULL)`);
    });
  },

  // A volta descarta os ajustes manuais e recalcula a situação como antes (vendido pela planilha ou por pacote,
  // senão fora da venda pela planilha, senão disponível).
  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const sql = (q) => queryInterface.sequelize.query(q, { transaction });
      await sql(`UPDATE lot SET status = CASE
          WHEN sold_by_sheet OR EXISTS (SELECT 1 FROM lot_sale s WHERE s.lot_id = lot.id) THEN 'sold'
          WHEN sheet_status = 'unavailable' THEN 'unavailable'
          ELSE 'available' END
        WHERE manual_status IS NOT NULL`);
      await sql(`ALTER TABLE lot DROP CONSTRAINT ck_lot_sold_by_sheet`);
      await sql(`ALTER TABLE lot ADD CONSTRAINT ck_lot_sold_by_sheet CHECK (NOT sold_by_sheet OR status = 'sold')`);
      await sql(`ALTER TABLE lot DROP CONSTRAINT ck_lot_manual_status_at`);
      await sql(`ALTER TABLE lot DROP CONSTRAINT ck_lot_manual_status`);
      await sql(`ALTER TABLE lot DROP COLUMN manual_status_at, DROP COLUMN manual_status_by, DROP COLUMN manual_status_note, DROP COLUMN manual_status`);
    });
  }
};
