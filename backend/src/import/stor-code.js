"use strict";

// Códigos de documento do STOR: 7 dígitos. O Download do STOR grava o arquivo como "<código>_REV0_VER0_<título>.xlsx".
const STOR_DOCUMENT_RE = /^\d{7}$/;

function isStorDocumentCode(value) {
  return typeof value === "string" && STOR_DOCUMENT_RE.test(value);
}

// Código no começo do nome do arquivo, ou null. "1809601_REV0_VER0_x.xlsx" -> "1809601"; "lista.xlsx" -> null.
function storCodeFromFileName(fileName) {
  const base = String(fileName || "").split(/[\\/]/).pop();
  const m = /^(\d{7})(?=[_\s.-]|$)/.exec(base);
  return m ? m[1] : null;
}

module.exports = { isStorDocumentCode, storCodeFromFileName };
