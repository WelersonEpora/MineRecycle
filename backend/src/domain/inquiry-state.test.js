"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { nextInquiryState } = require("./inquiry-state");

const fresh = { status: "new", assignedTo: null, outcome: null };

test("taking a new request moves it to in progress", () => {
  assert.deepEqual(nextInquiryState(fresh, { assignedTo: "u1" }), { status: "in_progress", assignedTo: "u1", outcome: null });
  // Situação junto: vale a situação enviada.
  assert.deepEqual(nextInquiryState(fresh, { assignedTo: "u1", status: "discarded" }), { status: "discarded", assignedTo: "u1", outcome: null });
  // Já em atendimento ou concluído: trocar o responsável não mexe na situação.
  const done = { status: "done", assignedTo: "u1", outcome: "sold" };
  assert.deepEqual(nextInquiryState(done, { assignedTo: "u2" }), { ...done, assignedTo: "u2" });
});

test("an outcome closes the request", () => {
  const open = { status: "in_progress", assignedTo: "u1", outcome: null };
  assert.deepEqual(nextInquiryState(open, { outcome: "not_pursued" }), { status: "done", assignedTo: "u1", outcome: "not_pursued" });
  assert.deepEqual(nextInquiryState(open, { status: "done", outcome: "sold" }), { status: "done", assignedTo: "u1", outcome: "sold" });
});

test("leaving done clears the outcome; clearing the outcome keeps done", () => {
  const done = { status: "done", assignedTo: "u1", outcome: "sold" };
  assert.equal(nextInquiryState(done, { status: "in_progress" }).outcome, null);
  assert.equal(nextInquiryState(done, { status: "in_progress", outcome: "sold" }).outcome, null);
  assert.deepEqual(nextInquiryState(done, { outcome: null }), { status: "done", assignedTo: "u1", outcome: null });
  assert.deepEqual(nextInquiryState(done, { note: "x" }), done);
});
