"use strict";

const { BUYER_HIDDEN_STATUSES, PUBLIC_STATUSES, ALWAYS_RESTRICTED_KINDS } = require("./constants");

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

// Público: só pacotes ativos ou em negociação (regra fixa; antes vinha da tela Configuração).
function isListedPublicly(pkg) {
  return PUBLIC_STATUSES.includes(pkg.status);
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
function packageAccess(pkg, viewer, now = new Date()) {
  if (!pkg) return null;
  if (viewer?.seller) return "seller";
  if (viewer?.link && linkCoversPackage(viewer.link, pkg, now)) return "buyer";
  if (isListedPublicly(pkg)) return "public";
  return null;
}

// Restrito para o público: tudo que não é "public" (restrito e interno) e as propostas.
function isEffectivelyRestricted(attachment) {
  return attachment.visibility !== "public" || ALWAYS_RESTRICTED_KINDS.includes(attachment.kind);
}

// Interno: só vendedor logado (nem o comprador com link). Ex.: a planilha original guardada na importação, que pode
// ter colunas de valor.
function isInternal(attachment) {
  return attachment.visibility === "internal";
}

// O anexo aparece para este nível de acesso ao pacote ("seller", "buyer", "public")? Não trata variantes de foto.
function attachmentVisibleTo(attachment, access) {
  if (access === "seller") return true;
  if (access === "buyer") return !isInternal(attachment);
  if (access === "public") return !isEffectivelyRestricted(attachment);
  return false;
}

// Variantes: "original" (arquivo enviado), "web" e "thumb" (só fotos). O original de uma foto pode ter metadados
// (EXIF, GPS), então o público só recebe as versões redimensionadas, que saem sem metadados.
function canReadAttachment({ attachment, pkg, viewer, variant = "original", now = new Date() }) {
  if (!attachment || !pkg || attachment.packageId !== pkg.id) return false;
  const access = packageAccess(pkg, viewer, now);
  if (!attachmentVisibleTo(attachment, access)) return false;
  if (access === "public" && attachment.kind === "photo" && variant === "original") return false;
  return true;
}

// Visibilidade efetiva gravada: proposta nunca é pública (vira restrita); pode ser interna.
function effectiveVisibility(kind, requested) {
  if (ALWAYS_RESTRICTED_KINDS.includes(kind) && requested !== "internal") return "restricted";
  return requested;
}

module.exports = {
  linkState,
  isListedPublicly,
  packageAccess,
  canReadAttachment,
  isEffectivelyRestricted,
  isInternal,
  attachmentVisibleTo,
  effectiveVisibility
};
