"use strict";

// Arquivos órfãos no armazenamento (2026-11-19): gravados, mas sem registro no banco. Sobraram, por exemplo, da
// limpeza dos pacotes e itens na mudança para lotes (a migration apaga registros, não arquivos).
//   npm run files:orphans               # só mostra: quantos arquivos, quanto espaço, por pasta
//   npm run files:orphans -- --delete   # apaga os órfãos e as pastas que ficarem vazias
// No servidor: docker compose exec backend node scripts/files-orphans.js [--delete]
// Imprime só contagens e tamanhos (nunca nomes de arquivo enviados; as chaves nem os têm).
const { findOrphans, usedKeysOf, MIN_AGE, IMPORT_MAX_AGE } = require("../src/domain/orphan-files");

const mb = (bytes) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

async function main() {
  const remove = process.argv.includes("--delete");
  const { sequelize, Attachment } = require("../src/models");
  const { storage } = require("../src/storage");
  try {
    // Lista os arquivos antes de ler o banco: um envio entre as duas leituras fica com o registro já visto ou dentro
    // da margem de tempo, nunca como órfão.
    const files = await storage.list();
    const attachments = await Attachment.findAll({ attributes: ["storageKey", "webKey", "thumbKey"], raw: true });
    const r = findOrphans(files, usedKeysOf(attachments));

    console.log(`Stored files: ${files.length} (${mb(files.reduce((n, f) => n + f.size, 0))})`);
    console.log(`In use: ${r.kept}`);
    console.log(`Too recent to judge: ${r.recent} (under ${MIN_AGE / 60000} min; pending imports under ${IMPORT_MAX_AGE / 3600000} h)`);
    console.log(`Orphans: ${r.orphans.length} (${mb(r.bytes)})`);
    for (const [prefix, v] of Object.entries(r.byPrefix)) console.log(`  ${prefix}/: ${v.files} (${mb(v.bytes)})`);

    if (!remove) {
      if (r.orphans.length) console.log("Nothing deleted. Run again with --delete to remove the orphans.");
      return;
    }
    for (const f of r.orphans) await storage.remove(f.key);
    await storage.pruneEmptyDirs();
    console.log(`Deleted: ${r.orphans.length} (${mb(r.bytes)})`);
  } finally {
    await sequelize.close();
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
