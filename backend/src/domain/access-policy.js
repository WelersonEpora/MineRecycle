"use strict";

const { BUYER_HIDDEN_STATUSES, ALWAYS_RESTRICTED_KINDS } = require("./constants");

// Regras de quem vê o quê. Puras (sem banco): o serviço monta o `viewer` e chama estas funções.
//
// viewer = {
//   seller: { id, role } | null,
//   link:   { id, expiresAt, revokedAt, packageIds: [] } | null
// }

function linkState(link, now = new Date()) {
  if (!link) return "invalid";
  if (link.revokedAt) return "revoked";
  if (new Date(link.expiresAt).getTime() <= now.getTime()) return "expired";
  return "valid";
}

function isListedPublicly(pkg, showcaseStatuses) {
  return pkg.status !== "draft" && pkg.status !== "inactive" && showcaseStatuses.includes(pkg.status);
}

function linkCoversPackage(link, pkg, now) {
  return (
    linkState(link, now) === "valid" &&
    Array.isArray(link.packageIds) &&
    link.packageIds.includes(pkg.id) &&
    !BUYER_HIDDEN_STATUSES.includes(pkg.status)
  );
}

// Nível de acesso ao pacote: "seller" (tudo), "buyer" (inclui restritos), "public" (só públicos) ou null (nada).
function packageAccess(pkg, viewer, showcaseStatuses, now = new Date()) {
  if (!pkg) return null;
  if (viewer?.seller) return "seller";
  if (viewer?.link && linkCoversPackage(viewer.link, pkg, now)) return "buyer";
  if (isListedPublicly(pkg, showcaseStatuses)) return "public";
  return null;
}

function isEffectivelyRestricted(attachment) {
  return attachment.visibility !== "public" || ALWAYS_RESTRICTED_KINDS.includes(attachment.kind);
}

// Variantes: "original" (arquivo enviado), "web" e "thumb" (só fotos). O original de uma foto pode ter metadados
// (EXIF, GPS), então o público só recebe as versões redimensionadas, que saem sem metadados.
function canReadAttachment({ attachment, pkg, viewer, showcaseStatuses, variant = "original", now = new Date() }) {
  if (!attachment || !pkg || attachment.packageId !== pkg.id) return false;
  const access = packageAccess(pkg, viewer, showcaseStatuses, now);
  if (!access) return false;
  if (access === "seller" || access === "buyer") return true;
  if (isEffectivelyRestricted(attachment)) return false;
  if (attachment.kind === "photo" && variant === "original") return false;
  return true;
}

// Visibilidade efetiva gravada: proposta é sempre restrita, qualquer que seja o pedido.
function effectiveVisibility(kind, requested) {
  return ALWAYS_RESTRICTED_KINDS.includes(kind) ? "restricted" : requested;
}

module.exports = {
  linkState,
  isListedPublicly,
  packageAccess,
  canReadAttachment,
  isEffectivelyRestricted,
  effectiveVisibility
};
