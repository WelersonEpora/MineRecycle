"use strict";

// Dados: origens iniciais e a origem de cada pacote (decisão de 2026-11-17). Sem preço, valor ou comprador.
// Idempotente e sem sobrescrever: a origem é criada pela sigla só se não existir (nome e situação editados no sistema
// ficam); o pacote só recebe origem se ainda não tiver uma. Niquelândia (pasta "30-Niquelândia") é VTM; todos os
// outros pacotes, ANM.

const ORIGINS = [
  { code: "ANM", name: "Araguaia Nickel Project" },
  { code: "VTM", name: "Niquelândia" }
];
const BY_FOLDER = { "30-Niquelândia": "VTM" };
const DEFAULT_CODE = "ANM";

module.exports = {
  ORIGINS,
  BY_FOLDER,
  async up(queryInterface) {
    const { sequelize } = queryInterface;
    await sequelize.transaction(async (transaction) => {
      const q = (sql, bind) => sequelize.query(sql, { bind, transaction });
      for (const o of ORIGINS) {
        await q(
          `INSERT INTO origin (id, name, code, active, created_at, updated_at)
           SELECT gen_random_uuid(), $1::varchar, $2::varchar, true, now(), now() WHERE NOT EXISTS (SELECT 1 FROM origin WHERE code = $2::varchar)`,
          [o.name, o.code]
        );
      }
      for (const [folder, code] of Object.entries(BY_FOLDER)) {
        await q(
          `UPDATE package SET origin_id = (SELECT id FROM origin WHERE code = $2::varchar), updated_at = now()
            WHERE stor_folder = $1::varchar AND origin_id IS NULL`,
          [folder, code]
        );
      }
      await q(`UPDATE package SET origin_id = (SELECT id FROM origin WHERE code = $1::varchar), updated_at = now() WHERE origin_id IS NULL`, [
        DEFAULT_CODE
      ]);
    });
  },
  // Dado de negócio: sem volta automática.
  async down() {}
};
