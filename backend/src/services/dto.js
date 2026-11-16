"use strict";

// Formato das respostas da API. Nenhum campo de preço existe no modelo.

function packageDto(p, extra = {}) {
  return {
    id: p.id,
    number: p.number,
    name: p.name,
    type: p.type,
    description: p.description,
    location: p.location,
    status: p.status,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    ...extra
  };
}

function lineDto(l) {
  return {
    id: l.id,
    itemNo: l.itemNo,
    parentLineId: l.parentLineId,
    description: l.description,
    quantity: l.quantity === null || l.quantity === undefined ? null : String(Number(l.quantity)),
    unit: l.unit,
    unitRaw: l.unitRaw,
    storCode: l.storCode,
    tag: l.tag,
    warehouseLocation: l.warehouseLocation,
    sortOrder: l.sortOrder
  };
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
    lineId: a.lineId,
    sortOrder: a.sortOrder,
    width: a.width,
    height: a.height,
    createdAt: a.createdAt,
    thumbUrl: a.thumbKey ? `${base}/thumb` : null,
    webUrl: a.webKey ? `${base}/web` : null,
    url: full || !isPhoto ? `${base}/original` : null
  };
}

module.exports = { packageDto, lineDto, attachmentDto };
