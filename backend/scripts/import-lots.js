"use strict";

// Importa a planilha de lotes (aba "Matriz de lotes") no banco LOCAL, pelo mesmo importador da tela. Só para o
// ambiente local: no servidor, os lotes entram pela tela de importação.
//   npm run import:lots -- <arquivo.xlsx|.xlsm>
// Imprime só contagens: a planilha do cliente é confidencial e nada dela vai para log.
const fs = require("node:fs");
const path = require("node:path");

async function main() {
  if (process.env.NODE_ENV === "production") throw new Error("Local only: use the import screen on the server.");
  const file = process.argv[2];
  if (!file || !fs.existsSync(file)) throw new Error("Usage: npm run import:lots -- <spreadsheet file>");

  const { sequelize, User } = require("../src/models");
  const lotImport = require("../src/services/lot-import.service");
  try {
    const admin = await User.findOne({ where: { role: "admin" }, order: [["createdAt", "ASC"]] });
    const preview = await lotImport.start({ originalname: path.basename(file), buffer: fs.readFileSync(file) });
    console.log(`Sheet found: ${preview.sheet === "Matriz de lotes" ? "Matriz de lotes" : "(other)"}, header row ${preview.headerRow}`);
    if (!preview.canCommit) {
      const codes = {};
      for (const e of preview.errors.items) codes[e.code] = (codes[e.code] || 0) + 1;
      await lotImport.cancel(preview.importId);
      throw new Error(`The spreadsheet has ${preview.errors.total} error(s): ${JSON.stringify(codes)}`);
    }
    const { summary } = await lotImport.commit(preview.importId, { sheet: preview.sheet, fingerprint: preview.fingerprint }, admin?.id ?? null);
    console.log("Imported:", JSON.stringify(summary));
  } finally {
    await sequelize.close();
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
