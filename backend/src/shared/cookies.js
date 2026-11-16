"use strict";

const env = require("../config/env");

const SELLER_COOKIE = "mr_session";
const BUYER_COOKIE = "mr_buyer";

// SameSite=Lax e API só JSON, sem CORS: o mesmo critério anti-CSRF do FinMind.
function cookieOptions(maxAgeMs) {
  return { httpOnly: true, secure: env.cookieSecure, sameSite: "lax", path: "/", maxAge: maxAgeMs };
}

function clearOptions() {
  return { httpOnly: true, secure: env.cookieSecure, sameSite: "lax", path: "/" };
}

module.exports = { SELLER_COOKIE, BUYER_COOKIE, cookieOptions, clearOptions };
