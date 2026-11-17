"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const sharp = require("sharp");
const h = require("./helpers");

const skip = !h.ENABLED && "needs a test database (npm run test:integration)";
const DAY = 24 * 60 * 60 * 1000;

async function png() {
  return sharp({ create: { width: 900, height: 600, channels: 3, background: "#4a7" } }).png().toBuffer();
}

test("access links and attachment visibility", { skip }, async (t) => {
  const server = await h.startServer();
  t.after(async () => {
    await server.close();
    await h.cleanup();
  });
  await h.resetDatabase();
  const seller = await h.loggedInSeller(server.base);
  const anon = h.client(server.base);
  const { AccessLink, AccessLog } = require("../../src/models");

  const mk = async (number, status) => {
    const p = (await seller.post("/api/v1/seller/packages", { json: { number, name: `Pkg ${number}`, type: "equipment", locations: ["niquelandia"] } })).data;
    if (status !== "draft") await seller.put(`/api/v1/seller/packages/${p.id}/status`, { json: { status } });
    return p;
  };
  const active = await mk(10, "active");
  const negotiating = await mk(11, "under_negotiation");
  const other = await mk(12, "under_negotiation");
  const draft = await mk(13, "draft");

  const uploadTo = async (pkgId, fields, file) =>
    (await seller.post(`/api/v1/seller/packages/${pkgId}/attachments`, { form: h.fileForm(fields, [file]) })).data[0];
  const photo = await uploadTo(active.id, { kind: "photo" }, { name: "IMG_1.jpg", buffer: await png() });
  const datasheet = await uploadTo(active.id, { kind: "datasheet", visibility: "restricted" }, { name: "ficha.pdf", buffer: Buffer.from("%PDF-1.4\n%%EOF") });
  const proposal = await uploadTo(active.id, { kind: "proposal", visibility: "public" }, { name: "proposta.pdf", buffer: Buffer.from("%PDF-1.4\n%%EOF") });
  const publicDoc = await uploadTo(active.id, { kind: "drawing", visibility: "public" }, { name: "layout.pdf", buffer: Buffer.from("%PDF-1.4\n%%EOF") });
  const internalDoc = await uploadTo(active.id, { kind: "list", visibility: "internal" }, { name: "planilha.pdf", buffer: Buffer.from("%PDF-1.4\n%%EOF") });
  const draftPhoto = await uploadTo(draft.id, { kind: "photo" }, { name: "d.png", buffer: await png() });
  const negotiatingDoc = await uploadTo(negotiating.id, { kind: "datasheet" }, { name: "n.pdf", buffer: Buffer.from("%PDF-1.4\n%%EOF") });

  await t.test("photos get web and thumbnail versions; proposals are forced restricted", async () => {
    assert.equal(photo.visibility, "public");
    assert.ok(photo.webUrl && photo.thumbUrl);
    assert.ok(photo.width <= 1600);
    assert.equal(proposal.visibility, "restricted");
    const thumb = await anon.get(photo.thumbUrl);
    assert.equal(thumb.status, 200);
    assert.equal(thumb.headers.get("content-type"), "image/webp");
    const meta = await sharp(thumb.data).metadata();
    assert.deepEqual([meta.width, meta.height], [480, 360]);
  });

  await t.test("anonymous visitor sees only public attachments of showcase packages", async () => {
    const detail = (await anon.get("/api/v1/catalog/packages/10")).data;
    assert.equal(detail.access, "public");
    assert.deepEqual(detail.attachments.map((a) => a.id).sort(), [photo.id, publicDoc.id].sort());
    assert.equal(detail.restrictedCount, 2);
    assert.equal(detail.attachments.find((a) => a.id === photo.id).url, null);

    assert.equal((await anon.get(`/api/v1/files/${datasheet.id}/original`)).status, 404);
    assert.equal((await anon.get(`/api/v1/files/${proposal.id}/original`)).status, 404);
    assert.equal((await anon.get(`/api/v1/files/${photo.id}/original`)).status, 404);
    assert.equal((await anon.get(`/api/v1/files/${publicDoc.id}/original`)).status, 200);
    assert.equal((await anon.get(`/api/v1/files/${internalDoc.id}/original`)).status, 404);
    assert.equal((await anon.get(`/api/v1/files/${draftPhoto.id}/thumb`)).status, 404);
    assert.equal((await anon.get("/api/v1/catalog/packages/11")).status, 404);
    assert.equal((await anon.get("/api/v1/catalog/packages/13")).status, 404);

    const list = (await anon.get("/api/v1/catalog/packages")).data.items.map((p) => p.number);
    assert.deepEqual(list, [10]);
  });

  await t.test("restricted files are never cached; seller reads everything", async () => {
    const res = await seller.get(`/api/v1/files/${datasheet.id}/original`);
    assert.equal(res.status, 200);
    assert.equal(res.headers.get("cache-control"), "private, no-store");
    assert.equal((await seller.get(`/api/v1/files/${draftPhoto.id}/original`)).status, 200);
    assert.equal((await seller.get(`/api/v1/files/${internalDoc.id}/original`)).status, 200);
    assert.equal((await seller.get("/api/v1/catalog/packages/10")).data.attachments.length, 5);
  });

  await t.test("draft packages cannot be shared", async () => {
    const res = await seller.post("/api/v1/seller/access-links", {
      json: { label: "Buyer", expiresAt: new Date(Date.now() + DAY).toISOString(), packageIds: [draft.id] }
    });
    assert.equal(res.status, 400);
    assert.equal(res.data.error.details.code, "package_not_available");
  });

  await t.test("expiry must be in the future and within a year", async () => {
    const past = await seller.post("/api/v1/seller/access-links", {
      json: { label: "Buyer", expiresAt: new Date(Date.now() - DAY).toISOString(), packageIds: [active.id] }
    });
    assert.equal(past.status, 400);
    const far = await seller.post("/api/v1/seller/access-links", {
      json: { label: "Buyer", expiresAt: new Date(Date.now() + 400 * DAY).toISOString(), packageIds: [active.id] }
    });
    assert.equal(far.status, 400);
  });

  const created = (
    await seller.post("/api/v1/seller/access-links", {
      json: { label: "ACME Metals", buyerEmail: "buyer@acme.test", expiresAt: new Date(Date.now() + 7 * DAY).toISOString(), packageIds: [active.id, negotiating.id] }
    })
  ).data;
  const token = created.url.split("#")[1];

  await t.test("link URL carries the token in the fragment and the database stores only its hash", async () => {
    assert.match(created.url, /\/access#[A-Za-z0-9_-]{40,}$/);
    const row = await AccessLink.findByPk(created.id);
    assert.notEqual(row.tokenHash, token);
    assert.equal(row.tokenHash.length, 64);
    const listed = (await seller.get("/api/v1/seller/access-links")).data[0];
    assert.equal(listed.url, undefined);
  });

  const buyer = h.client(server.base);

  await t.test("invalid token is refused", async () => {
    const res = await buyer.post("/api/v1/access/redeem", { json: { token: "x".repeat(43) } });
    assert.equal(res.status, 401);
    assert.equal(res.data.error.code, "LINK_INVALID");
  });

  await t.test("buyer opens the link and sees restricted files of packages in scope", async () => {
    const res = await buyer.post("/api/v1/access/redeem", { json: { token } });
    assert.equal(res.status, 204);
    assert.ok(buyer.jar.has("mr_buyer"));

    const session = (await buyer.get("/api/v1/access/session")).data;
    assert.deepEqual(session.packages.map((p) => p.number), [10, 11]);

    const detail = (await buyer.get("/api/v1/catalog/packages/10")).data;
    assert.equal(detail.access, "buyer");
    assert.equal(detail.attachments.length, 4);
    // Interno (planilha original da importação): nem o comprador vê.
    assert.ok(!detail.attachments.some((a) => a.id === internalDoc.id));
    assert.equal((await buyer.get(`/api/v1/files/${internalDoc.id}/original`)).status, 404);
    assert.equal((await buyer.get(`/api/v1/files/${datasheet.id}/original`)).status, 200);
    assert.equal((await buyer.get(`/api/v1/files/${proposal.id}/original`)).status, 200);
    assert.equal((await buyer.get(`/api/v1/files/${photo.id}/original`)).status, 200);

    // Pacote em negociação: fora da vitrine, mas no escopo do link.
    assert.equal((await buyer.get("/api/v1/catalog/packages/11")).data.access, "buyer");
    assert.equal((await buyer.get(`/api/v1/files/${negotiatingDoc.id}/original`)).status, 200);
    // Fora do escopo.
    assert.equal((await buyer.get("/api/v1/catalog/packages/12")).status, 404);
    assert.equal((await buyer.get(`/api/v1/files/${draftPhoto.id}/thumb`)).status, 404);
    assert.ok(other.id);
  });

  await t.test("accesses are logged", async () => {
    const logs = (await seller.get(`/api/v1/seller/access-links/${created.id}/logs`)).data;
    const actions = logs.map((l) => l.action);
    assert.ok(actions.includes("open"));
    assert.ok(actions.includes("view_package"));
    assert.equal(actions.filter((a) => a === "download").length, 4);
    assert.ok(logs.some((l) => l.action === "download" && l.attachment?.kind === "proposal"));
    const listed = (await seller.get("/api/v1/seller/access-links")).data.find((l) => l.id === created.id);
    assert.equal(listed.accessCount, logs.length);
  });

  await t.test("changing the scope takes effect immediately", async () => {
    await seller.patch(`/api/v1/seller/access-links/${created.id}`, { json: { packageIds: [active.id] } });
    assert.equal((await buyer.get("/api/v1/catalog/packages/11")).status, 404);
  });

  await t.test("an expired link stops working, even with the cookie already set", async () => {
    await AccessLink.update({ expiresAt: new Date(Date.now() - 1000) }, { where: { id: created.id } });
    assert.equal((await buyer.get(`/api/v1/files/${datasheet.id}/original`)).status, 404);
    assert.equal((await buyer.get("/api/v1/access/session")).status, 401);
    const again = await h.client(server.base).post("/api/v1/access/redeem", { json: { token } });
    assert.equal(again.status, 410);
    assert.equal(again.data.error.code, "LINK_EXPIRED");
  });

  await t.test("a revoked link stops working immediately", async () => {
    const link2 = (
      await seller.post("/api/v1/seller/access-links", {
        json: { label: "Second", expiresAt: new Date(Date.now() + DAY).toISOString(), packageIds: [active.id] }
      })
    ).data;
    const b2 = h.client(server.base);
    await b2.post("/api/v1/access/redeem", { json: { token: link2.url.split("#")[1] } });
    assert.equal((await b2.get(`/api/v1/files/${datasheet.id}/original`)).status, 200);
    const revoked = (await seller.post(`/api/v1/seller/access-links/${link2.id}/revoke`)).data;
    assert.equal(revoked.state, "revoked");
    assert.equal((await b2.get(`/api/v1/files/${datasheet.id}/original`)).status, 404);
    const again = await h.client(server.base).post("/api/v1/access/redeem", { json: { token: link2.url.split("#")[1] } });
    assert.equal(again.data.error.code, "LINK_REVOKED");
    assert.ok((await AccessLog.count()) > 0);
  });

  await t.test("showcase statuses come from settings (admin only)", async () => {
    assert.equal((await seller.put("/api/v1/seller/settings", { json: { showcaseStatuses: ["active", "under_negotiation"] } })).status, 403);
    const admin = await h.loggedInSeller(server.base, { email: "admin@example.test", role: "admin" });
    const bad = await admin.put("/api/v1/seller/settings", { json: { showcaseStatuses: ["draft"] } });
    assert.equal(bad.status, 400);
    const ok = await admin.put("/api/v1/seller/settings", { json: { showcaseStatuses: ["active", "under_negotiation"] } });
    assert.equal(ok.status, 200);
    const list = (await anon.get("/api/v1/catalog/packages")).data.items.map((p) => p.number);
    assert.deepEqual(list, [10, 11, 12]);
    assert.equal((await anon.get(`/api/v1/files/${negotiatingDoc.id}/original`)).status, 404);
  });

  await t.test("deactivated seller loses access at once", async () => {
    const admin = h.client(server.base);
    await admin.post("/api/v1/auth/login", { json: { email: "admin@example.test", password: "correct-horse-battery" } });
    const users = (await admin.get("/api/v1/seller/users")).data;
    const s = users.find((u) => u.email === "seller@example.test");
    await admin.patch(`/api/v1/seller/users/${s.id}`, { json: { active: false } });
    assert.equal((await seller.get("/api/v1/seller/packages")).status, 401);
  });
});
