"use strict";

// Schema inicial do MineRecycle (PostgreSQL 16).
module.exports = {
  async up(queryInterface, Sequelize) {
    const { DataTypes } = Sequelize;
    const timestamps = {
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.fn("now") },
      updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.fn("now") }
    };
    const uuidPk = { type: DataTypes.UUID, primaryKey: true, allowNull: false };
    const fk = (table, onDelete) => ({ references: { model: table, key: "id" }, onDelete, onUpdate: "CASCADE" });

    await queryInterface.sequelize.transaction(async (transaction) => {
      const opts = { transaction };

      await queryInterface.createTable(
        "app_user",
        {
          id: uuidPk,
          email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
          name: { type: DataTypes.STRING(120), allowNull: false },
          password_hash: { type: DataTypes.STRING(100), allowNull: false },
          role: { type: DataTypes.STRING(16), allowNull: false, defaultValue: "seller" },
          active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
          last_login_at: { type: DataTypes.DATE },
          ...timestamps
        },
        opts
      );

      await queryInterface.createTable(
        "package",
        {
          id: uuidPk,
          number: { type: DataTypes.INTEGER, allowNull: false, unique: true },
          name: { type: DataTypes.STRING(200), allowNull: false },
          type: { type: DataTypes.STRING(16), allowNull: false },
          description: { type: DataTypes.TEXT },
          location: { type: DataTypes.STRING(40), allowNull: false },
          status: { type: DataTypes.STRING(24), allowNull: false, defaultValue: "draft" },
          created_by: { type: DataTypes.UUID, ...fk("app_user", "SET NULL") },
          updated_by: { type: DataTypes.UUID, ...fk("app_user", "SET NULL") },
          ...timestamps
        },
        opts
      );

      await queryInterface.createTable(
        "package_line",
        {
          id: uuidPk,
          package_id: { type: DataTypes.UUID, allowNull: false, ...fk("package", "CASCADE") },
          parent_line_id: { type: DataTypes.UUID, ...fk("package_line", "SET NULL") },
          item_no: { type: DataTypes.STRING(40), allowNull: false },
          description: { type: DataTypes.TEXT, allowNull: false },
          quantity: { type: DataTypes.DECIMAL(14, 4) },
          unit: { type: DataTypes.STRING(16) },
          unit_raw: { type: DataTypes.STRING(32) },
          stor_code: { type: DataTypes.STRING(64) },
          tag: { type: DataTypes.STRING(64) },
          warehouse_location: { type: DataTypes.STRING(128) },
          sort_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
          ...timestamps
        },
        opts
      );

      await queryInterface.createTable(
        "attachment",
        {
          id: uuidPk,
          package_id: { type: DataTypes.UUID, allowNull: false, ...fk("package", "CASCADE") },
          // Anexo de uma linha: se a linha some (reimportação), o anexo continua no pacote (SET NULL).
          line_id: { type: DataTypes.UUID, ...fk("package_line", "SET NULL") },
          kind: { type: DataTypes.STRING(16), allowNull: false },
          visibility: { type: DataTypes.STRING(16), allowNull: false, defaultValue: "restricted" },
          title: { type: DataTypes.STRING(200) },
          original_name: { type: DataTypes.STRING(255), allowNull: false },
          mime_type: { type: DataTypes.STRING(120), allowNull: false },
          size_bytes: { type: DataTypes.BIGINT, allowNull: false },
          storage_key: { type: DataTypes.STRING(300), allowNull: false },
          web_key: { type: DataTypes.STRING(300) },
          thumb_key: { type: DataTypes.STRING(300) },
          width: { type: DataTypes.INTEGER },
          height: { type: DataTypes.INTEGER },
          sort_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
          uploaded_by: { type: DataTypes.UUID, ...fk("app_user", "SET NULL") },
          ...timestamps
        },
        opts
      );

      await queryInterface.createTable(
        "access_link",
        {
          id: uuidPk,
          token_hash: { type: DataTypes.STRING(64), allowNull: false, unique: true },
          label: { type: DataTypes.STRING(200), allowNull: false },
          buyer_email: { type: DataTypes.STRING(255) },
          note: { type: DataTypes.TEXT },
          expires_at: { type: DataTypes.DATE, allowNull: false },
          revoked_at: { type: DataTypes.DATE },
          created_by: { type: DataTypes.UUID, ...fk("app_user", "SET NULL") },
          ...timestamps
        },
        opts
      );

      await queryInterface.createTable(
        "access_link_package",
        {
          access_link_id: { type: DataTypes.UUID, primaryKey: true, ...fk("access_link", "CASCADE") },
          package_id: { type: DataTypes.UUID, primaryKey: true, ...fk("package", "CASCADE") }
        },
        opts
      );

      await queryInterface.createTable(
        "access_log",
        {
          id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
          access_link_id: { type: DataTypes.UUID, allowNull: false, ...fk("access_link", "CASCADE") },
          action: { type: DataTypes.STRING(24), allowNull: false },
          package_id: { type: DataTypes.UUID, ...fk("package", "SET NULL") },
          attachment_id: { type: DataTypes.UUID, ...fk("attachment", "SET NULL") },
          ip: { type: DataTypes.STRING(64) },
          user_agent: { type: DataTypes.STRING(512) },
          created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.fn("now") }
        },
        opts
      );

      await queryInterface.createTable(
        "setting",
        {
          key: { type: DataTypes.STRING(64), primaryKey: true },
          value: { type: DataTypes.JSONB, allowNull: false },
          updated_by: { type: DataTypes.UUID, ...fk("app_user", "SET NULL") },
          updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.fn("now") }
        },
        opts
      );

      const sql = (q) => queryInterface.sequelize.query(q, opts);
      // Valores de domínio garantidos também no banco.
      await sql(`ALTER TABLE app_user ADD CONSTRAINT ck_user_role CHECK (role IN ('seller','admin'))`);
      await sql(`ALTER TABLE package ADD CONSTRAINT ck_package_type CHECK (type IN ('bulk','equipment'))`);
      await sql(
        `ALTER TABLE package ADD CONSTRAINT ck_package_location CHECK (location IN ('conceicao_do_araguaia','uberaba','niquelandia'))`
      );
      await sql(
        `ALTER TABLE package ADD CONSTRAINT ck_package_status CHECK (status IN ('draft','active','under_negotiation','sold','inactive'))`
      );
      await sql(`ALTER TABLE package_line ADD CONSTRAINT ck_line_quantity CHECK (quantity IS NULL OR quantity >= 0)`);
      await sql(
        `ALTER TABLE attachment ADD CONSTRAINT ck_attachment_kind CHECK (kind IN ('photo','datasheet','drawing','list','proposal'))`
      );
      await sql(`ALTER TABLE attachment ADD CONSTRAINT ck_attachment_visibility CHECK (visibility IN ('public','restricted'))`);
      await sql(
        `ALTER TABLE attachment ADD CONSTRAINT ck_attachment_proposal_restricted CHECK (kind <> 'proposal' OR visibility = 'restricted')`
      );

      // A chave de uma linha é pacote + nº do item. O código STOR pode se repetir (índice simples).
      await queryInterface.addIndex("package_line", ["package_id", "item_no"], { unique: true, name: "uq_line_package_item", ...opts });
      await queryInterface.addIndex("package_line", ["package_id", "sort_order"], { name: "ix_line_package_sort", ...opts });
      await queryInterface.addIndex("package_line", ["stor_code"], { name: "ix_line_stor_code", ...opts });
      await queryInterface.addIndex("package", ["status"], { name: "ix_package_status", ...opts });
      await queryInterface.addIndex("attachment", ["package_id", "sort_order"], { name: "ix_attachment_package", ...opts });
      await queryInterface.addIndex("attachment", ["line_id"], { name: "ix_attachment_line", ...opts });
      await queryInterface.addIndex("access_link_package", ["package_id"], { name: "ix_alp_package", ...opts });
      await queryInterface.addIndex("access_log", ["access_link_id", "created_at"], { name: "ix_access_log_link", ...opts });
    });
  },

  async down(queryInterface) {
    for (const table of ["access_log", "access_link_package", "access_link", "attachment", "package_line", "setting", "package", "app_user"]) {
      await queryInterface.dropTable(table);
    }
  }
};
