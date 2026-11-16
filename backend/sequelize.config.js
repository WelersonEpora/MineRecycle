require("dotenv").config({ path: require("path").resolve(__dirname, "..", ".env") });
const { readDbConfig } = require("./src/config/db-env");

const { dialect, host, port, database, username, password } = readDbConfig();

const common = {
  dialect,
  host,
  port,
  database,
  username,
  password,
  logging: false,
  migrationStorageTableName: "sequelize_meta",
  seederStorage: "sequelize",
  seederStorageTableName: "sequelize_data"
};

module.exports = { development: common, test: common, production: common };
