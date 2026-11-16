"use strict";

const fs = require("node:fs");
const fsp = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");

// Chaves sempre geradas pelo servidor ("packages/<uuid>/<uuid>/web.webp"). A validação barra qualquer coisa fora
// do formato (path traversal, caminho absoluto, barra invertida).
const KEY_RE = /^[a-z0-9][a-z0-9_-]*(?:\/[a-z0-9][a-z0-9_.-]*)*$/i;

function assertKey(key) {
  if (typeof key !== "string" || key.length > 300 || !KEY_RE.test(key) || key.includes("..")) {
    throw new Error("Invalid storage key");
  }
}

function createLocalDriver(baseDir) {
  const root = path.resolve(baseDir);

  function resolve(key) {
    assertKey(key);
    const full = path.resolve(root, ...key.split("/"));
    if (!full.startsWith(root + path.sep)) throw new Error("Invalid storage key");
    return full;
  }

  return {
    name: "local",

    // Grava num temporário e renomeia: quem lê nunca vê arquivo pela metade.
    async put(key, buffer) {
      const full = resolve(key);
      await fsp.mkdir(path.dirname(full), { recursive: true });
      const tmp = `${full}.${crypto.randomBytes(6).toString("hex")}.tmp`;
      await fsp.writeFile(tmp, buffer);
      await fsp.rename(tmp, full);
    },

    async get(key) {
      return fsp.readFile(resolve(key));
    },

    // -> { stream, size } ou null se o arquivo não existe.
    async open(key) {
      const full = resolve(key);
      try {
        const stat = await fsp.stat(full);
        return { stream: fs.createReadStream(full), size: stat.size };
      } catch (err) {
        if (err.code === "ENOENT") return null;
        throw err;
      }
    },

    async remove(key) {
      try {
        await fsp.unlink(resolve(key));
      } catch (err) {
        if (err.code !== "ENOENT") throw err;
      }
    },

    // Apaga um "diretório" de chaves (ex.: todos os arquivos de um anexo).
    async removePrefix(prefix) {
      const full = resolve(prefix);
      await fsp.rm(full, { recursive: true, force: true });
    }
  };
}

module.exports = { createLocalDriver, assertKey };
