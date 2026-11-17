"use strict";

// Pedidos de informação do comprador (decisão de 2026-11-17): um pacote por pedido, todos os campos de contato
// opcionais (o serviço exige ao menos e-mail ou telefone), situação e responsável na equipe. O nome do pacote fica
// copiado no pedido: se o pacote for excluído, o pedido continua legível (package_id vira nulo).
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const sql = (q) => queryInterface.sequelize.query(q, { transaction });
      await sql(`CREATE TABLE inquiry (
        id uuid PRIMARY KEY,
        package_id uuid REFERENCES package (id) ON UPDATE CASCADE ON DELETE SET NULL,
        package_name varchar(200) NOT NULL,
        access_link_id uuid REFERENCES access_link (id) ON UPDATE CASCADE ON DELETE SET NULL,
        name varchar(120),
        company varchar(160),
        email varchar(255),
        phone varchar(40),
        country varchar(80),
        message text,
        language varchar(5) NOT NULL DEFAULT 'en',
        status varchar(16) NOT NULL DEFAULT 'new',
        assigned_to uuid REFERENCES app_user (id) ON UPDATE CASCADE ON DELETE SET NULL,
        note text,
        updated_by uuid REFERENCES app_user (id) ON UPDATE CASCADE ON DELETE SET NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT ck_inquiry_status CHECK (status IN ('new', 'in_progress', 'done', 'discarded')),
        CONSTRAINT ck_inquiry_language CHECK (language IN ('en', 'pt')),
        CONSTRAINT ck_inquiry_contact CHECK (email IS NOT NULL OR phone IS NOT NULL),
        CONSTRAINT ck_inquiry_message CHECK (message IS NULL OR length(message) <= 4000)
      )`);
      await sql(`CREATE INDEX ix_inquiry_status_created ON inquiry (status, created_at DESC)`);
      await sql(`CREATE INDEX ix_inquiry_package ON inquiry (package_id)`);
      await sql(`CREATE INDEX ix_inquiry_assigned ON inquiry (assigned_to)`);
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`DROP TABLE inquiry`);
  }
};
