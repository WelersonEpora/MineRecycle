"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const os = require("node:os");
const path = require("node:path");
const fs = require("node:fs/promises");
const { createLocalDriver, assertKey } = require("./local-driver");

test("rejects keys that could escape the storage directory", () => {
  for (const bad of ["../x", "a/../../x", "/etc/passwd", "a\\b", "", "C:/x", "a//b", ".hidden"]) {
    assert.throws(() => assertKey(bad), /Invalid storage key/, bad);
  }
  assert.doesNotThrow(() => assertKey("packages/1f/2a/original.pdf"));
});

test("put, open, get and remove", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "mr-storage-"));
  const storage = createLocalDriver(dir);
  await storage.put("packages/p1/a1/original.txt", Buffer.from("hello"));
  assert.equal((await storage.get("packages/p1/a1/original.txt")).toString(), "hello");
  const opened = await storage.open("packages/p1/a1/original.txt");
  assert.equal(opened.size, 5);
  opened.stream.destroy();
  assert.equal(await storage.open("packages/p1/a1/missing.txt"), null);
  await storage.removePrefix("packages/p1");
  assert.equal(await storage.open("packages/p1/a1/original.txt"), null);
  await storage.remove("packages/p1/a1/original.txt");
  await fs.rm(dir, { recursive: true, force: true });
});
