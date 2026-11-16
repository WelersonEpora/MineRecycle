"use strict";

const path = require("node:path");
const { randomUUID } = require("node:crypto");
const { Package, PackageLine, Attachment } = require("../models");
const { NotFoundError, ValidationError } = require("../shared/errors");
const { oneOf, optionalString, uuid } = require("../shared/validate");
const { ATTACHMENT_KINDS, VISIBILITIES } = require("../domain/constants");
const { effectiveVisibility } = require("../domain/access-policy");
const { storage, keys } = require("../storage");
const images = require("../media/images");
const { attachmentDto } = require("./dto");

// O tipo do arquivo vem da extensão (lista fechada), nunca do Content-Type enviado pelo navegador.
const MIME_BY_EXT = {
  ".pdf": "application/pdf",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".tif": "image/tiff",
  ".tiff": "image/tiff",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".xls": "application/vnd.ms-excel",
  ".csv": "text/csv",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".doc": "application/msword",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".dwg": "image/vnd.dwg",
  ".dxf": "image/vnd.dxf",
  ".zip": "application/zip",
  ".txt": "text/plain"
};
const ALLOWED_EXTENSIONS = Object.keys(MIME_BY_EXT);

function safeOriginalName(name) {
  // multer entrega o nome em latin1; converte para UTF-8 (acentos) e limita o tamanho.
  const utf8 = Buffer.from(String(name || "file"), "latin1").toString("utf8");
  return path.basename(utf8).replace(/[\u0000-\u001f]/g, "").slice(0, 255) || "file";
}

async function nextSortOrder(packageId) {
  return ((await Attachment.max("sortOrder", { where: { packageId } })) || 0) + 1;
}

async function list(packageId) {
  const rows = await Attachment.findAll({
    where: { packageId: uuid(packageId, "packageId") },
    order: [["sortOrder", "ASC"], ["createdAt", "ASC"]]
  });
  return rows.map((a) => attachmentDto(a, { full: true }));
}

// Grava o arquivo (e as versões web/miniatura, se for foto) e cria o registro. Em caso de erro, apaga o que gravou.
async function storeOne({ pkg, lineId, kind, visibility, title, file, userId, sortOrder }) {
  const originalName = safeOriginalName(file.originalname);
  const ext = path.extname(originalName).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    throw new ValidationError("File type not allowed.", { field: "files", code: "file_type", allowed: ALLOWED_EXTENSIONS });
  }

  const id = randomUUID();
  const record = {
    id,
    packageId: pkg.id,
    lineId,
    kind,
    visibility: effectiveVisibility(kind, visibility),
    title,
    originalName,
    mimeType: MIME_BY_EXT[ext],
    sizeBytes: file.size ?? file.buffer.length,
    storageKey: keys.attachmentOriginal(pkg.id, id, ext),
    sortOrder,
    uploadedBy: userId
  };

  try {
    if (kind === "photo") {
      const info = await images.probe(file.buffer);
      if (!info) throw new ValidationError("Photos must be JPEG, PNG, WebP, TIFF or GIF images.", { field: "files", code: "not_an_image" });
      const variants = await images.makeVariants(file.buffer);
      record.webKey = keys.attachmentWeb(pkg.id, id);
      record.thumbKey = keys.attachmentThumb(pkg.id, id);
      record.width = variants.width;
      record.height = variants.height;
      await storage.put(record.webKey, variants.web);
      await storage.put(record.thumbKey, variants.thumb);
    }
    await storage.put(record.storageKey, file.buffer);
    return await Attachment.create(record);
  } catch (err) {
    await storage.removePrefix(keys.attachmentPrefix(pkg.id, id)).catch(() => {});
    throw err;
  }
}

async function upload(packageId, files, body, userId) {
  const pkg = await Package.findByPk(uuid(packageId, "packageId"));
  if (!pkg) throw new NotFoundError("Package not found.");
  if (!files || files.length === 0) throw new ValidationError("No file received.", { field: "files", code: "required" });

  const kind = oneOf(body.kind, "kind", ATTACHMENT_KINDS);
  const visibility = oneOf(body.visibility || (kind === "photo" ? "public" : "restricted"), "visibility", VISIBILITIES);
  const title = files.length === 1 ? optionalString(body.title, "title", { max: 200 }) : null;
  let lineId = null;
  if (body.lineId) {
    lineId = uuid(body.lineId, "lineId");
    const line = await PackageLine.findOne({ where: { id: lineId, packageId: pkg.id } });
    if (!line) throw new ValidationError("Line not found in this package.", { field: "lineId", code: "invalid" });
  }

  let sortOrder = await nextSortOrder(pkg.id);
  const created = [];
  for (const file of files) {
    created.push(await storeOne({ pkg, lineId, kind, visibility, title, file, userId, sortOrder }));
    sortOrder += 1;
  }
  return created.map((a) => attachmentDto(a, { full: true }));
}

async function update(id, body) {
  const att = await Attachment.findByPk(uuid(id, "id"));
  if (!att) throw new NotFoundError("Attachment not found.");
  const patch = {};
  if (body.title !== undefined) patch.title = optionalString(body.title, "title", { max: 200 });
  if (body.kind !== undefined) {
    patch.kind = oneOf(body.kind, "kind", ATTACHMENT_KINDS);
    if (patch.kind === "photo" && !att.webKey) {
      throw new ValidationError("Only images uploaded as photos can be photos.", { field: "kind", code: "not_an_image" });
    }
  }
  if (body.visibility !== undefined) patch.visibility = oneOf(body.visibility, "visibility", VISIBILITIES);
  if (body.lineId !== undefined) {
    if (body.lineId === null || body.lineId === "") patch.lineId = null;
    else {
      const line = await PackageLine.findOne({ where: { id: uuid(body.lineId, "lineId"), packageId: att.packageId } });
      if (!line) throw new ValidationError("Line not found in this package.", { field: "lineId", code: "invalid" });
      patch.lineId = line.id;
    }
  }
  if (body.sortOrder !== undefined && Number.isInteger(body.sortOrder)) patch.sortOrder = body.sortOrder;
  const kind = patch.kind ?? att.kind;
  patch.visibility = effectiveVisibility(kind, patch.visibility ?? att.visibility);
  await att.update(patch);
  return attachmentDto(att, { full: true });
}

async function remove(id) {
  const att = await Attachment.findByPk(uuid(id, "id"));
  if (!att) throw new NotFoundError("Attachment not found.");
  await att.destroy();
  await storage.removePrefix(keys.attachmentPrefix(att.packageId, att.id));
}

// Cria um anexo a partir de um buffer já em memória (planilha importada, seeds).
async function createFromBuffer({ packageId, kind, visibility, title, originalName, buffer, userId = null, lineId = null }) {
  const pkg = await Package.findByPk(packageId);
  if (!pkg) throw new NotFoundError("Package not found.");
  const att = await storeOne({
    pkg,
    lineId,
    kind,
    visibility,
    title: title || null,
    file: { originalname: Buffer.from(originalName, "utf8").toString("latin1"), buffer, size: buffer.length },
    userId,
    sortOrder: await nextSortOrder(pkg.id)
  });
  return attachmentDto(att, { full: true });
}

module.exports = { list, upload, update, remove, createFromBuffer, ALLOWED_EXTENSIONS, MIME_BY_EXT };
