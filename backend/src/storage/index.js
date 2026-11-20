"use strict";

// Único ponto de gravação e leitura de arquivos (fotos, anexos, planilhas em importação). Hoje: disco local, num
// volume Docker fora do contêiner. Para trocar por armazenamento tipo S3, basta um driver novo com a mesma
// interface: put(key, buffer), get(key), open(key) -> { stream, size } | null, remove(key), removePrefix(prefix),
// list() -> [{ key, size, modifiedAt }] e pruneEmptyDirs() (estes dois só para a limpeza de órfãos).
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

// Anexos guardados sob o dono: pacote (packages/<id>) ou lote (lots/<id>, desde 2026-11-19).
const ownerPrefix = (owner) => (owner.lotId ? `lots/${owner.lotId}` : `packages/${owner.packageId}`);

const keys = {
  attachmentPrefix: (owner, attachmentId) => `${ownerPrefix(owner)}/${attachmentId}`,
  attachmentOriginal: (owner, attachmentId, ext) => `${ownerPrefix(owner)}/${attachmentId}/original${ext}`,
  attachmentWeb: (owner, attachmentId) => `${ownerPrefix(owner)}/${attachmentId}/web.webp`,
  attachmentThumb: (owner, attachmentId) => `${ownerPrefix(owner)}/${attachmentId}/thumb.webp`,
  packagePrefix: (packageId) => `packages/${packageId}`,
  lotPrefix: (lotId) => `lots/${lotId}`,
  importFile: (importId) => `imports/${importId}.xlsx`
};

module.exports = { storage, keys, createStorage };
