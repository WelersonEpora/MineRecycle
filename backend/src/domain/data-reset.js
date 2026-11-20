"use strict";

// Limpeza geral (decisão de 2026-11-19): o admin apaga todos os dados de negócio para recomeçar a carga do zero.
// Para liberar, digita uma frase de confirmação (a do idioma da tela) e a própria senha.
const RESET_PHRASES = ["DELETE ALL", "APAGAR TUDO"];

// Frase exata, sem diferença de espaços nas pontas. Maiúsculas importam: digitar em caixa alta é parte do aviso.
function isResetPhrase(text) {
  return typeof text === "string" && RESET_PHRASES.includes(text.trim());
}

// Tabelas apagadas, na ordem das dependências. Ficam usuários, configuração (contato comercial e o registro da
// própria limpeza) e origens.
const RESET_TABLES = ["inquiry", "access_log", "access_link_package", "access_link", "lot_sale", "package_lot", "attachment", "package", "lot"];

// Pastas do armazenamento com os arquivos dos anexos (as importações pendentes ficam: o órfão recolhe depois).
const RESET_STORAGE_PREFIXES = ["packages", "lots"];

module.exports = { RESET_PHRASES, isResetPhrase, RESET_TABLES, RESET_STORAGE_PREFIXES };
