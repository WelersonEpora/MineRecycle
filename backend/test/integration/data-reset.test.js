"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const h = require("./helpers");

const skip = !h.ENABLED && "needs a test database (npm run test:integration)";
const PDF = Buffer.from("%PDF-1.4\n%%EOF");
const DAY = 24 * 3600 * 1000;

test("data reset: admin only, phrase and password, wipes business data and files", { skip }, async (t) => {
  const server = await h.startServer();
  t.after(async () => {
    await server.close();
    await h.cleanup();
  });
  await h.resetDatabase();
  const admin = await h.loggedInSeller(server.base, { email: "admin@example.test", role: "admin" });
  const seller = await h.loggedInSeller(server.base, { email: "seller@example.test" });
  const url = "/api/v1/seller/data-reset";
  const storageDir = process.env.STORAGE_DIR;

  // Dados fictícios: lotes, pacote com arquivo, arquivo de lote, pedido, link e contato comercial.
  const lots = await h.createLots(["L-1", "L-2"]);
  const pkg = await h.packageWithLots(admin, { lots, status: "active" });
  const up = (owner, name) => admin.post(`/api/v1/seller/${owner}/attachments`, { form: h.fileForm({ kind: "datasheet" }, [{ name, buffer: PDF }]) });
  assert.equal((await up(`packages/${pkg.id}`, "ficha.pdf")).status, 201);
  assert.equal((await up(`lots/${lots[0].id}`, "lote.pdf")).status, 201);
  assert.equal((await admin.post("/api/v1/seller/inquiries", { json: { packageId: pkg.id, channel: "email", email: "buyer@example.test" } })).status, 201);
  const link = { label: "Buyer", expiresAt: new Date(Date.now() + DAY).toISOString(), packageIds: [pkg.id] };
  assert.equal((await admin.post("/api/v1/seller/access-links", { json: link })).status, 201);
  assert.equal((await admin.put("/api/v1/seller/contact", { json: { email: "sales@example.test" } })).status, 200);
  const storedFiles = () => h.listFiles(storageDir).filter((k) => k.startsWith("packages/") || k.startsWith("lots/"));
  assert.ok(storedFiles().length >= 2);

  await t.test("sellers who are not admins cannot see or run it", async () => {
    assert.equal((await seller.get(url)).status, 403);
    assert.equal((await seller.post(url, { json: { confirm: "DELETE ALL", password: "correct-horse-battery" } })).status, 403);
  });

  await t.test("summary counts what would be deleted", async () => {
    const res = await admin.get(url);
    assert.equal(res.status, 200);
    assert.deepEqual(
      { ...res.data.counts, attachmentBytes: res.data.counts.attachmentBytes > 0 },
      { lots: 2, packages: 1, attachments: 2, attachmentBytes: true, inquiries: 1, accessLinks: 1 }
    );
    assert.equal(res.data.lastReset, null);
  });

  await t.test("wrong phrase or password deletes nothing", async () => {
    const phrase = await admin.post(url, { json: { confirm: "apagar tudo", password: "correct-horse-battery" } });
    assert.equal(phrase.status, 400);
    assert.equal(phrase.data.error.code, "RESET_CONFIRM_INVALID");
    const password = await admin.post(url, { json: { confirm: "APAGAR TUDO", password: "wrong-password" } });
    assert.equal(password.status, 400);
    assert.equal(password.data.error.code, "RESET_PASSWORD_INVALID");
    assert.equal((await admin.get(url)).data.counts.lots, 2);
  });

  await t.test("reset wipes lots, packages, files, requests and links", async () => {
    const res = await admin.post(url, { json: { confirm: " APAGAR TUDO ", password: "correct-horse-battery" } });
    assert.equal(res.status, 200);
    assert.equal(res.data.deleted.lots, 2);
    assert.equal(res.data.filesRemoved, true);
    const after = (await admin.get(url)).data;
    assert.deepEqual(after.counts, { lots: 0, packages: 0, attachments: 0, attachmentBytes: 0, inquiries: 0, accessLinks: 0 });
    assert.equal(after.lastReset.userName, "Test Seller");
    assert.equal(after.lastReset.counts.packages, 1);
    assert.deepEqual(storedFiles(), []);
  });

  await t.test("users, sales contact and origins stay; numbering restarts", async () => {
    assert.equal((await seller.get("/api/v1/seller/packages")).status, 200);
    assert.equal((await h.client(server.base).get("/api/v1/contact")).data.email, "sales@example.test");
    assert.equal((await admin.get("/api/v1/seller/origins")).data.length, 2);
    const fresh = await h.packageWithLots(admin, { lots: await h.createLots(["L-9"]) });
    assert.equal(fresh.number, 1);
  });
});
