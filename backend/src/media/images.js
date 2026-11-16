"use strict";

const sharp = require("sharp");

const WEB_MAX = 1600;
const THUMB_WIDTH = 480;
const THUMB_HEIGHT = 360;
const PHOTO_FORMATS = ["jpeg", "png", "webp", "tiff", "gif"];

// Lê o cabeçalho da imagem. -> { format, width, height } ou null se não for imagem suportada.
async function probe(buffer) {
  try {
    const meta = await sharp(buffer, { limitInputPixels: 120e6 }).metadata();
    if (!PHOTO_FORMATS.includes(meta.format)) return null;
    return { format: meta.format, width: meta.width, height: meta.height };
  } catch (_err) {
    return null;
  }
}

// Versão web (até 1600 px no maior lado) e miniatura (480x360, recorte central), em WebP e sem metadados
// (o sharp descarta EXIF/GPS por padrão). `rotate()` aplica a orientação da câmera antes de descartar o EXIF.
async function makeVariants(buffer) {
  const base = sharp(buffer, { limitInputPixels: 120e6, animated: false }).rotate();
  const web = await base
    .clone()
    .resize({ width: WEB_MAX, height: WEB_MAX, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer({ resolveWithObject: true });
  const thumb = await base
    .clone()
    .resize({ width: THUMB_WIDTH, height: THUMB_HEIGHT, fit: "cover", position: "attention" })
    .webp({ quality: 74 })
    .toBuffer();
  return { web: web.data, width: web.info.width, height: web.info.height, thumb };
}

module.exports = { probe, makeVariants, WEB_MAX, THUMB_WIDTH, THUMB_HEIGHT };
