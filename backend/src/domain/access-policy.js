"use strict";

const { BUYER_HIDDEN_STATUSES, PUBLIC_STATUSES, ALWAYS_RESTRICTED_KINDS } = require("./constants");
const { isLotOffered } = require("./lot-status");

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

const ACCESS_RANK = { seller: 3, buyer: 2, public: 1 };

// Melhor acesso entre vários pacotes (o lote está em vários: vale o pacote que o visitante pode ver melhor).
// O vendedor vê tudo, inclusive lote que ainda não está em pacote nenhum.
function bestPackageAccess(packages, viewer, now = new Date()) {
  if (viewer?.seller) return "seller";
  let best = null;
  for (const pkg of packages || []) {
    const access = packageAccess(pkg, viewer, now);
    if (access && (!best || ACCESS_RANK[access] > ACCESS_RANK[best])) best = access;
  }
  return best;
}

// O lote aparece para este nível de acesso? O vendedor vê todos; o comprador e o público, só os lotes em oferta
// (nem retirados da planilha, nem fora da venda). O vendido continua visível, com o selo.
function lotVisibleTo(lot, access) {
  if (!lot || !access) return false;
  if (access === "seller") return true;
  return isLotOffered(lot);
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
//
// Anexo de pacote: passe `pkg`. Anexo de lote (acompanha o lote em todos os pacotes): passe `lot` e `lotPackages`,
// os pacotes que contêm o lote; vale o melhor acesso entre eles, e o lote precisa estar visível.
function canReadAttachment({ attachment, pkg, lot, lotPackages, viewer, variant = "original", now = new Date() }) {
  if (!attachment) return false;
  let access;
  if (attachment.packageId) {
    if (!pkg || attachment.packageId !== pkg.id) return false;
    access = packageAccess(pkg, viewer, now);
  } else {
    if (!lot || attachment.lotId !== lot.id) return false;
    access = bestPackageAccess(lotPackages, viewer, now);
    if (!lotVisibleTo(lot, access)) return false;
  }
  if (!attachmentVisibleTo(attachment, access)) return false;
  if (access === "public" && attachment.kind === "photo" && variant === "original") return false;
  return true;
}

// Visibilidade efetiva gravada: proposta nunca é pública (vira restrita); pode ser interna.
function effectiveVisibility(kind, requested) {
  if (ALWAYS_RESTRICTED_KINDS.includes(kind) && requested !== "internal") return "restricted";
  return requested;
}

// Pedido de informação: só visitante ou comprador com link (o vendedor atende, não pede), nunca sobre pacote vendido
// nem sobre pacote sem lote disponível (`summary` de package-sale.js: todos vendidos em outros pacotes, por exemplo).
// Em negociação aceita: o comprador pode querer ficar na fila.
function canSendInquiry(pkg, access, summary) {
  if (!pkg || pkg.status === "sold") return false;
  if (!summary || summary.nothingAvailable) return false;
  return access === "public" || access === "buyer";
}

module.exports = {
  linkState,
  canSendInquiry,
  isListedPublicly,
  packageAccess,
  bestPackageAccess,
  lotVisibleTo,
  canReadAttachment,
  isEffectivelyRestricted,
  isInternal,
  attachmentVisibleTo,
  effectiveVisibility
};
