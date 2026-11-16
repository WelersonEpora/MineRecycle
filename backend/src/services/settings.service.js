"use strict";

const { Setting } = require("../models");
const { SHOWCASE_ELIGIBLE_STATUSES, DEFAULT_SHOWCASE_STATUSES } = require("../domain/constants");
const { ValidationError } = require("../shared/errors");

const SHOWCASE_KEY = "showcase_statuses";

async function getShowcaseStatuses() {
  const row = await Setting.findByPk(SHOWCASE_KEY);
  const value = Array.isArray(row?.value) ? row.value.filter((s) => SHOWCASE_ELIGIBLE_STATUSES.includes(s)) : null;
  return value && value.length ? value : [...DEFAULT_SHOWCASE_STATUSES];
}

async function getAll() {
  return { showcaseStatuses: await getShowcaseStatuses(), showcaseEligibleStatuses: SHOWCASE_ELIGIBLE_STATUSES };
}

async function update({ showcaseStatuses }, userId) {
  if (
    !Array.isArray(showcaseStatuses) ||
    showcaseStatuses.length === 0 ||
    showcaseStatuses.some((s) => !SHOWCASE_ELIGIBLE_STATUSES.includes(s))
  ) {
    throw new ValidationError("Choose at least one status for the public showcase.", { field: "showcaseStatuses", code: "invalid" });
  }
  const unique = SHOWCASE_ELIGIBLE_STATUSES.filter((s) => showcaseStatuses.includes(s));
  await Setting.upsert({ key: SHOWCASE_KEY, value: unique, updatedBy: userId, updatedAt: new Date() });
  return getAll();
}

module.exports = { getShowcaseStatuses, getAll, update };
