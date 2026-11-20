"use strict";

// Arquivos órfãos no armazenamento: gravados, mas sem registro no banco que os use. Regra pura (2026-11-19), usada por
// scripts/files-orphans.js.
//
// - Anexo: o arquivo é usado se a chave é o original, a versão web ou a miniatura de algum registro de `attachment`.
// - Planilha em importação (imports/): não tem registro; só vira órfã depois de IMPORT_MAX_AGE (prévia abandonada).
// - Margem para tudo: o envio grava o arquivo antes do registro, então nada mais novo que MIN_AGE é órfão.

const HOUR = 60 * 60 * 1000;
const MIN_AGE = HOUR;
const IMPORT_MAX_AGE = 24 * HOUR;

// files = [{ key, size, modifiedAt }]; usedKeys = Set das chaves referenciadas no banco.
// -> { orphans: [file], kept: n, recent: n, bytes, byPrefix: { packages: { files, bytes }, ... } }
function findOrphans(files, usedKeys, { now = new Date() } = {}) {
  const orphans = [];
  let kept = 0;
  let recent = 0;
  for (const file of files) {
    const age = now - new Date(file.modifiedAt);
    if (usedKeys.has(file.key)) kept += 1;
    else if (age < MIN_AGE) recent += 1;
    else if (file.key.startsWith("imports/") && age < IMPORT_MAX_AGE) recent += 1;
    else orphans.push(file);
  }
  const byPrefix = {};
  for (const f of orphans) {
    const prefix = f.key.split("/")[0];
    byPrefix[prefix] ??= { files: 0, bytes: 0 };
    byPrefix[prefix].files += 1;
    byPrefix[prefix].bytes += f.size;
  }
  return { orphans, kept, recent, bytes: orphans.reduce((n, f) => n + f.size, 0), byPrefix };
}

// Chaves usadas a partir das linhas de attachment ({ storageKey, webKey, thumbKey }).
function usedKeysOf(attachments) {
  const keys = new Set();
  for (const a of attachments) for (const k of [a.storageKey, a.webKey, a.thumbKey]) if (k) keys.add(k);
  return keys;
}

module.exports = { findOrphans, usedKeysOf, MIN_AGE, IMPORT_MAX_AGE };
