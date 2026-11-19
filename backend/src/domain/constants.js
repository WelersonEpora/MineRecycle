"use strict";

// Categoria do pacote: cor e ícone do cartão do catálogo quando não há foto (decisão de 2026-11-17).
const PACKAGE_CATEGORIES = ["refractories", "electrical", "piping", "process_equipment", "office", "other"];
// Origem do pacote (2026-11-19): montado pelo vendedor ou criado pela importação de lotes, um por valor de cada coluna
// de agrupamento da planilha. A ordem de AUTO_PACKAGE_SOURCES é a dos níveis (do mais amplo ao mais fino).
const AUTO_PACKAGE_SOURCES = [
  { source: "linked_system", field: "linkedSystem" },
  { source: "family", field: "commercialFamily" },
  { source: "subfamily", field: "subfamily" }
];
const PACKAGE_SOURCES = ["manual", ...AUTO_PACKAGE_SOURCES.map((s) => s.source)];
// Situação do lote: disponível, vendido (pela planilha ou por um pacote vendido) ou indisponível (saiu da venda sem ser
// vendido, ex.: recolhido por oficial de justiça).
const LOT_STATUSES = ["available", "sold", "unavailable"];
const PACKAGE_STATUSES = ["draft", "active", "under_negotiation", "sold", "inactive"];
// Catálogo público (regra fixa, decisão de 2026-11-17): ativos e em negociação. A lista só mostra os em negociação
// quando o visitante marca a caixa; vendidos, rascunhos e inativos nunca aparecem para o público.
const PUBLIC_STATUSES = ["active", "under_negotiation"];
// O comprador vê, pelo link, os pacotes do escopo, menos rascunho e inativo.
const BUYER_HIDDEN_STATUSES = ["draft", "inactive"];

const ATTACHMENT_KINDS = ["photo", "datasheet", "drawing", "list", "proposal"];
// public: todos; restricted: vendedor e comprador com link; internal: só vendedor logado.
const VISIBILITIES = ["public", "restricted", "internal"];
const ALWAYS_RESTRICTED_KINDS = ["proposal"];

const USER_ROLES = ["seller", "admin"];

const ACCESS_ACTIONS = ["open", "view_package", "download"];

// Pedido de informação do comprador (decisão de 2026-11-17): novo → em atendimento → concluído; descartado = spam ou
// pedido sem sentido.
const INQUIRY_STATUSES = ["new", "in_progress", "done", "discarded"];
// Por onde o pedido chegou: o formulário do site ou um contato direto que o vendedor registra à mão.
const INQUIRY_CHANNELS = ["form", "email", "whatsapp", "phone", "other"];
// Desfecho do pedido concluído. Sem valor nem preço.
const INQUIRY_OUTCOMES = ["sold", "not_pursued", "no_reply"];

module.exports = {
  PACKAGE_CATEGORIES,
  AUTO_PACKAGE_SOURCES,
  PACKAGE_SOURCES,
  LOT_STATUSES,
  PACKAGE_STATUSES,
  PUBLIC_STATUSES,
  BUYER_HIDDEN_STATUSES,
  ATTACHMENT_KINDS,
  VISIBILITIES,
  ALWAYS_RESTRICTED_KINDS,
  USER_ROLES,
  ACCESS_ACTIONS,
  INQUIRY_STATUSES,
  INQUIRY_CHANNELS,
  INQUIRY_OUTCOMES
};
