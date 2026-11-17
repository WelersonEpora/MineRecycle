"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { linkState, packageAccess, canReadAttachment, attachmentVisibleTo, effectiveVisibility } = require("./access-policy");

const NOW = new Date("2026-11-16T12:00:00Z");
const FUTURE = new Date("2026-12-16T12:00:00Z");
const PAST = new Date("2026-11-01T12:00:00Z");

const pkg = (status, id = "p1") => ({ id, status });
const link = (over = {}) => ({ id: "l1", expiresAt: FUTURE, revokedAt: null, packageIds: ["p1"], ...over });
const att = (over = {}) => ({ id: "a1", packageId: "p1", kind: "photo", visibility: "public", ...over });
const anon = { seller: null, link: null };
const buyer = (over) => ({ seller: null, link: link(over) });
const seller = { seller: { id: "u1", role: "seller" }, link: null };

test("link state", () => {
  assert.equal(linkState(link(), NOW), "valid");
  assert.equal(linkState(link({ expiresAt: PAST }), NOW), "expired");
  assert.equal(linkState(link({ revokedAt: PAST }), NOW), "revoked");
  assert.equal(linkState(null, NOW), "invalid");
});

test("public sees active and under-negotiation packages only (fixed rule)", () => {
  assert.equal(packageAccess(pkg("active"), anon, NOW), "public");
  assert.equal(packageAccess(pkg("under_negotiation"), anon, NOW), "public");
  assert.equal(packageAccess(pkg("sold"), anon, NOW), null);
  assert.equal(packageAccess(pkg("draft"), anon, NOW), null);
  assert.equal(packageAccess(pkg("inactive"), anon, NOW), null);
});

test("seller sees everything", () => {
  assert.equal(packageAccess(pkg("draft"), seller, NOW), "seller");
});

test("buyer sees packages in scope, including sold ones", () => {
  assert.equal(packageAccess(pkg("under_negotiation"), buyer(), NOW), "buyer");
  assert.equal(packageAccess(pkg("active"), buyer(), NOW), "buyer");
  // Vendido continua visível pelo link (pode ser do próprio comprador; decisão de 2026-11-17).
  assert.equal(packageAccess(pkg("sold"), buyer(), NOW), "buyer");
});

test("buyer does not see drafts, inactive or out-of-scope packages", () => {
  assert.equal(packageAccess(pkg("draft"), buyer(), NOW), null);
  assert.equal(packageAccess(pkg("inactive"), buyer(), NOW), null);
  assert.equal(packageAccess(pkg("sold", "p2"), buyer(), NOW), null);
  // Fora do escopo mas público: acesso público, não de comprador.
  assert.equal(packageAccess(pkg("active", "p2"), buyer(), NOW), "public");
});

test("expired or revoked link gives no buyer access", () => {
  assert.equal(packageAccess(pkg("sold"), buyer({ expiresAt: PAST }), NOW), null);
  assert.equal(packageAccess(pkg("active"), buyer({ revokedAt: PAST }), NOW), "public");
});

test("restricted attachments: never public, always for buyer in scope and seller", () => {
  const restricted = att({ kind: "datasheet", visibility: "restricted" });
  const args = (viewer, attachment = restricted, p = pkg("active")) => ({
    attachment,
    pkg: p,
    viewer,
    now: NOW
  });
  assert.equal(canReadAttachment(args(anon)), false);
  assert.equal(canReadAttachment(args(buyer())), true);
  assert.equal(canReadAttachment(args(seller)), true);
  assert.equal(canReadAttachment(args(buyer({ expiresAt: PAST }))), false);
  assert.equal(canReadAttachment(args(buyer({ packageIds: ["p2"] }))), false);
});

test("internal attachments: seller only, never buyer or public", () => {
  const internal = att({ kind: "list", visibility: "internal" });
  const args = (viewer) => ({ attachment: internal, pkg: pkg("active"), viewer, now: NOW });
  assert.equal(canReadAttachment(args(anon)), false);
  assert.equal(canReadAttachment(args(buyer())), false);
  assert.equal(canReadAttachment(args(seller)), true);
  assert.equal(attachmentVisibleTo(internal, "buyer"), false);
  assert.equal(attachmentVisibleTo(internal, "public"), false);
  assert.equal(attachmentVisibleTo(internal, "seller"), true);
  assert.equal(effectiveVisibility("list", "internal"), "internal");
  assert.equal(effectiveVisibility("proposal", "internal"), "internal");
});

test("proposal is restricted even if stored as public", () => {
  const proposal = att({ kind: "proposal", visibility: "public" });
  assert.equal(canReadAttachment({ attachment: proposal, pkg: pkg("active"), viewer: anon, now: NOW }), false);
  assert.equal(effectiveVisibility("proposal", "public"), "restricted");
  assert.equal(effectiveVisibility("photo", "public"), "public");
});

test("public photo: resized versions only, never the original", () => {
  const photo = att();
  const read = (variant) =>
    canReadAttachment({ attachment: photo, pkg: pkg("active"), viewer: anon, variant, now: NOW });
  assert.equal(read("thumb"), true);
  assert.equal(read("web"), true);
  assert.equal(read("original"), false);
});

test("public attachment of a package outside the showcase is hidden", () => {
  assert.equal(canReadAttachment({ attachment: att(), pkg: pkg("draft"), viewer: anon, variant: "thumb", now: NOW }), false);
});

test("attachment must belong to the package", () => {
  assert.equal(
    canReadAttachment({ attachment: att({ packageId: "p9" }), pkg: pkg("active"), viewer: seller, now: NOW }),
    false
  );
});
