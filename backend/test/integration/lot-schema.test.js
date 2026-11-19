"use strict";

// Esquema dos lotes (2026-11-19): as restrições do banco que protegem as regras mesmo se um serviço errar.
const test = require("node:test");
const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const h = require("./helpers");

const skip = !h.ENABLED && "needs a test database (npm run test:integration)";

test("lot schema", { skip }, async (t) => {
  const { sequelize, Package, Lot, PackageLot, LotSale, Attachment } = require("../../src/models");
  t.after(h.cleanup);
  await h.resetDatabase();

  const rejects = async (fn, pattern) => assert.rejects(fn, (err) => pattern.test(err.parent?.constraint ?? err.original?.constraint ?? err.message));
  let number = 0;
  const pkg = (over = {}) => Package.create({ number: ++number, name: `Package ${number}`, ...over });
  const lot = (lotNumber, over = {}) => Lot.create({ lotNumber, title: `Lot ${lotNumber}`, ...over });

  await t.test("the old model is gone", async () => {
    const tables = await sequelize.query(`SELECT table_name FROM information_schema.tables WHERE table_name = 'package_line'`, { type: "SELECT" });
    assert.equal(tables.length, 0);
    const cols = await sequelize.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'package' AND column_name IN ('type','locations','stor_folder','stor_numbers','stor_documents','stor_documents_pending')`,
      { type: "SELECT" }
    );
    assert.deepEqual(cols, []);
  });

  await t.test("a package needs no origin and is manual by default", async () => {
    const p = await pkg();
    assert.equal(p.originId, null);
    assert.equal((await Package.findByPk(p.id)).source, "manual");
  });

  await t.test("automatic packages: one per level and value, ignoring case", async () => {
    await pkg({ source: "family", sourceValue: "Motors" });
    await rejects(() => pkg({ source: "family", sourceValue: "motors" }), /uq_package_source_value/);
    // Mesmo valor em outro nível é outro pacote.
    await pkg({ source: "linked_system", sourceValue: "Motors" });
    await rejects(() => pkg({ source: "manual", sourceValue: "Motors" }), /ck_package_source_value/);
    await rejects(() => pkg({ source: "family", sourceValue: null }), /ck_package_source_value/);
    await rejects(() => pkg({ source: "brand", sourceValue: "x" }), /ck_package_source/);
  });

  await t.test("lot number is unique and status values are checked", async () => {
    await lot("100");
    await rejects(() => lot("100"), /uq_lot_number|lot_number/);
    await rejects(() => lot("  "), /ck_lot_number/);
    await rejects(() => lot("101", { status: "reserved" }), /ck_lot_status/);
    // Vendido pela planilha é sempre vendido.
    await rejects(() => lot("102", { soldBySheet: true, status: "available" }), /ck_lot_sold_by_sheet/);
    await lot("103", { soldBySheet: true, sheetStatus: "sold", status: "sold" });
  });

  await t.test("a lot can be in several packages; deleting a package keeps the lot", async () => {
    const motor = await lot("200");
    const kiln = await pkg({ source: "linked_system", sourceValue: "Kiln" });
    const motors = await pkg();
    await PackageLot.bulkCreate([
      { packageId: kiln.id, lotId: motor.id, position: 0 },
      { packageId: motors.id, lotId: motor.id, position: 0 }
    ]);
    await LotSale.create({ lotId: motor.id, packageId: motors.id });
    assert.equal((await motor.getPackages()).length, 2);
    await motors.destroy();
    assert.equal(await PackageLot.count({ where: { lotId: motor.id } }), 1);
    assert.equal(await LotSale.count({ where: { lotId: motor.id } }), 0);
    assert.ok(await Lot.findByPk(motor.id));
  });

  await t.test("an attachment belongs to a package or to a lot, never both or neither", async () => {
    const p = await pkg();
    const l = await lot("300");
    const file = { kind: "photo", visibility: "public", originalName: "x.jpg", mimeType: "image/jpeg", sizeBytes: 1, storageKey: `k/${randomUUID()}` };
    await Attachment.create({ ...file, packageId: p.id });
    await Attachment.create({ ...file, lotId: l.id });
    await rejects(() => Attachment.create({ ...file, packageId: p.id, lotId: l.id }), /ck_attachment_owner/);
    await rejects(() => Attachment.create({ ...file }), /ck_attachment_owner/);
  });
});
