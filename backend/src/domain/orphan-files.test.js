"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { findOrphans, usedKeysOf } = require("./orphan-files");

const now = new Date("2026-11-19T12:00:00Z");
const ago = (minutes) => new Date(now - minutes * 60 * 1000);
const file = (key, minutes, size = 10) => ({ key, size, modifiedAt: ago(minutes) });

test("files used by an attachment are kept, the rest is orphan", () => {
  const used = usedKeysOf([
    { storageKey: "packages/p1/a1/original.jpg", webKey: "packages/p1/a1/web.webp", thumbKey: "packages/p1/a1/thumb.webp" },
    { storageKey: "lots/l1/a2/original.pdf", webKey: null, thumbKey: null }
  ]);
  const r = findOrphans(
    [
      file("packages/p1/a1/original.jpg", 600),
      file("packages/p1/a1/web.webp", 600),
      file("packages/p1/a1/thumb.webp", 600),
      file("lots/l1/a2/original.pdf", 600),
      file("packages/old/a9/original.pdf", 600, 100),
      file("packages/old/a9/web.webp", 600, 50),
      file("lots/gone/a3/original.pdf", 600, 7)
    ],
    used,
    { now }
  );
  assert.equal(r.kept, 4);
  assert.deepEqual(r.orphans.map((f) => f.key), ["packages/old/a9/original.pdf", "packages/old/a9/web.webp", "lots/gone/a3/original.pdf"]);
  assert.equal(r.bytes, 157);
  assert.deepEqual(r.byPrefix, { packages: { files: 2, bytes: 150 }, lots: { files: 1, bytes: 7 } });
});

test("recent files are never orphans: an upload writes the file before the record", () => {
  const r = findOrphans([file("packages/p1/a1/original.jpg", 5), file("packages/p1/a1/x.tmp", 59)], new Set(), { now });
  assert.equal(r.orphans.length, 0);
  assert.equal(r.recent, 2);
});

test("pending imports are kept for a day", () => {
  const r = findOrphans([file("imports/i1.xlsx", 120), file("imports/i2.xlsx", 25 * 60)], new Set(), { now });
  assert.deepEqual(r.orphans.map((f) => f.key), ["imports/i2.xlsx"]);
  assert.equal(r.recent, 1);
});
