"use strict";

// Migration de dados do cadastro de pacotes: idempotente e sem sobrescrever o que o vendedor editou.
const test = require("node:test");
const assert = require("node:assert/strict");
const h = require("./helpers");

const skip = !h.ENABLED && "needs a test database (npm run test:integration)";

test("package catalog data migration", { skip }, async (t) => {
  const { sequelize } = require("../../src/models");
  const migration = require("../../database/migrations/20261116210100-data-package-catalog");
  const run = () => migration.up(sequelize.getQueryInterface());
  const all = async () => (await sequelize.query(`SELECT * FROM package ORDER BY number`, { type: sequelize.QueryTypes.SELECT }));
  const byFolder = async (folder) => (await all()).find((p) => p.stor_folder === folder);
  // A conexão fecha no último teste do arquivo.

  await t.test("empty database: creates every package once, even when run twice", async () => {
    await h.resetDatabase();
    await run();
    const first = await all();
    assert.equal(first.length, migration.PACKAGES.length);
    await run();
    const second = await all();
    assert.deepEqual(second.map((p) => [p.number, p.name, p.updated_at.getTime()]), first.map((p) => [p.number, p.name, p.updated_at.getTime()]));

    const pick = await byFolder("Pick-Ups");
    assert.equal(pick.status, "sold");
    assert.ok(first.filter((p) => p.stor_folder !== "Pick-Ups").every((p) => p.status === "draft"));
    const kiln = await byFolder("10-12-13 Kiln");
    assert.equal(kiln.name, "Rotary Kiln");
    assert.deepEqual(kiln.locations, ["uberaba", "at_supplier", "to_be_confirmed"]);
    assert.deepEqual(kiln.stor_numbers, [10, 12, 13]);
    const tools = await byFolder("20 Construction Materials_tools and misc");
    assert.deepEqual(tools.stor_documents_pending, ["1809564"]);
  });

  await t.test("legacy state from the local database: split refractories, fix types, keep seller edits", async () => {
    await h.resetDatabase();
    const insert = (number, name, type, locations, docs, extra = "") =>
      sequelize.query(
        `INSERT INTO package (id, number, name, type, locations, status, stor_documents, created_at, updated_at${extra ? ", stor_folder" : ""})
         VALUES (gen_random_uuid(), $1, $2, $3, $4::varchar[], 'draft', $5::varchar[], now(), now()${extra ? ", $6" : ""})`,
        { bind: extra ? [number, name, type, locations, docs, extra] : [number, name, type, locations, docs] }
      );
    await insert(1, "1-6 Refractories", "bulk", ["conceicao_do_araguaia", "uberaba"], ["1809438", "1809439"]);
    await insert(4, "10-12-13 Kiln", "equipment", ["conceicao_do_araguaia", "uberaba", "at_supplier"], []);
    await insert(19, "Módulos Escritório", "equipment", ["conceicao_do_araguaia"], ["1809779"]);
    // Pacote editado pelo vendedor: nome, locais e documentos próprios devem ficar.
    await insert(14, "My conveyors", "equipment", ["niquelandia"], ["1809000"], "29-Conveyors");

    await run();
    const cda = await byFolder("1-6 Refractories – Conceição do Araguaia");
    assert.equal(cda.number, 1);
    assert.equal(cda.name, "Refractories – Conceição do Araguaia");
    assert.deepEqual(cda.locations, ["conceicao_do_araguaia"]);
    assert.deepEqual(cda.stor_documents, ["1809438"]);
    const udp = await byFolder("1-6 Refractories – Porto Seco de Uberaba");
    assert.deepEqual(udp.stor_documents, ["1809439"]);
    assert.deepEqual(udp.locations, ["uberaba"]);

    const kiln = await byFolder("10-12-13 Kiln");
    assert.equal(kiln.number, 4);
    assert.deepEqual(kiln.locations, ["uberaba", "at_supplier", "to_be_confirmed"]);
    const modules = await byFolder("Módulos Escritório");
    assert.equal(modules.type, "bulk");
    assert.equal(modules.name, "Office Modules");

    const conveyors = await byFolder("29-Conveyors");
    assert.equal(conveyors.name, "My conveyors");
    assert.deepEqual(conveyors.locations, ["niquelandia"]);
    assert.deepEqual(conveyors.stor_documents, ["1809000", "1809615"]);
    assert.deepEqual(conveyors.stor_numbers, [29]);

    assert.equal((await all()).length, migration.PACKAGES.length);
    await run();
    assert.equal((await all()).length, migration.PACKAGES.length);
  });
});

test("steel structure document migration: links 1809537 as pending, once", { skip }, async (t) => {
  const { sequelize } = require("../../src/models");
  const catalog = require("../../database/migrations/20261116210100-data-package-catalog");
  const migration = require("../../database/migrations/20261116220000-data-steel-structure-document");
  const qi = sequelize.getQueryInterface();
  const steel = async () =>
    (await sequelize.query(`SELECT * FROM package WHERE stor_folder = '19-30-Steel Structure'`, { type: sequelize.QueryTypes.SELECT }))[0];
  t.after(() => h.cleanup());

  await h.resetDatabase();
  await migration.up(qi); // sem o pacote: não faz nada nem falha
  await catalog.up(qi);
  await migration.up(qi);
  const first = await steel();
  assert.deepEqual(first.stor_documents, ["1809537"]);
  assert.deepEqual(first.stor_documents_pending, ["1809537"]);

  await migration.up(qi);
  const second = await steel();
  assert.equal(second.updated_at.getTime(), first.updated_at.getTime());

  // Vendedor liberou o código (tirou de pendente): rodar de novo não volta a marcar.
  await sequelize.query(`UPDATE package SET stor_documents_pending = '{}' WHERE id = $1`, { bind: [first.id] });
  await migration.up(qi);
  assert.deepEqual((await steel()).stor_documents_pending, []);
});
