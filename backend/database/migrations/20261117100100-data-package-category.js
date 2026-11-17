"use strict";

// Dados: categoria de cada pacote, pela pasta no STOR (chave estável). Sem preço, valor ou comprador.
// Idempotente e sem sobrescrever o vendedor: só grava se a categoria ainda for a padrão ("other") e diferente da
// prevista. Pacote que não existir é ignorado. Os que ficam em "other" (estrutura metálica, materiais de construção,
// outros equipamentos, caminhonetes) não precisam de linha aqui.

const CATEGORIES = {
  "1-6 Refractories – Conceição do Araguaia": "refractories",
  "1-6 Refractories – Porto Seco de Uberaba": "refractories",
  "24-LT 230kV": "electrical",
  "25-26 Electrical Substation Equipment": "electrical",
  "27-Electrical Cables": "electrical",
  "27-Electrical Materials": "electrical",
  "28-Pipping": "piping",
  "7-8-11 Crushers": "process_equipment",
  "9-10-12 Dryer": "process_equipment",
  "10-12-13 Kiln": "process_equipment",
  "17-Laboratory": "process_equipment",
  "29-Conveyors": "process_equipment",
  "30-Niquelândia": "process_equipment",
  "32-Compressed Air": "process_equipment",
  "32-ETE ETA": "process_equipment",
  "Módulos Escritório": "office",
  "TI e Escritório": "office"
};

module.exports = {
  CATEGORIES,
  async up(queryInterface) {
    const { sequelize } = queryInterface;
    await sequelize.transaction(async (transaction) => {
      for (const [folder, category] of Object.entries(CATEGORIES)) {
        await sequelize.query(
          `UPDATE package SET category = $2, updated_at = now() WHERE stor_folder = $1 AND category = 'other' AND category <> $2`,
          { bind: [folder, category], transaction }
        );
      }
    });
  },
  // Dado de negócio: sem volta automática (o vendedor pode já ter trocado a categoria).
  async down() {}
};
