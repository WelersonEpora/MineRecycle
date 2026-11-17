"use strict";

const PACKAGE_TYPES = ["bulk", "equipment"];
// Categoria do pacote: cor e ícone do cartão da vitrine quando não há foto (decisão de 2026-11-17).
const PACKAGE_CATEGORIES = ["refractories", "electrical", "piping", "process_equipment", "office", "other"];
// Um pacote pode estar em vários locais. "at_supplier": ainda no fornecedor; "to_be_confirmed": local não informado.
const LOCATIONS = ["conceicao_do_araguaia", "uberaba", "niquelandia", "belo_horizonte", "at_supplier", "to_be_confirmed"];
const PACKAGE_STATUSES = ["draft", "active", "under_negotiation", "sold", "inactive"];
// Vitrine pública (regra fixa, decisão de 2026-11-17): ativos e em negociação. A lista só mostra os em negociação
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

module.exports = {
  PACKAGE_TYPES,
  PACKAGE_CATEGORIES,
  LOCATIONS,
  PACKAGE_STATUSES,
  PUBLIC_STATUSES,
  BUYER_HIDDEN_STATUSES,
  ATTACHMENT_KINDS,
  VISIBILITIES,
  ALWAYS_RESTRICTED_KINDS,
  USER_ROLES,
  ACCESS_ACTIONS,
  INQUIRY_STATUSES
};
