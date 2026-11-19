"use strict";

// Lote (2026-11-19): a menor unidade de venda, vinda da aba "Matriz de lotes" da planilha da Horizonte. Os pacotes
// passam a ser agrupamentos de lotes (N:N): automáticos, um por valor das colunas de agrupamento da planilha (sistema
// vinculado, família comercial, subfamília), ou montados pelo vendedor (`manual`).
//
// Situação do lote: vendido quando a planilha diz "Sold" (`sold_by_sheet`, que a importação nunca desfaz) ou quando um
// pacote que o contém é vendido (`lot_sale`); senão, indisponível quando a planilha diz que ele saiu da venda
// ("Collected by court officer"); senão, disponível. `status` guarda o resultado, recalculado pelo sistema.
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const sql = (q) => queryInterface.sequelize.query(q, { transaction });

      await sql(`CREATE TABLE lot (
        id uuid PRIMARY KEY,
        lot_number varchar(40) NOT NULL,
        site_name varchar(120),
        title text NOT NULL,
        master_supplier varchar(200),
        linked_system varchar(200),
        commercial_family varchar(200),
        subfamily varchar(200),
        description text,
        sheet_status varchar(16) NOT NULL DEFAULT 'available',
        sold_by_sheet boolean NOT NULL DEFAULT false,
        status varchar(16) NOT NULL DEFAULT 'available',
        withdrawn_at timestamptz,
        imported_at timestamptz,
        updated_by uuid REFERENCES app_user(id) ON DELETE SET NULL ON UPDATE CASCADE,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT uq_lot_number UNIQUE (lot_number),
        CONSTRAINT ck_lot_number CHECK (btrim(lot_number) <> ''),
        CONSTRAINT ck_lot_sheet_status CHECK (sheet_status IN ('available','sold','unavailable')),
        CONSTRAINT ck_lot_status CHECK (status IN ('available','sold','unavailable')),
        CONSTRAINT ck_lot_sold_by_sheet CHECK (NOT sold_by_sheet OR status = 'sold')
      )`);
      await sql(`CREATE INDEX ix_lot_status ON lot (status)`);

      await sql(`ALTER TABLE package ADD COLUMN source varchar(16) NOT NULL DEFAULT 'manual'`);
      await sql(`ALTER TABLE package ADD COLUMN source_value varchar(200)`);
      await sql(
        `ALTER TABLE package ADD CONSTRAINT ck_package_source CHECK (source IN ('manual','linked_system','family','subfamily'))`
      );
      // Pacote automático: identificado pelo nível e pelo valor da coluna; manual não tem valor.
      await sql(
        `ALTER TABLE package ADD CONSTRAINT ck_package_source_value CHECK ((source = 'manual') = (source_value IS NULL))`
      );
      // Mesmo valor com outra caixa ou espaços ("Cables" e "cables ") é o mesmo pacote.
      await sql(
        `CREATE UNIQUE INDEX uq_package_source_value ON package (source, lower(source_value)) WHERE source <> 'manual'`
      );

      await sql(`CREATE TABLE package_lot (
        package_id uuid NOT NULL REFERENCES package(id) ON DELETE CASCADE ON UPDATE CASCADE,
        lot_id uuid NOT NULL REFERENCES lot(id) ON DELETE CASCADE ON UPDATE CASCADE,
        position integer NOT NULL DEFAULT 0,
        created_at timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY (package_id, lot_id)
      )`);
      await sql(`CREATE INDEX ix_package_lot_lot ON package_lot (lot_id)`);

      // Pacotes vendidos que contêm o lote: desfazer a venda de um pacote só libera os lotes vendidos por ele.
      await sql(`CREATE TABLE lot_sale (
        lot_id uuid NOT NULL REFERENCES lot(id) ON DELETE CASCADE ON UPDATE CASCADE,
        package_id uuid NOT NULL REFERENCES package(id) ON DELETE CASCADE ON UPDATE CASCADE,
        created_by uuid REFERENCES app_user(id) ON DELETE SET NULL ON UPDATE CASCADE,
        created_at timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY (lot_id, package_id)
      )`);
      await sql(`CREATE INDEX ix_lot_sale_package ON lot_sale (package_id)`);

      // Anexo de um pacote ou de um lote (que acompanha o lote em todos os pacotes), nunca dos dois.
      await sql(`ALTER TABLE attachment ALTER COLUMN package_id DROP NOT NULL`);
      await sql(`ALTER TABLE attachment ADD COLUMN lot_id uuid REFERENCES lot(id) ON DELETE CASCADE ON UPDATE CASCADE`);
      await sql(`ALTER TABLE attachment ADD CONSTRAINT ck_attachment_owner CHECK (num_nonnulls(package_id, lot_id) = 1)`);
      await sql(`CREATE INDEX ix_attachment_lot ON attachment (lot_id, sort_order)`);
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const sql = (q) => queryInterface.sequelize.query(q, { transaction });
      await sql(`DELETE FROM attachment WHERE lot_id IS NOT NULL`);
      await sql(`DROP INDEX ix_attachment_lot`);
      await sql(`ALTER TABLE attachment DROP CONSTRAINT ck_attachment_owner`);
      await sql(`ALTER TABLE attachment DROP COLUMN lot_id`);
      await sql(`ALTER TABLE attachment ALTER COLUMN package_id SET NOT NULL`);
      await sql(`DROP TABLE lot_sale`);
      await sql(`DROP TABLE package_lot`);
      await sql(`DROP INDEX uq_package_source_value`);
      await sql(`ALTER TABLE package DROP CONSTRAINT ck_package_source_value`);
      await sql(`ALTER TABLE package DROP CONSTRAINT ck_package_source`);
      await sql(`ALTER TABLE package DROP COLUMN source_value`);
      await sql(`ALTER TABLE package DROP COLUMN source`);
      await sql(`DROP TABLE lot`);
    });
  }
};
