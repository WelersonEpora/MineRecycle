"use strict";

// Formato das respostas da API. Nenhum campo de preço existe no modelo.

function packageDto(p, extra = {}) {
  return {
    id: p.id,
    number: p.number,
    name: p.name,
    category: p.category,
    // De onde veio: "manual" (montado pelo vendedor) ou o nível de agrupamento da planilha de lotes.
    source: p.source,
    sourceValue: p.sourceValue,
    originId: p.originId,
    origin: p.origin ? { id: p.origin.id, name: p.origin.name, code: p.origin.code } : null,
    description: p.description,
    status: p.status,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    ...extra
  };
}

// Lote. `seller`: campos que só a área do vendedor recebe (retirada, origem da venda, importação).
function lotDto(l, { seller = false, extra = {} } = {}) {
  const out = {
    id: l.id,
    lotNumber: l.lotNumber,
    siteName: l.siteName,
    title: l.title,
    masterSupplier: l.masterSupplier,
    linkedSystem: l.linkedSystem,
    commercialFamily: l.commercialFamily,
    subfamily: l.subfamily,
    description: l.description,
    status: l.status
  };
  if (seller) {
    out.sheetStatus = l.sheetStatus;
    out.soldBySheet = l.soldBySheet;
    out.manualStatus = l.manualStatus ?? null;
    out.manualStatusNote = l.manualStatusNote ?? null;
    out.manualStatusAt = l.manualStatusAt ?? null;
    out.withdrawnAt = l.withdrawnAt;
    out.importedAt = l.importedAt;
    out.updatedAt = l.updatedAt;
  }
  return { ...out, ...extra };
}

// `full`: vendedor ou comprador (vê original e nome do arquivo). Público: só as versões redimensionadas das fotos.
function attachmentDto(a, { full }) {
  const base = `/api/v1/files/${a.id}`;
  const isPhoto = a.kind === "photo";
  return {
    id: a.id,
    kind: a.kind,
    visibility: a.visibility,
    title: a.title,
    originalName: full || !isPhoto ? a.originalName : null,
    mimeType: full || !isPhoto ? a.mimeType : "image/webp",
    sizeBytes: full || !isPhoto ? Number(a.sizeBytes) : null,
    packageId: a.packageId,
    lotId: a.lotId,
    sortOrder: a.sortOrder,
    width: a.width,
    height: a.height,
    createdAt: a.createdAt,
    thumbUrl: a.thumbKey ? `${base}/thumb` : null,
    webUrl: a.webKey ? `${base}/web` : null,
    url: full || !isPhoto ? `${base}/original` : null
  };
}

module.exports = { packageDto, lotDto, attachmentDto };
