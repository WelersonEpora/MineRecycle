"use strict";

// Origem dos ativos (decisão de 2026-11-17): de onde vieram, diferente de Local (onde estão hoje). Tabela de origens
// (nome, sigla, ativa) e referência no pacote. A coluna nasce aceitando vazio; a migration de dados seguinte preenche e
// a outra depois dela torna obrigatória.
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const sql = (q) => queryInterface.sequelize.query(q, { transaction });
      await sql(`CREATE TABLE origin (
        id uuid PRIMARY KEY,
        name varchar(120) NOT NULL,
        code varchar(10) NOT NULL,
        active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT ck_origin_code CHECK (code ~ '^[A-Z0-9-]{1,10}$'),
        CONSTRAINT ck_origin_name CHECK (length(trim(name)) > 0)
      )`);
      await sql(`CREATE UNIQUE INDEX uq_origin_code ON origin (code)`);
      await sql(`ALTER TABLE package ADD COLUMN origin_id uuid REFERENCES origin (id) ON UPDATE CASCADE ON DELETE RESTRICT`);
      await sql(`CREATE INDEX ix_package_origin ON package (origin_id)`);
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const sql = (q) => queryInterface.sequelize.query(q, { transaction });
      await sql(`ALTER TABLE package DROP COLUMN origin_id`);
      await sql(`DROP TABLE origin`);
    });
  }
};
