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
    "TRUNCATE access_log, access_link_package, access_link, attachment, package_line, package, setting, app_user RESTART IDENTITY CASCADE"
  );
  await sequelize.query(`INSERT INTO setting (key, value, updated_at) VALUES ('showcase_statuses', '["active"]', now())`);
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

async function cleanup() {
  const { sequelize } = require("../../src/models");
  await sequelize.close();
  if (storageDir) fs.rmSync(storageDir, { recursive: true, force: true });
}

module.exports = { ENABLED, startServer, resetDatabase, createSeller, client, loggedInSeller, fileForm, cleanup };
