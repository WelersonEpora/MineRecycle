"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const h = require("./helpers");

const skip = !h.ENABLED && "needs a test database (npm run test:integration)";
const DAY = 24 * 60 * 60 * 1000;

test("buyer inquiries and team contact", { skip }, async (t) => {
  const server = await h.startServer();
  t.after(async () => {
    await server.close();
    await h.cleanup();
  });
  await h.resetDatabase();
  const admin = await h.loggedInSeller(server.base, { email: "admin@example.test", role: "admin" });
  const seller = await h.loggedInSeller(server.base, { email: "seller@example.test" });
  const anon = h.client(server.base);
  const { Inquiry } = require("../../src/models");
  const anm = await h.originId("ANM");

  const mk = async (number, status) => {
    const p = (await admin.post("/api/v1/seller/packages", { json: { number, name: `Pkg ${number}`, type: "bulk", locations: ["uberaba"], originId: anm } })).data;
    if (status !== "draft") await admin.put(`/api/v1/seller/packages/${p.id}/status`, { json: { status } });
    return p;
  };
  const active = await mk(1, "active");
  const sold = await mk(2, "sold");
  const draft = await mk(3, "draft");
  const ask = (c, number, json) => c.post(`/api/v1/catalog/packages/${number}/inquiries`, { json });

  await t.test("contact: everyone reads, only admin changes, number kept as digits", async () => {
    assert.deepEqual((await anon.get("/api/v1/contact")).data, { email: null, whatsapp: null });
    assert.equal((await seller.put("/api/v1/seller/contact", { json: { email: "sales@example.test" } })).status, 403);
    assert.equal((await admin.put("/api/v1/seller/contact", { json: { whatsapp: "123" } })).data.error.code, "WHATSAPP_INVALID");
    const ok = await admin.put("/api/v1/seller/contact", { json: { email: "Sales@Example.test", whatsapp: "+55 (11) 98765-4321" } });
    assert.equal(ok.status, 200);
    assert.deepEqual((await anon.get("/api/v1/contact")).data, { email: "sales@example.test", whatsapp: "5511987654321" });
  });

  await t.test("visitor asks about a public package; email or phone required", async () => {
    assert.equal((await anon.get(`/api/v1/catalog/packages/1`)).data.canInquire, true);
    const none = await ask(anon, 1, { name: "No contact", message: "Hi" });
    assert.equal(none.status, 400);
    assert.equal(none.data.error.code, "INQUIRY_CONTACT_REQUIRED");
    assert.equal((await ask(anon, 1, { email: "not-an-email" })).status, 400);
    const ok = await ask(anon, 1, { phone: "+1 555 0100", message: "Is it still available?", language: "pt" });
    assert.equal(ok.status, 201);
    const row = await Inquiry.findOne();
    assert.equal(row.packageId, active.id);
    assert.equal(row.packageName, "Pkg 1");
    assert.equal(row.language, "pt");
    assert.equal(row.status, "new");
    assert.equal(row.accessLinkId, null);
  });

  await t.test("sold, draft and unknown packages do not take requests", async () => {
    assert.equal((await ask(anon, 2, { email: "a@example.test" })).status, 404);
    assert.equal((await ask(anon, 3, { email: "a@example.test" })).status, 404);
    assert.equal((await ask(anon, 999, { email: "a@example.test" })).status, 404);
    assert.equal((await ask(seller, 1, { email: "a@example.test" })).data.error.code, "INQUIRY_NOT_ALLOWED");
    assert.equal(await Inquiry.count(), 1);
  });

  await t.test("honeypot: same answer, nothing saved", async () => {
    const res = await ask(anon, 1, { email: "bot@example.test", website: "http://spam.test" });
    assert.equal(res.status, 201);
    assert.equal(await Inquiry.count(), 1);
  });

  await t.test("buyer with a link: request tied to the link; sold package in scope still refused", async () => {
    const link = (
      await admin.post("/api/v1/seller/access-links", {
        json: { label: "ACME Metals", expiresAt: new Date(Date.now() + 7 * DAY).toISOString(), packageIds: [active.id, sold.id] }
      })
    ).data;
    const buyer = h.client(server.base);
    await buyer.post("/api/v1/access/redeem", { json: { token: link.url.split("#")[1] } });
    assert.equal((await buyer.get(`/api/v1/catalog/packages/2`)).data.canInquire, false);
    assert.equal((await ask(buyer, 2, { email: "buyer@acme.test" })).data.error.code, "INQUIRY_NOT_ALLOWED");
    assert.equal((await ask(buyer, 1, { email: "buyer@acme.test", company: "ACME" })).status, 201);
    const row = await Inquiry.findOne({ where: { email: "buyer@acme.test" } });
    assert.equal(row.accessLinkId, link.id);
    assert.equal((await buyer.get(`/api/v1/catalog/packages/3`)).status, 404);
    void draft;
  });

  await t.test("team: list, take, reassign, status, note, filters and counts", async () => {
    assert.equal((await anon.get("/api/v1/seller/inquiries")).status, 401);
    const list = (await seller.get("/api/v1/seller/inquiries")).data;
    assert.equal(list.total, 2);
    assert.deepEqual(list.counts, { new: 2, in_progress: 0, done: 0, discarded: 0 });
    assert.equal(list.team.length, 2);
    const fromLink = list.items.find((i) => i.link);
    assert.equal(fromLink.link.label, "ACME Metals");
    assert.equal(fromLink.package.number, 1);

    // Assumir: responsável = quem clicou; novo vira em atendimento.
    const taken = (await seller.patch(`/api/v1/seller/inquiries/${fromLink.id}`, { json: { assignedTo: "me" } })).data;
    assert.equal(taken.assignee.name, "Test Seller");
    assert.equal(taken.status, "in_progress");
    assert.equal(taken.updatedBy.name, "Test Seller");
    const mine = (await seller.get("/api/v1/seller/inquiries?assignee=me")).data;
    assert.deepEqual(mine.items.map((i) => i.id), [fromLink.id]);
    assert.equal((await seller.get("/api/v1/seller/inquiries?assignee=none")).data.total, 1);

    const adminId = list.team.find((u) => u.id !== taken.assignee.id).id;
    const moved = (await seller.patch(`/api/v1/seller/inquiries/${fromLink.id}`, { json: { assignedTo: adminId, note: "Called on Monday" } })).data;
    assert.equal(moved.assignee.id, adminId);
    assert.equal(moved.note, "Called on Monday");
    const done = (await admin.patch(`/api/v1/seller/inquiries/${fromLink.id}`, { json: { status: "done" } })).data;
    assert.equal(done.status, "done");
    assert.equal((await admin.patch(`/api/v1/seller/inquiries/${fromLink.id}`, { json: { status: "lost" } })).status, 400);

    assert.equal((await seller.get("/api/v1/seller/inquiries?status=open")).data.total, 1);
    assert.equal((await seller.get("/api/v1/seller/inquiries?q=acme")).data.total, 1);
    assert.deepEqual((await seller.get("/api/v1/seller/inquiries/counts")).data, { new: 1, in_progress: 0, done: 1, discarded: 0 });
  });

  await t.test("deleting the package keeps the request readable; delete removes the request", async () => {
    await admin.del(`/api/v1/seller/packages/${active.id}`);
    const items = (await seller.get("/api/v1/seller/inquiries")).data.items;
    assert.equal(items.length, 2);
    assert.deepEqual(items[0].package, { id: null, number: null, name: "Pkg 1", status: null });
    assert.equal((await seller.del(`/api/v1/seller/inquiries/${items[0].id}`)).status, 204);
    assert.equal(await Inquiry.count(), 1);
  });
});
