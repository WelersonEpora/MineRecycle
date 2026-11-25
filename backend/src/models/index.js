"use strict";

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const id = { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true };

const User = sequelize.define(
  "User",
  {
    id,
    email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
    name: { type: DataTypes.STRING(120), allowNull: false },
    passwordHash: { type: DataTypes.STRING(100), allowNull: false },
    role: { type: DataTypes.STRING(16), allowNull: false, defaultValue: "seller" },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    lastLoginAt: { type: DataTypes.DATE },
    // Exclusão lógica: preenchido = excluído (e inativo). Ver user.service.js.
    deletedAt: { type: DataTypes.DATE }
  },
  { tableName: "app_user" }
);

// Origem dos ativos do pacote (de onde vieram), diferente do local (onde estão hoje). Decisão de 2026-11-17.
const Origin = sequelize.define(
  "Origin",
  {
    id,
    name: { type: DataTypes.STRING(120), allowNull: false },
    code: { type: DataTypes.STRING(10), allowNull: false, unique: true },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }
  },
  { tableName: "origin" }
);

const Package = sequelize.define(
  "Package",
  {
    id,
    number: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    name: { type: DataTypes.STRING(200), allowNull: false },
    category: { type: DataTypes.STRING(24), allowNull: false, defaultValue: "other" },
    originId: { type: DataTypes.UUID },
    description: { type: DataTypes.TEXT },
    // Pacote automático (nível de agrupamento da planilha + valor da coluna) ou montado pelo vendedor ("manual").
    source: { type: DataTypes.STRING(16), allowNull: false, defaultValue: "manual" },
    sourceValue: { type: DataTypes.STRING(200) },
    status: { type: DataTypes.STRING(24), allowNull: false, defaultValue: "draft" },
    createdBy: { type: DataTypes.UUID },
    updatedBy: { type: DataTypes.UUID }
  },
  { tableName: "package" }
);

// Lote: a menor unidade de venda, vinda da aba "Matriz de lotes". Campos da planilha + descrição do vendedor.
const Lot = sequelize.define(
  "Lot",
  {
    id,
    lotNumber: { type: DataTypes.STRING(40), allowNull: false, unique: true },
    siteName: { type: DataTypes.STRING(120) },
    title: { type: DataTypes.TEXT, allowNull: false },
    masterSupplier: { type: DataTypes.STRING(200) },
    linkedSystem: { type: DataTypes.STRING(200) },
    commercialFamily: { type: DataTypes.STRING(200) },
    subfamily: { type: DataTypes.STRING(200) },
    description: { type: DataTypes.TEXT },
    sheetStatus: { type: DataTypes.STRING(16), allowNull: false, defaultValue: "available" },
    soldBySheet: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    status: { type: DataTypes.STRING(16), allowNull: false, defaultValue: "available" },
    // Ajuste manual da situação (2026-11-24): vale até a planilha mudar o STATUS do lote.
    manualStatus: { type: DataTypes.STRING(16) },
    manualStatusNote: { type: DataTypes.TEXT },
    manualStatusBy: { type: DataTypes.UUID },
    manualStatusAt: { type: DataTypes.DATE },
    withdrawnAt: { type: DataTypes.DATE },
    importedAt: { type: DataTypes.DATE },
    updatedBy: { type: DataTypes.UUID }
  },
  { tableName: "lot" }
);

const PackageLot = sequelize.define(
  "PackageLot",
  {
    packageId: { type: DataTypes.UUID, primaryKey: true },
    lotId: { type: DataTypes.UUID, primaryKey: true },
    position: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 }
  },
  { tableName: "package_lot", updatedAt: false }
);

// Pacote vendido que contém o lote (o lote fica vendido em todos os pacotes de que participa).
const LotSale = sequelize.define(
  "LotSale",
  {
    lotId: { type: DataTypes.UUID, primaryKey: true },
    packageId: { type: DataTypes.UUID, primaryKey: true },
    createdBy: { type: DataTypes.UUID }
  },
  { tableName: "lot_sale", updatedAt: false }
);

const Attachment = sequelize.define(
  "Attachment",
  {
    id,
    // Do pacote ou do lote, nunca dos dois (CHECK no banco).
    packageId: { type: DataTypes.UUID },
    lotId: { type: DataTypes.UUID },
    kind: { type: DataTypes.STRING(16), allowNull: false },
    visibility: { type: DataTypes.STRING(16), allowNull: false, defaultValue: "restricted" },
    title: { type: DataTypes.STRING(200) },
    originalName: { type: DataTypes.STRING(255), allowNull: false },
    mimeType: { type: DataTypes.STRING(120), allowNull: false },
    sizeBytes: { type: DataTypes.BIGINT, allowNull: false },
    storageKey: { type: DataTypes.STRING(300), allowNull: false },
    webKey: { type: DataTypes.STRING(300) },
    thumbKey: { type: DataTypes.STRING(300) },
    width: { type: DataTypes.INTEGER },
    height: { type: DataTypes.INTEGER },
    sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    uploadedBy: { type: DataTypes.UUID }
  },
  { tableName: "attachment" }
);

const AccessLink = sequelize.define(
  "AccessLink",
  {
    id,
    tokenHash: { type: DataTypes.STRING(64), allowNull: false, unique: true },
    label: { type: DataTypes.STRING(200), allowNull: false },
    buyerEmail: { type: DataTypes.STRING(255) },
    note: { type: DataTypes.TEXT },
    expiresAt: { type: DataTypes.DATE, allowNull: false },
    revokedAt: { type: DataTypes.DATE },
    createdBy: { type: DataTypes.UUID }
  },
  { tableName: "access_link" }
);

const AccessLinkPackage = sequelize.define(
  "AccessLinkPackage",
  {
    accessLinkId: { type: DataTypes.UUID, primaryKey: true },
    packageId: { type: DataTypes.UUID, primaryKey: true }
  },
  { tableName: "access_link_package", timestamps: false }
);

const AccessLog = sequelize.define(
  "AccessLog",
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    accessLinkId: { type: DataTypes.UUID, allowNull: false },
    action: { type: DataTypes.STRING(24), allowNull: false },
    packageId: { type: DataTypes.UUID },
    attachmentId: { type: DataTypes.UUID },
    ip: { type: DataTypes.STRING(64) },
    userAgent: { type: DataTypes.STRING(512) }
  },
  { tableName: "access_log", updatedAt: false }
);

const Setting = sequelize.define(
  "Setting",
  {
    key: { type: DataTypes.STRING(64), primaryKey: true },
    value: { type: DataTypes.JSONB, allowNull: false },
    updatedBy: { type: DataTypes.UUID }
  },
  { tableName: "setting", createdAt: false }
);

// Pedido de informação do comprador sobre um pacote (decisão de 2026-11-17). Ver inquiry.service.js.
const Inquiry = sequelize.define(
  "Inquiry",
  {
    id,
    packageId: { type: DataTypes.UUID },
    packageName: { type: DataTypes.STRING(200), allowNull: false },
    accessLinkId: { type: DataTypes.UUID },
    name: { type: DataTypes.STRING(120) },
    company: { type: DataTypes.STRING(160) },
    email: { type: DataTypes.STRING(255) },
    phone: { type: DataTypes.STRING(40) },
    country: { type: DataTypes.STRING(80) },
    message: { type: DataTypes.TEXT },
    language: { type: DataTypes.STRING(5), allowNull: false, defaultValue: "en" },
    status: { type: DataTypes.STRING(16), allowNull: false, defaultValue: "new" },
    channel: { type: DataTypes.STRING(16), allowNull: false, defaultValue: "form" },
    outcome: { type: DataTypes.STRING(16) },
    createdBy: { type: DataTypes.UUID },
    assignedTo: { type: DataTypes.UUID },
    note: { type: DataTypes.TEXT },
    updatedBy: { type: DataTypes.UUID }
  },
  { tableName: "inquiry" }
);

Package.belongsTo(Origin, { foreignKey: "originId", as: "origin" });
Origin.hasMany(Package, { foreignKey: "originId", as: "packages" });
Package.belongsToMany(Lot, { through: PackageLot, foreignKey: "packageId", otherKey: "lotId", as: "lots" });
Lot.belongsToMany(Package, { through: PackageLot, foreignKey: "lotId", otherKey: "packageId", as: "packages" });
Package.hasMany(PackageLot, { foreignKey: "packageId", as: "packageLots" });
Lot.hasMany(PackageLot, { foreignKey: "lotId", as: "packageLots" });
PackageLot.belongsTo(Lot, { foreignKey: "lotId", as: "lot" });
PackageLot.belongsTo(Package, { foreignKey: "packageId", as: "package" });
Lot.hasMany(LotSale, { foreignKey: "lotId", as: "sales" });
Package.hasMany(LotSale, { foreignKey: "packageId", as: "lotSales" });
Lot.belongsTo(User, { foreignKey: "manualStatusBy", as: "manualStatusUser" });
LotSale.belongsTo(Lot, { foreignKey: "lotId", as: "lot" });
LotSale.belongsTo(Package, { foreignKey: "packageId", as: "package" });
Package.hasMany(Attachment, { foreignKey: "packageId", as: "attachments" });
Lot.hasMany(Attachment, { foreignKey: "lotId", as: "attachments" });
Attachment.belongsTo(Package, { foreignKey: "packageId", as: "package" });
Attachment.belongsTo(Lot, { foreignKey: "lotId", as: "lot" });
AccessLink.belongsToMany(Package, { through: AccessLinkPackage, foreignKey: "accessLinkId", otherKey: "packageId", as: "packages" });
Package.belongsToMany(AccessLink, { through: AccessLinkPackage, foreignKey: "packageId", otherKey: "accessLinkId", as: "accessLinks" });
AccessLog.belongsTo(AccessLink, { foreignKey: "accessLinkId", as: "link" });
AccessLink.belongsTo(User, { foreignKey: "createdBy", as: "creator" });
Inquiry.belongsTo(Package, { foreignKey: "packageId", as: "package" });
Inquiry.belongsTo(AccessLink, { foreignKey: "accessLinkId", as: "link" });
Inquiry.belongsTo(User, { foreignKey: "assignedTo", as: "assignee" });
Inquiry.belongsTo(User, { foreignKey: "updatedBy", as: "updater" });
Inquiry.belongsTo(User, { foreignKey: "createdBy", as: "creator" });

module.exports = { sequelize, User, Origin, Package, Lot, PackageLot, LotSale, Attachment, AccessLink, AccessLinkPackage, AccessLog, Setting, Inquiry };
