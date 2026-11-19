"use strict";

// Sai o modelo antigo do pacote (2026-11-19): itens próprios (`package_line`), campos do STOR, tipo (a granel ou
// equipamento) e a lista fixa de locais (os locais passam a vir do site de cada lote). A origem deixa de ser
// obrigatória: os pacotes criados pela importação de lotes não têm de onde tirá-la.
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const sql = (q) => queryInterface.sequelize.query(q, { transaction });
      await sql(`DROP INDEX IF EXISTS ix_attachment_line`);
      await sql(`ALTER TABLE attachment DROP COLUMN line_id`);
      await sql(`DROP TABLE package_line`);
      await sql(`DROP INDEX IF EXISTS ix_package_stor_documents`);
      await sql(`DROP INDEX IF EXISTS ix_package_locations`);
      await sql(`DROP INDEX IF EXISTS uq_package_stor_folder`);
      await sql(`ALTER TABLE package DROP CONSTRAINT IF EXISTS ck_package_stor_numbers`);
      await sql(`ALTER TABLE package DROP CONSTRAINT IF EXISTS ck_package_stor_documents`);
      await sql(`ALTER TABLE package DROP CONSTRAINT IF EXISTS ck_package_stor_documents_pending`);
      await sql(`ALTER TABLE package DROP CONSTRAINT IF EXISTS ck_package_locations`);
      await sql(`ALTER TABLE package DROP CONSTRAINT IF EXISTS ck_package_type`);
      for (const column of ["stor_documents", "stor_documents_pending", "stor_folder", "stor_numbers", "type", "locations"]) {
        await sql(`ALTER TABLE package DROP COLUMN IF EXISTS ${column}`);
      }
      await sql(`ALTER TABLE package ALTER COLUMN origin_id DROP NOT NULL`);
    });
  },

  // Volta só a estrutura (vazia), sem as restrições do STOR: os dados antigos foram apagados na migration anterior.
  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const sql = (q) => queryInterface.sequelize.query(q, { transaction });
      await sql(`DELETE FROM package`);
      await sql(`ALTER TABLE package ALTER COLUMN origin_id SET NOT NULL`);
      await sql(`ALTER TABLE package ADD COLUMN type varchar(16) NOT NULL`);
      await sql(`ALTER TABLE package ADD CONSTRAINT ck_package_type CHECK (type IN ('bulk','equipment'))`);
      await sql(`ALTER TABLE package ADD COLUMN locations varchar(40)[] NOT NULL`);
      await sql(`ALTER TABLE package ADD COLUMN stor_documents varchar(16)[] NOT NULL DEFAULT '{}'`);
      await sql(`ALTER TABLE package ADD COLUMN stor_documents_pending varchar(16)[] NOT NULL DEFAULT '{}'`);
      await sql(`ALTER TABLE package ADD COLUMN stor_folder varchar(200)`);
      await sql(`ALTER TABLE package ADD COLUMN stor_numbers integer[] NOT NULL DEFAULT '{}'`);
      await sql(`CREATE TABLE package_line (
        id uuid PRIMARY KEY,
        package_id uuid NOT NULL REFERENCES package(id) ON DELETE CASCADE ON UPDATE CASCADE,
        parent_line_id uuid REFERENCES package_line(id) ON DELETE SET NULL ON UPDATE CASCADE,
        item_no varchar(40) NOT NULL,
        description text NOT NULL,
        quantity numeric(14,4),
        unit varchar(16),
        unit_raw varchar(32),
        stor_code varchar(64),
        tag varchar(64),
        warehouse_location varchar(128),
        sort_order integer NOT NULL DEFAULT 0,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )`);
      await sql(`ALTER TABLE attachment ADD COLUMN line_id uuid REFERENCES package_line(id) ON DELETE SET NULL ON UPDATE CASCADE`);
    });
  }
};
