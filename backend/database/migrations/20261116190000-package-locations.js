"use strict";

// Pacote com vários locais (ex.: precipitador parte na obra, parte em Uberaba, parte no fornecedor) e locais novos:
// Belo Horizonte, "no fornecedor" e "a confirmar". A coluna `location` vira a lista `locations`.
const NEW = ["conceicao_do_araguaia", "uberaba", "niquelandia", "belo_horizonte", "at_supplier", "to_be_confirmed"];
const OLD = ["conceicao_do_araguaia", "uberaba", "niquelandia"];
const list = (values) => values.map((v) => `'${v}'`).join(",");

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const sql = (q) => queryInterface.sequelize.query(q, { transaction });
      await sql(`ALTER TABLE package ADD COLUMN locations varchar(40)[]`);
      await sql(`UPDATE package SET locations = ARRAY[location]`);
      await sql(`ALTER TABLE package ALTER COLUMN locations SET NOT NULL`);
      await sql(`ALTER TABLE package DROP CONSTRAINT ck_package_location`);
      await sql(`ALTER TABLE package DROP COLUMN location`);
      await sql(
        `ALTER TABLE package ADD CONSTRAINT ck_package_locations CHECK (cardinality(locations) >= 1 AND locations <@ ARRAY[${list(NEW)}]::varchar[])`
      );
      await sql(`CREATE INDEX ix_package_locations ON package USING gin (locations)`);
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const sql = (q) => queryInterface.sequelize.query(q, { transaction });
      // Volta ao local único: fica o primeiro local antigo da lista (ou Uberaba, se só houver locais novos).
      await sql(`ALTER TABLE package ADD COLUMN location varchar(40)`);
      await sql(
        `UPDATE package SET location = coalesce((SELECT l FROM unnest(locations) l WHERE l IN (${list(OLD)}) LIMIT 1), 'uberaba')`
      );
      await sql(`ALTER TABLE package ALTER COLUMN location SET NOT NULL`);
      await sql(`ALTER TABLE package ADD CONSTRAINT ck_package_location CHECK (location IN (${list(OLD)}))`);
      await sql(`DROP INDEX ix_package_locations`);
      await sql(`ALTER TABLE package DROP CONSTRAINT ck_package_locations`);
      await sql(`ALTER TABLE package DROP COLUMN locations`);
    });
  }
};
