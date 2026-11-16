"use strict";

const PACKAGE_TYPES = ["bulk", "equipment"];
const LOCATIONS = ["conceicao_do_araguaia", "uberaba", "niquelandia"];
const PACKAGE_STATUSES = ["draft", "active", "under_negotiation", "sold", "inactive"];
// Status que a tela Settings pode escolher para a vitrine pública. Rascunho e inativo nunca aparecem.
const SHOWCASE_ELIGIBLE_STATUSES = ["active", "under_negotiation", "sold"];
const DEFAULT_SHOWCASE_STATUSES = ["active"];
// O comprador vê, pelo link, os pacotes do escopo, menos rascunho e inativo.
const BUYER_HIDDEN_STATUSES = ["draft", "inactive"];

const ATTACHMENT_KINDS = ["photo", "datasheet", "drawing", "list", "proposal"];
const VISIBILITIES = ["public", "restricted"];
const ALWAYS_RESTRICTED_KINDS = ["proposal"];

const USER_ROLES = ["seller", "admin"];

const ACCESS_ACTIONS = ["open", "view_package", "download"];

module.exports = {
  PACKAGE_TYPES,
  LOCATIONS,
  PACKAGE_STATUSES,
  SHOWCASE_ELIGIBLE_STATUSES,
  DEFAULT_SHOWCASE_STATUSES,
  BUYER_HIDDEN_STATUSES,
  ATTACHMENT_KINDS,
  VISIBILITIES,
  ALWAYS_RESTRICTED_KINDS,
  USER_ROLES,
  ACCESS_ACTIONS
};
