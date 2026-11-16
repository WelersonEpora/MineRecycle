"use strict";

const { User, AccessLink } = require("../models");
const { verifySession } = require("../shared/tokens");
const { SELLER_COOKIE, BUYER_COOKIE } = require("../shared/cookies");
const { linkState } = require("../domain/access-policy");

// O cookie só diz QUEM é. Se o vendedor está ativo e se o link ainda vale vem sempre do banco, a cada requisição:
// desativar um vendedor ou revogar um link tem efeito imediato.
async function resolve(cookies) {
  const viewer = { seller: null, link: null };

  const sellerToken = cookies[SELLER_COOKIE];
  if (sellerToken) {
    let payload = null;
    try {
      payload = verifySession(sellerToken, "seller");
    } catch (_err) {
      payload = null;
    }
    if (payload) {
      const user = await User.findByPk(payload.sub);
      if (user && user.active) viewer.seller = { id: user.id, role: user.role, name: user.name, email: user.email };
    }
  }

  const buyerToken = cookies[BUYER_COOKIE];
  if (buyerToken) {
    let payload = null;
    try {
      payload = verifySession(buyerToken, "buyer");
    } catch (_err) {
      payload = null;
    }
    if (payload) {
      const link = await AccessLink.findByPk(payload.sub, {
        include: [{ association: "packages", attributes: ["id"], through: { attributes: [] } }]
      });
      if (link && linkState(link) === "valid") {
        viewer.link = {
          id: link.id,
          label: link.label,
          expiresAt: link.expiresAt,
          revokedAt: link.revokedAt,
          packageIds: link.packages.map((p) => p.id)
        };
      }
    }
  }

  return viewer;
}

module.exports = { resolve };
