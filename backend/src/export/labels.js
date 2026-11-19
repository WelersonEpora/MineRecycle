"use strict";

// Rótulos dos valores de domínio na planilha exportada, nos dois idiomas da tela. Mesmos textos de
// frontend/src/i18n (enums.*): mudou lá, mude aqui.
const LANGS = ["en", "pt"];

const ENUMS = {
  en: {
    type: { bulk: "Bulk", equipment: "Equipment" },
    status: { draft: "Draft", active: "Active", under_negotiation: "Under negotiation", sold: "Sold", inactive: "Inactive" },
    category: {
      refractories: "Refractories",
      electrical: "Electrical",
      piping: "Piping",
      process_equipment: "Process equipment",
      office: "Office",
      other: "Other"
    },
    location: {
      conceicao_do_araguaia: "Conceição do Araguaia",
      uberaba: "Uberaba",
      niquelandia: "Niquelândia",
      belo_horizonte: "Belo Horizonte",
      at_supplier: "At supplier",
      to_be_confirmed: "To be confirmed"
    },
    pending: "pending"
  },
  pt: {
    type: { bulk: "A granel", equipment: "Equipamento" },
    status: { draft: "Rascunho", active: "Ativo", under_negotiation: "Em negociação", sold: "Vendido", inactive: "Inativo" },
    category: {
      refractories: "Refratários",
      electrical: "Elétrica",
      piping: "Tubulação",
      process_equipment: "Equipamentos de processo",
      office: "Escritório",
      other: "Outros"
    },
    location: {
      conceicao_do_araguaia: "Conceição do Araguaia",
      uberaba: "Uberaba",
      niquelandia: "Niquelândia",
      belo_horizonte: "Belo Horizonte",
      at_supplier: "No fornecedor",
      to_be_confirmed: "A confirmar"
    },
    pending: "pendente"
  }
};

const SHEETS = {
  en: { lines: "Items", packages: "Packages" },
  pt: { lines: "Itens", packages: "Pacotes" }
};

function langOf(value) {
  return LANGS.includes(value) ? value : "en";
}

// Valor de domínio traduzido; desconhecido sai como veio (nunca some da planilha).
function enumLabel(lang, group, value) {
  if (value === null || value === undefined) return null;
  return ENUMS[langOf(lang)][group]?.[value] ?? value;
}

function word(lang, key) {
  return ENUMS[langOf(lang)][key];
}

const fold = (s) =>
  String(s ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

// Caminho de volta (importação): texto da planilha, em qualquer idioma ou como o valor do sistema ("bulk"),
// sem diferenciar maiúscula, acento e pontuação -> valor do sistema; desconhecido -> undefined.
function enumValue(group, text) {
  const key = fold(text);
  if (!key) return undefined;
  for (const lang of LANGS) {
    for (const [value, label] of Object.entries(ENUMS[lang][group] || {})) {
      if (fold(label) === key || fold(value) === key) return value;
    }
  }
  return undefined;
}

module.exports = { LANGS, SHEETS, langOf, enumLabel, enumValue, word, fold };
