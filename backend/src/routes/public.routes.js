"use strict";

const { Router } = require("express");
const { pipeline } = require("node:stream/promises");
const authService = require("../services/auth.service");
const packageService = require("../services/package.service");
const accessLinkService = require("../services/access-link.service");
const fileService = require("../services/file.service");
const inquiryService = require("../services/inquiry.service");
const contactService = require("../services/contact.service");
const { SELLER_COOKIE, BUYER_COOKIE, cookieOptions, clearOptions } = require("../shared/cookies");
const { rateLimit, requireBuyer } = require("../shared/middlewares");
const env = require("../config/env");

const router = Router();

// ---------- Sessão do vendedor ----------
const loginLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 });

router.post("/auth/login", loginLimit, async (req, res) => {
  const { token, user } = await authService.login(req.body?.email, req.body?.password);
  res.cookie(SELLER_COOKIE, token, cookieOptions(env.sessionMaxAgeMs));
  res.json({ user });
});

router.post("/auth/logout", (_req, res) => {
  res.clearCookie(SELLER_COOKIE, clearOptions());
  res.status(204).end();
});

// Quem está olhando (vendedor e/ou comprador). Público: os dois nulos.
router.get("/auth/me", (req, res) => {
  const { seller, link } = req.viewer;
  res.json({
    user: seller,
    buyer: link ? { label: link.label, expiresAt: link.expiresAt, packageCount: link.packageIds.length } : null
  });
});

// ---------- Vitrine ----------
router.get("/catalog/packages", async (req, res) => {
  res.json(await packageService.listPublic(req.query));
});

router.get("/catalog/packages/:number", async (req, res) => {
  res.json(await packageService.getForViewer(req.params.number, req.viewer, req));
});

router.get("/catalog/packages/:number/lines", async (req, res) => {
  res.json(await packageService.listLinesForViewer(req.params.number, req.viewer, req.query));
});

// ---------- Contato e pedido de informação ----------
router.get("/contact", async (_req, res) => {
  res.json(await contactService.get());
});

// Formulário público: limite por IP e campo isca ("website", escondido na tela). Robô que preenche a isca recebe a
// mesma resposta de sucesso, sem gravar nada.
const inquiryLimit = rateLimit({ windowMs: 60 * 60 * 1000, max: 10 });

router.post("/catalog/packages/:number/inquiries", inquiryLimit, async (req, res) => {
  if (!req.body?.website) await inquiryService.create(req.params.number, req.body, req.viewer);
  res.status(201).json({ ok: true });
});

// ---------- Link do comprador ----------
const redeemLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 30 });

router.post("/access/redeem", redeemLimit, async (req, res) => {
  const { cookie, maxAgeMs } = await accessLinkService.redeem(req.body?.token, req);
  res.cookie(BUYER_COOKIE, cookie, cookieOptions(maxAgeMs));
  res.status(204).end();
});

router.get("/access/session", requireBuyer, async (req, res) => {
  res.json(await accessLinkService.buyerSession(req.viewer.link));
});

router.get("/access/packages", requireBuyer, async (req, res) => {
  res.json(await accessLinkService.buyerPackages(req.viewer.link, req.query));
});

router.post("/access/logout", (_req, res) => {
  res.clearCookie(BUYER_COOKIE, clearOptions());
  res.status(204).end();
});

// ---------- Arquivos ----------
router.get("/files/:id/:variant", async (req, res) => {
  const { stream, headers } = await fileService.open(req.params.id, req.params.variant, req.viewer, req);
  res.set(headers);
  try {
    await pipeline(stream, res);
  } catch (err) {
    // Cliente que fecha a conexão no meio do download não é erro do servidor.
    if (err.code !== "ERR_STREAM_PREMATURE_CLOSE") throw err;
  }
});

module.exports = router;
