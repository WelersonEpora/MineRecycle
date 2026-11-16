"use strict";

// Único ponto de gravação e leitura de arquivos (fotos, anexos, planilhas em importação). Hoje: disco local, num
// volume Docker fora do contêiner. Para trocar por armazenamento tipo S3, basta um driver novo com a mesma
// interface: put(key, buffer), get(key), open(key) -> { stream, size } | null, remove(key), removePrefix(prefix).
const env = require("../config/env");
const { createLocalDriver } = require("./local-driver");

function createStorage(config = env.storage) {
  switch (config.driver) {
    case "local":
      return createLocalDriver(config.localDir);
    default:
      throw new Error(`Unknown storage driver: ${config.driver}`);
  }
}

const storage = createStorage();

const keys = {
  attachmentPrefix: (packageId, attachmentId) => `packages/${packageId}/${attachmentId}`,
  attachmentOriginal: (packageId, attachmentId, ext) => `packages/${packageId}/${attachmentId}/original${ext}`,
  attachmentWeb: (packageId, attachmentId) => `packages/${packageId}/${attachmentId}/web.webp`,
  attachmentThumb: (packageId, attachmentId) => `packages/${packageId}/${attachmentId}/thumb.webp`,
  packagePrefix: (packageId) => `packages/${packageId}`,
  importFile: (importId) => `imports/${importId}.xlsx`
};

module.exports = { storage, keys, createStorage };
