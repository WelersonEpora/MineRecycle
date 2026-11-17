"use strict";

// Dados FICTÍCIOS para testes, demonstração e ambiente local. Não é um seeder do sequelize: nunca roda no deploy.
//   npm run seed:demo            só roda com o banco sem pacotes
//   npm run seed:demo -- --reset apaga TODOS os pacotes (e arquivos) antes; recusado com NODE_ENV=production
const sharp = require("sharp");
const { sequelize, Package, User } = require("../src/models");
const lineService = require("../src/services/line.service");
const attachmentService = require("../src/services/attachment.service");
const accessLinkService = require("../src/services/access-link.service");
const packageService = require("../src/services/package.service");
const { normalizeUnit } = require("../src/import/units");

const RESET = process.argv.includes("--reset");

function escapeXml(s) {
  return s.replace(/[<>&"']/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[c]);
}

// Foto de mentira: fundo colorido, um "equipamento" em blocos e uma legenda.
async function fakePhoto(caption, hue) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1800" height="1200">
    <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="hsl(${hue},35%,70%)"/><stop offset="1" stop-color="hsl(${hue},30%,35%)"/></linearGradient></defs>
    <rect width="1800" height="1200" fill="url(#g)"/>
    <rect x="0" y="900" width="1800" height="300" fill="hsl(30,20%,30%)"/>
    <rect x="520" y="380" width="760" height="560" rx="18" fill="hsl(${(hue + 180) % 360},25%,40%)" stroke="#222" stroke-width="8"/>
    <rect x="600" y="300" width="160" height="90" fill="#555"/><rect x="1040" y="300" width="160" height="90" fill="#555"/>
    <g fill="#333">${Array.from({ length: 9 }, (_, i) => `<rect x="${560 + i * 80}" y="440" width="34" height="440"/>`).join("")}</g>
    <rect x="40" y="40" width="1100" height="110" rx="12" fill="rgba(0,0,0,.55)"/>
    <text x="80" y="118" font-family="sans-serif" font-size="58" fill="#fff">${escapeXml(caption)}</text>
    <text x="80" y="1160" font-family="sans-serif" font-size="36" fill="rgba(255,255,255,.7)">DEMO DATA - NOT A REAL ASSET</text>
  </svg>`;
  return sharp(Buffer.from(svg)).jpeg({ quality: 85 }).toBuffer();
}

// PDF mínimo de uma página com algumas linhas de texto.
function fakePdf(title, lines) {
  const text = [title, "", ...lines, "", "Demo document - fictitious data."]
    .map((l, i) => `BT /F1 ${i === 0 ? 18 : 11} Tf 60 ${760 - i * 20} Td (${l.replace(/[()\\]/g, "")}) Tj ET`)
    .join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${Buffer.byteLength(text)} >>\nstream\n${text}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [];
  objects.forEach((o, i) => {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("");
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(pdf);
}

// Gerador determinístico, para o seed sair igual toda vez.
function rng(seed) {
  let s = seed;
  return () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648);
}

function bulkLines(seed, catalog, count) {
  const rand = rng(seed);
  const lines = [];
  for (let i = 1; i <= count; i += 1) {
    const [desc, unit, maxQty, fractional] = catalog[Math.floor(rand() * catalog.length)];
    const qty = fractional ? (rand() * maxQty).toFixed(2) : String(1 + Math.floor(rand() * maxQty));
    const stor = `STOR-${String(10000 + Math.floor(rand() * 400)).padStart(6, "0")}`;
    const u = normalizeUnit(unit);
    lines.push({
      itemNo: String(i),
      description: desc,
      quantity: qty,
      unit: u.unit,
      unitRaw: u.raw,
      storCode: stor,
      tag: rand() < 0.2 ? `TAG-${100 + i}` : null,
      warehouseLocation: `A${1 + Math.floor(rand() * 9)}-R${1 + Math.floor(rand() * 20)}`,
      parentItemNo: null,
      sortOrder: i
    });
  }
  return lines;
}

const ELECTRICAL = [
  ["Three-pole circuit breaker 100 A", "pç", 20],
  ["Copper cable 4 mm², black", "MT", 800, true],
  ["Contactor 32 A, 220 V coil", "UN", 30],
  ["Terminal block 6 mm²", "PEÇ", 400],
  ["Cable tray 300 mm, galvanized", "m", 120, true],
  ["Junction box IP65", "un", 50],
  ["LED floodlight 150 W", "pç", 40],
  ["Insulated cable lug 35 mm²", "CX", 15],
  ["Electrical tape 19 mm", "RL", 60],
  ["Power distribution panel, 12 ways", "CJ", 4]
];
const STRUCTURAL = [
  ["W-beam 200 x 46 kg/m", "kg", 5000, true],
  ["Steel plate 3/8 in, ASTM A36", "chapa", 40],
  ["Angle bar 2 x 1/4 in", "barra", 120],
  ["Hex bolt M20 x 80 with nut", "pç", 900],
  ["Grating panel 1000 x 6000 mm", "PC", 30],
  ["Handrail section 3 m", "un", 60]
];
const CABLES = [
  ["Medium-voltage cable 15 kV 3x95 mm²", "M", 1200, true],
  ["Control cable 12x1.5 mm²", "m", 900, true],
  ["Bare copper earthing cable 50 mm²", "MT", 700, true],
  ["Instrumentation cable 2x1.0 mm² shielded", "m", 1500, true],
  ["Cable reel, wooden, empty", "un", 25]
];

const PACKAGES = [
  { number: 101, name: "Electrical materials - warehouse lot A", type: "bulk", locations: ["uberaba"], status: "active", hue: 210,
    description: "Assorted electrical materials stored in the central warehouse. Sold as a single lot. Quantities as per the attached inventory.",
    lines: () => bulkLines(101, ELECTRICAL, 140) },
  { number: 102, name: "Structural steel - plant building", type: "bulk", locations: ["niquelandia"], status: "active", hue: 25,
    description: "Structural steel from the dismantled process building, including a stair kit. Sold by weight, as a closed lot.",
    lines: () => {
      const l = bulkLines(102, STRUCTURAL, 36);
      const kit = [
        { itemNo: "37", description: "Access stair kit, complete", quantity: "1", unit: "KIT", unitRaw: "KIT" },
        { itemNo: "37.1", description: "Stair stringer 4.2 m", quantity: "2", unit: "PC", unitRaw: "pç" },
        { itemNo: "37.2", description: "Stair tread 900 mm", quantity: "18", unit: "PC", unitRaw: "pç" },
        { itemNo: "37.3", description: "Landing platform 1.2 x 1.2 m", quantity: "1", unit: "PC", unitRaw: "UN" }
      ].map((x, i) => ({ ...x, storCode: null, tag: null, warehouseLocation: "Yard 2", parentItemNo: x.itemNo.includes(".") ? "37" : null, sortOrder: 37 + i }));
      return [...l, ...kit];
    } },
  { number: 103, name: "Power and control cables - assorted reels", type: "bulk", locations: ["conceicao_do_araguaia"], status: "under_negotiation", hue: 140,
    description: "Reels of medium-voltage, control and instrumentation cables. Lengths measured in 2026.",
    lines: () => bulkLines(103, CABLES, 48) },
  { number: 201, name: "Power transformer 138/13.8 kV, 25 MVA", type: "equipment", locations: ["conceicao_do_araguaia"], status: "active", hue: 260,
    description: "Oil-immersed power transformer from the main substation. De-energized and preserved since shutdown. Datasheet and test report available.",
    lines: () => [
      { itemNo: "1", description: "Power transformer 138/13.8 kV, 25 MVA, ONAN/ONAF, with OLTC", quantity: "1", unit: "PC", unitRaw: "UN", storCode: null, tag: "TR-01", warehouseLocation: null, parentItemNo: null, sortOrder: 1 },
      { itemNo: "2", description: "Spare bushings set", quantity: "1", unit: "SET", unitRaw: "CJ", storCode: "STOR-020110", tag: null, warehouseLocation: "A3-R2", parentItemNo: null, sortOrder: 2 }
    ],
    photos: ["Transformer TR-01 - front", "Transformer TR-01 - nameplate", "Transformer TR-01 - radiators", "Transformer TR-01 - OLTC cabinet"],
    docs: [
      { kind: "datasheet", visibility: "public", title: "Transformer datasheet" },
      { kind: "drawing", visibility: "restricted", title: "General arrangement drawing" },
      { kind: "proposal", visibility: "restricted", title: "Commercial proposal" }
    ] },
  { number: 202, name: "Jaw crusher set", type: "equipment", locations: ["niquelandia"], status: "active", hue: 45,
    description: "Primary jaw crusher with drive motor and vibrating feeder. Sold as a set or per equipment.",
    lines: () => [
      { itemNo: "1", description: "Jaw crusher 1100 x 850 mm", quantity: "1", unit: "PC", unitRaw: "UN", storCode: null, tag: "BR-101", warehouseLocation: null, parentItemNo: null, sortOrder: 1 },
      { itemNo: "2", description: "Electric motor 160 kW, 6 poles", quantity: "1", unit: "PC", unitRaw: "UN", storCode: null, tag: "MO-101", warehouseLocation: null, parentItemNo: null, sortOrder: 2 },
      { itemNo: "3", description: "Vibrating grizzly feeder", quantity: "1", unit: "PC", unitRaw: "UN", storCode: null, tag: "AL-101", warehouseLocation: null, parentItemNo: null, sortOrder: 3 }
    ],
    linePhotos: { 1: "Jaw crusher BR-101", 2: "Motor MO-101", 3: "Feeder AL-101" },
    docs: [{ kind: "datasheet", visibility: "restricted", title: "Crusher manual (excerpt)" }] },
  { number: 203, name: "Conveyor belt drives", type: "equipment", locations: ["uberaba"], status: "draft", hue: 0,
    description: "Drive units removed from conveyors CV-01 to CV-04. Being catalogued.",
    lines: () => [
      { itemNo: "1", description: "Drive unit CV-01 (motor 75 kW + gearbox)", quantity: "1", unit: "SET", unitRaw: "CJ", storCode: null, tag: "CV-01", warehouseLocation: null, parentItemNo: null, sortOrder: 1 }
    ] },
  { number: 204, name: "Diesel generator 500 kVA", type: "equipment", locations: ["uberaba"], status: "sold", hue: 100,
    description: "Standby diesel generator set with acoustic enclosure.",
    lines: () => [
      { itemNo: "1", description: "Diesel generator set 500 kVA, 380 V", quantity: "1", unit: "PC", unitRaw: "UN", storCode: null, tag: "GE-01", warehouseLocation: null, parentItemNo: null, sortOrder: 1 }
    ],
    photos: ["Generator GE-01"] }
];

async function main() {
  const existing = await Package.count();
  if (existing && !RESET) {
    console.log(`There are already ${existing} packages. Nothing done. Use --reset to delete all packages first.`);
    return;
  }
  if (RESET) {
    if (process.env.NODE_ENV === "production") throw new Error("--reset is not allowed with NODE_ENV=production.");
    for (const p of await Package.findAll({ attributes: ["id"] })) await packageService.remove(p.id);
    console.log("All packages removed.");
  }

  const admin = await User.findOne({ where: { role: "admin" }, order: [["createdAt", "ASC"]] });
  const userId = admin?.id || null;

  for (const spec of PACKAGES) {
    const pkg = await Package.create({
      number: spec.number,
      name: spec.name,
      type: spec.type,
      locations: spec.locations,
      description: spec.description,
      status: spec.status,
      createdBy: userId,
      updatedBy: userId
    });
    const lines = spec.lines();
    await lineService.replaceLinesTx(pkg.id, lines);

    let photoIndex = 0;
    const photo = async (caption, lineId = null) =>
      attachmentService.createFromBuffer({
        packageId: pkg.id,
        kind: "photo",
        visibility: "public",
        originalName: `photo-${++photoIndex}.jpg`,
        buffer: await fakePhoto(caption, spec.hue + photoIndex * 12),
        userId,
        lineId
      });

    if (spec.type === "bulk") await photo(`${spec.name.split(" - ")[0]} - overview`);
    for (const caption of spec.photos || []) await photo(caption);
    if (spec.linePhotos) {
      const saved = (await lineService.listLines(pkg.id, { pageSize: 500 })).items;
      for (const [itemNo, caption] of Object.entries(spec.linePhotos)) {
        const line = saved.find((l) => l.itemNo === itemNo);
        await photo(caption, line.id);
      }
    }
    for (const doc of spec.docs || []) {
      await attachmentService.createFromBuffer({
        packageId: pkg.id,
        kind: doc.kind,
        visibility: doc.visibility,
        title: doc.title,
        originalName: `${doc.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.pdf`,
        buffer: fakePdf(doc.title, [`Package ${spec.number} - ${spec.name}`, `Location: ${spec.locations.join(", ")}`]),
        userId
      });
    }
    console.log(`Package ${spec.number} (${spec.type}, ${spec.status}): ${lines.length} lines`);
  }

  if (userId) {
    const ids = (await Package.findAll({ where: { number: [201, 202, 103] } })).map((p) => p.id);
    const link = await accessLinkService.create(
      { label: "Demo buyer", buyerEmail: "buyer@example.com", expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(), packageIds: ids },
      userId
    );
    console.log(`Demo buyer link (packages 103, 201, 202; 30 days): ${link.url}`);
  }
}

main()
  .then(() => sequelize.close())
  .catch(async (err) => {
    console.error(err.message);
    await sequelize.close();
    process.exit(1);
  });
