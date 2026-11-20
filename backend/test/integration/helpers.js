"use strict";

// Sobe a API numa porta livre, com um diretório de arquivos temporário, e oferece um cliente HTTP com cookies.
const os = require("node:os");
const fs = require("node:fs");
const path = require("node:path");

const ENABLED = process.env.MR_TEST_DB === "1";

let storageDir = null;
if (ENABLED) {
  storageDir = fs.mkdtempSync(path.join(os.tmpdir(), "mr-it-"));
  process.env.STORAGE_DIR = storageDir;
  process.env.COOKIE_SECURE = "false";
}

async function startServer() {
  const app = require("../../src/app");
  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const base = `http://127.0.0.1:${server.address().port}`;
  return { base, close: () => new Promise((r) => server.close(r)) };
}

async function resetDatabase() {
  const { sequelize } = require("../../src/models");
  await sequelize.query(
    "TRUNCATE inquiry, access_log, access_link_package, access_link, attachment, lot_sale, package_lot, lot, package, origin, setting, app_user RESTART IDENTITY CASCADE"
  );
  // Origens iniciais, como a migration de dados 20261117110100 cria.
  await sequelize.query(
    `INSERT INTO origin (id, name, code, active) VALUES (gen_random_uuid(), 'Araguaia Nickel Project', 'ANM', true), (gen_random_uuid(), 'Niquelândia', 'VTM', true)`
  );
}

// Id da origem pela sigla (para criar pacote nos testes).
async function originId(code = "ANM") {
  const { Origin } = require("../../src/models");
  return (await Origin.findOne({ where: { code } })).id;
}

async function createSeller({ email = "seller@example.test", password = "correct-horse-battery", role = "seller" } = {}) {
  const { User } = require("../../src/models");
  const bcrypt = require("bcryptjs");
  await User.create({ email, name: "Test Seller", role, passwordHash: await bcrypt.hash(password, 4) });
  return { email, password };
}

// Cliente com pote de cookies próprio (um por "pessoa": vendedor, comprador, anônimo).
function client(base) {
  const jar = new Map();
  async function request(method, url, { json, form, headers = {} } = {}) {
    const h = { ...headers };
    if (jar.size) h.cookie = [...jar].map(([k, v]) => `${k}=${v}`).join("; ");
    let body;
    if (json !== undefined) {
      h["content-type"] = "application/json";
      body = JSON.stringify(json);
    } else if (form) body = form;
    const res = await fetch(base + url, { method, headers: h, body, redirect: "manual" });
    for (const c of res.headers.getSetCookie()) {
      const [pair, ...attrs] = c.split(";");
      const [name, ...rest] = pair.split("=");
      const value = rest.join("=");
      const expired = attrs.some((a) => /expires=thu, 01 jan 1970/i.test(a.trim())) || value === "";
      if (expired) jar.delete(name.trim());
      else jar.set(name.trim(), value);
    }
    const type = res.headers.get("content-type") || "";
    const data = type.includes("application/json") ? await res.json() : Buffer.from(await res.arrayBuffer());
    return { status: res.status, headers: res.headers, data };
  }
  return {
    jar,
    get: (u, o) => request("GET", u, o),
    post: (u, o) => request("POST", u, o),
    put: (u, o) => request("PUT", u, o),
    patch: (u, o) => request("PATCH", u, o),
    del: (u, o) => request("DELETE", u, o)
  };
}

async function loggedInSeller(base, opts) {
  const creds = await createSeller(opts);
  const c = client(base);
  const res = await c.post("/api/v1/auth/login", { json: creds });
  if (res.status !== 200) throw new Error(`login failed: ${res.status}`);
  return c;
}

function fileForm(fields, files) {
  const form = new FormData();
  for (const [k, v] of Object.entries(fields || {})) form.append(k, v);
  for (const f of files) form.append(f.field || "files", new Blob([f.buffer], { type: f.type || "application/octet-stream" }), f.name);
  return form;
}

// Lotes fictícios gravados direto no banco (quando o teste não é da importação). Aceita "L-1" ou { lotNumber, ... }.
async function createLots(specs) {
  const { Lot } = require("../../src/models");
  const rows = specs.map((s) => (typeof s === "string" ? { lotNumber: s } : s));
  return Lot.bulkCreate(rows.map((r) => ({ title: `Fictitious lot ${r.lotNumber}`, siteName: "Site A", status: "available", ...r })));
}

// Pacote manual com lotes, na situação pedida (via API, como o vendedor faz).
async function packageWithLots(seller, { lots, status = "draft", ...json }) {
  const created = await seller.post("/api/v1/seller/packages", { json: { name: `Package ${Date.now()}`, ...json, lotIds: lots.map((l) => l.id) } });
  if (created.status !== 201) throw new Error(`create failed: ${created.status} ${JSON.stringify(created.data)}`);
  if (status !== "draft") {
    const res = await seller.put(`/api/v1/seller/packages/${created.data.id}/status`, { json: { status, confirm: true } });
    if (res.status !== 200) throw new Error(`status failed: ${res.status} ${JSON.stringify(res.data)}`);
  }
  return created.data;
}

// Cabeçalho da aba "Matriz de lotes" (nomes como na planilha do cliente; dados sempre fictícios).
const LOT_HEADER = ["Lot Number", "Site Name", "Title / Equipment Description", "Master Supplier", "Equipamento ou sistema vinculado", "Família comercial", "Subfamília", "STATUS", "Price"];

// Planilha .xlsx em memória. rows: [lotNumber, site, title, supplier, system, family, subfamily, status, price?].
function lotWorkbook(rows, { header = LOT_HEADER, sheet = "Matriz de lotes", extraSheets = [] } = {}) {
  const XLSX = require("xlsx");
  const wb = XLSX.utils.book_new();
  for (const name of extraSheets) XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["Notes"]]), name);
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["Fictitious inventory"], [], header, ...rows]), sheet);
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
}

// Chaves de todos os arquivos guardados no diretório de teste ("packages/<id>/<id>/original.pdf").
function listFiles(dir) {
  if (!dir || !fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((e) => e.isFile())
    .map((e) => path.relative(dir, path.join(e.parentPath || e.path, e.name)).split(path.sep).join("/"));
}

async function cleanup() {
  const { sequelize } = require("../../src/models");
  await sequelize.close();
  if (storageDir) fs.rmSync(storageDir, { recursive: true, force: true });
}

module.exports = {
  ENABLED,
  startServer,
  resetDatabase,
  createSeller,
  client,
  loggedInSeller,
  fileForm,
  cleanup,
  originId,
  createLots,
  packageWithLots,
  lotWorkbook,
  listFiles,
  LOT_HEADER
};
