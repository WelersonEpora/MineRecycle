"use strict";

const app = require("./app");
const env = require("./config/env");
const logger = require("./shared/logger");

app.listen(env.appPort, () => {
  logger.info({ port: env.appPort }, "MineRecycle backend running");
});
