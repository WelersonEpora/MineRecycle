"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const h = require("./helpers");

const skip = !h.ENABLED && "needs a test database (npm run test:integration)";

test("password length: 9 characters or more", { skip }, async (t) => {
  const server = await h.startServer();
  // A conexão com o banco fecha no último teste do arquivo.
  t.after(() => server.close());
  await h.resetDatabase();
  const admin = await h.loggedInSeller(server.base, { email: "admin@example.test", role: "admin" });
  const create = (password, email) => admin.post("/api/v1/seller/users", { json: { name: "Fictício", email, role: "seller", password } });

  await t.test("8 characters are refused", async () => {
    const res = await create("12345678", "eight@example.test");
    assert.equal(res.status, 400);
    assert.equal(res.data.error.details.code, "too_short");
  });

  await t.test("9 characters are accepted and work for login", async () => {
    const res = await create("123456789", "nine@example.test");
    assert.equal(res.status, 201);
    const login = await h.client(server.base).post("/api/v1/auth/login", { json: { email: "nine@example.test", password: "123456789" } });
    assert.equal(login.status, 200);
  });

  await t.test("own password change follows the same rule", async () => {
    const short = await admin.put("/api/v1/seller/me/password", { json: { currentPassword: "correct-horse-battery", newPassword: "12345678" } });
    assert.equal(short.status, 400);
    const ok = await admin.put("/api/v1/seller/me/password", { json: { currentPassword: "correct-horse-battery", newPassword: "abcdefghi" } });
    assert.equal(ok.status, 204);
  });
});

test("user deletion is logical and the same email reactivates it", { skip }, async (t) => {
  const server = await h.startServer();
  t.after(async () => {
    await server.close();
    await h.cleanup();
  });
  await h.resetDatabase();
  const admin = await h.loggedInSeller(server.base, { email: "admin@example.test", role: "admin" });
  const users = "/api/v1/seller/users";
  const created = await admin.post(users, { json: { name: "Vendedor Fictício", email: "ficticio@example.test", role: "seller", password: "senha-antiga" } });
  assert.equal(created.status, 201);
  const id = created.data.id;

  // Sessão aberta do vendedor antes da exclusão.
  const seller = h.client(server.base);
  assert.equal((await seller.post("/api/v1/auth/login", { json: { email: "ficticio@example.test", password: "senha-antiga" } })).status, 200);
  assert.equal((await seller.get("/api/v1/seller/packages")).status, 200);

  await t.test("admin cannot delete themselves", async () => {
    const me = (await admin.get(users)).data.find((u) => u.email === "admin@example.test");
    const self = await admin.del(`${users}/${me.id}`);
    assert.equal(self.status, 400);
    assert.equal(self.data.error.code, "USER_DELETE_SELF");
  });

  await t.test("deleted user leaves the list, loses the open session and cannot log in", async () => {
    assert.equal((await admin.del(`${users}/${id}`)).status, 204);
    assert.ok(!(await admin.get(users)).data.some((u) => u.id === id));
    assert.equal((await seller.get("/api/v1/seller/packages")).status, 401);
    const login = await h.client(server.base).post("/api/v1/auth/login", { json: { email: "ficticio@example.test", password: "senha-antiga" } });
    assert.equal(login.status, 401);
    assert.equal((await admin.patch(`${users}/${id}`, { json: { active: true } })).status, 404);
    assert.equal((await admin.del(`${users}/${id}`)).status, 404);
  });

  await t.test("creating the same email again reactivates the record with the new data", async () => {
    const again = await admin.post(users, { json: { name: "Nome Novo", email: "FICTICIO@example.test", role: "admin", password: "senha-nova-1" } });
    assert.equal(again.status, 201);
    assert.equal(again.data.id, id);
    assert.equal(again.data.reactivated, true);
    assert.equal(again.data.name, "Nome Novo");
    assert.equal(again.data.role, "admin");
    assert.equal(again.data.active, true);
    const oldPass = await h.client(server.base).post("/api/v1/auth/login", { json: { email: "ficticio@example.test", password: "senha-antiga" } });
    assert.equal(oldPass.status, 401);
    const newPass = await h.client(server.base).post("/api/v1/auth/login", { json: { email: "ficticio@example.test", password: "senha-nova-1" } });
    assert.equal(newPass.status, 200);
  });

  await t.test("an active email is still taken", async () => {
    const dup = await admin.post(users, { json: { name: "Outro", email: "ficticio@example.test", role: "seller", password: "123456789" } });
    assert.equal(dup.status, 409);
    assert.equal(dup.data.error.code, "EMAIL_TAKEN");
  });
});
