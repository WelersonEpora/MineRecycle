"use strict";

const { Attachment, Package, Lot, PackageLot } = require("../models");
const { NotFoundError } = require("../shared/errors");
const { isUuid } = require("../shared/validate");
const { canReadAttachment, packageAccess, bestPackageAccess, isEffectivelyRestricted } = require("../domain/access-policy");
const { storage } = require("../storage");
const accessLog = require("./access-log.service");

const VARIANTS = ["original", "web", "thumb"];
const INLINE_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp", "image/gif", "text/plain"];

function contentDisposition(type, name) {
  const fallback = name.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_");
  return `${type}; filename="${fallback}"; filename*=UTF-8''${encodeURIComponent(name)}`;
}

// Todo arquivo sai por aqui, depois da checagem de acesso. Nunca há pasta pública de arquivos.
// Arquivo que o visitante não pode ver responde 404, igual a um arquivo inexistente.
async function open(attachmentId, variant, viewer, req) {
  if (!isUuid(attachmentId) || !VARIANTS.includes(variant)) throw new NotFoundError("File not found.");
  const attachment = await Attachment.findByPk(attachmentId);
  // Anexo de pacote: vale o acesso ao pacote. Anexo de lote: o melhor acesso entre os pacotes que contêm o lote.
  const pkg = attachment?.packageId ? await Package.findByPk(attachment.packageId) : null;
  const lot = attachment?.lotId ? await Lot.findByPk(attachment.lotId) : null;
  const lotPackages = lot
    ? await Package.findAll({ include: [{ model: PackageLot, as: "packageLots", where: { lotId: lot.id }, attributes: [] }] })
    : [];
  if (!canReadAttachment({ attachment, pkg, lot, lotPackages, viewer, variant })) throw new NotFoundError("File not found.");

  const key = { original: attachment.storageKey, web: attachment.webKey, thumb: attachment.thumbKey }[variant];
  if (!key) throw new NotFoundError("File not found.");
  const file = await storage.open(key);
  if (!file) throw new NotFoundError("File not found.");

  const access = pkg ? packageAccess(pkg, viewer) : bestPackageAccess(lotPackages, viewer);
  if (access === "buyer" && variant === "original") {
    // Lote: registra o pacote do link pelo qual o comprador chegou a ele.
    const via = pkg || lotPackages.find((p) => viewer.link.packageIds.includes(p.id));
    await accessLog.record(viewer.link.id, "download", { packageId: via?.id ?? null, attachmentId: attachment.id }, req);
  }

  const mimeType = variant === "original" ? attachment.mimeType : "image/webp";
  const headers = {
    "Content-Type": mimeType,
    "Content-Length": String(file.size),
    "X-Content-Type-Options": "nosniff",
    // Público: cache curto no navegador. Restrito: nada de cache.
    "Cache-Control": isEffectivelyRestricted(attachment) || access !== "public" ? "private, no-store" : "private, max-age=300"
  };
  if (variant === "original") {
    // O visualizador de PDF do Chrome não abre sob "sandbox"; os demais tipos ficam isolados.
    if (mimeType !== "application/pdf") headers["Content-Security-Policy"] = "sandbox";
    headers["Content-Disposition"] = contentDisposition(INLINE_TYPES.includes(mimeType) ? "inline" : "attachment", attachment.originalName);
  }
  return { stream: file.stream, headers };
}

module.exports = { open, VARIANTS };
