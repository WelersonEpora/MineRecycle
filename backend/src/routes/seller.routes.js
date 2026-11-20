"use strict";

const { Router } = require("express");
const multer = require("multer");
const env = require("../config/env");
const { requireSeller, requireAdmin } = require("../shared/middlewares");
const packageService = require("../services/package.service");
const lotService = require("../services/lot.service");
const lotImportService = require("../services/lot-import.service");
const attachmentService = require("../services/attachment.service");
const accessLinkService = require("../services/access-link.service");
const originService = require("../services/origin.service");
const inquiryService = require("../services/inquiry.service");
const contactService = require("../services/contact.service");
const userService = require("../services/user.service");
const authService = require("../services/auth.service");

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: env.uploadMaxBytes, files: 30 } });

router.use(requireSeller);
const userId = (req) => req.viewer.seller.id;

// ---------- Lotes (decisão de 2026-11-19) ----------
// "/lots/ids", "/lots/facets" e "/lots/export" vêm antes de "/lots/:id" para não serem lidos como id.
router.get("/lots", async (req, res) => res.json(await lotService.list(req.query)));
router.get("/lots/ids", async (req, res) => res.json(await lotService.listIds(req.query)));
router.get("/lots/facets", async (_req, res) => res.json(await lotService.facets()));
// Planilha de todos os lotes, no formato da importação. Nome do arquivo só com a data.
router.get("/lots/export", async (req, res) => {
  const { buffer, fileName } = await lotService.exportWorkbook(req.query.lang);
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="${fileName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`);
  res.setHeader("Cache-Control", "private, no-store");
  res.send(buffer);
});
router.get("/lots/:id", async (req, res) => res.json(await lotService.get(req.params.id)));
router.patch("/lots/:id", async (req, res) => res.json(await lotService.update(req.params.id, req.body || {}, userId(req))));
// Pacote de um lote só, com o nome do lote.
router.post("/lots/:id/package", async (req, res) => res.status(201).json(await packageService.createFromLot(req.params.id, userId(req))));
router.get("/lots/:id/attachments", async (req, res) => res.json(await attachmentService.list({ lotId: req.params.id })));
router.post("/lots/:id/attachments", upload.array("files", 30), async (req, res) =>
  res.status(201).json(await attachmentService.upload({ lotId: req.params.id }, req.files, req.body || {}, userId(req)))
);

// ---------- Importação de lotes ----------
router.post("/lot-imports", upload.single("file"), async (req, res) => res.status(201).json(await lotImportService.start(req.file)));
router.post("/lot-imports/:importId/preview", async (req, res) => res.json(await lotImportService.preview(req.params.importId, req.body || {})));
router.post("/lot-imports/:importId/commit", async (req, res) =>
  res.json(await lotImportService.commit(req.params.importId, req.body || {}, userId(req)))
);
router.delete("/lot-imports/:importId", async (req, res) => {
  await lotImportService.cancel(req.params.importId);
  res.status(204).end();
});

// ---------- Pacotes ----------
router.get("/packages", async (req, res) => res.json(await packageService.listForSeller(req.query)));
router.post("/packages", async (req, res) => res.status(201).json(await packageService.create(req.body || {}, userId(req))));
router.get("/packages/:id", async (req, res) => res.json(await packageService.getForSeller(req.params.id)));
router.patch("/packages/:id", async (req, res) => res.json(await packageService.update(req.params.id, req.body || {}, userId(req))));
// Situação. Para "vendido": { status, confirm } (confirm quando há lotes já vendidos em outro lugar).
router.put("/packages/:id/status", async (req, res) => res.json(await packageService.setStatus(req.params.id, req.body || {}, userId(req))));
router.delete("/packages/:id", async (req, res) => {
  await packageService.remove(req.params.id);
  res.status(204).end();
});
// Lotes do pacote (só pacote manual muda de lotes).
router.get("/packages/:id/lots", async (req, res) => res.json(await packageService.listLotsForSeller(req.params.id, req.query)));
router.post("/packages/:id/lots", async (req, res) => res.json(await packageService.addLots(req.params.id, req.body || {})));
router.post("/packages/:id/lots/remove", async (req, res) => res.json(await packageService.removeLots(req.params.id, req.body || {})));
router.put("/packages/:id/lots/order", async (req, res) => res.json(await packageService.reorderLots(req.params.id, req.body || {})));

// ---------- Anexos ----------
router.get("/packages/:id/attachments", async (req, res) => res.json(await attachmentService.list({ packageId: req.params.id })));
router.post("/packages/:id/attachments", upload.array("files", 30), async (req, res) =>
  res.status(201).json(await attachmentService.upload({ packageId: req.params.id }, req.files, req.body || {}, userId(req)))
);
router.patch("/attachments/:attachmentId", async (req, res) =>
  res.json(await attachmentService.update(req.params.attachmentId, req.body || {}))
);
router.delete("/attachments/:attachmentId", async (req, res) => {
  await attachmentService.remove(req.params.attachmentId);
  res.status(204).end();
});

// ---------- Links do comprador ----------
router.get("/access-links", async (req, res) => res.json(await accessLinkService.list(req.query)));
router.post("/access-links", async (req, res) => res.status(201).json(await accessLinkService.create(req.body || {}, userId(req))));
router.get("/access-links/:linkId", async (req, res) => res.json(await accessLinkService.get(req.params.linkId)));
router.patch("/access-links/:linkId", async (req, res) => res.json(await accessLinkService.update(req.params.linkId, req.body || {})));
router.post("/access-links/:linkId/revoke", async (req, res) => res.json(await accessLinkService.revoke(req.params.linkId)));
router.get("/access-links/:linkId/logs", async (req, res) => res.json(await accessLinkService.logs(req.params.linkId)));

// ---------- Pedidos de informação (toda a equipe atende) ----------
router.get("/inquiries", async (req, res) => res.json(await inquiryService.list(req.query, userId(req))));
router.post("/inquiries", async (req, res) => res.status(201).json(await inquiryService.createBySeller(req.body || {}, userId(req))));
router.get("/inquiries/counts", async (_req, res) => res.json(await inquiryService.counts()));
router.patch("/inquiries/:inquiryId", async (req, res) =>
  res.json(await inquiryService.update(req.params.inquiryId, req.body || {}, userId(req)))
);
router.delete("/inquiries/:inquiryId", async (req, res) => {
  await inquiryService.remove(req.params.inquiryId);
  res.status(204).end();
});

// ---------- Conta ----------
router.put("/me/password", async (req, res) => {
  await authService.changeOwnPassword(userId(req), req.body?.currentPassword, req.body?.newPassword);
  res.status(204).end();
});

// ---------- Administração ----------
// Contato comercial: todos leem (rota pública); só admin altera.
router.put("/contact", requireAdmin, async (req, res) => res.json(await contactService.set(req.body || {}, userId(req))));
// Origens: todos os vendedores leem (cadastro de pacote); só admin inclui e edita.
router.get("/origins", async (_req, res) => res.json(await originService.list()));
router.post("/origins", requireAdmin, async (req, res) => res.status(201).json(await originService.create(req.body || {})));
router.patch("/origins/:originId", requireAdmin, async (req, res) => res.json(await originService.update(req.params.originId, req.body || {})));
router.get("/users", requireAdmin, async (_req, res) => res.json(await userService.list()));
router.post("/users", requireAdmin, async (req, res) => res.status(201).json(await userService.create(req.body || {})));
router.patch("/users/:userId", requireAdmin, async (req, res) =>
  res.json(await userService.update(req.params.userId, req.body || {}, userId(req)))
);
router.delete("/users/:userId", requireAdmin, async (req, res) => {
  await userService.remove(req.params.userId, userId(req));
  res.status(204).end();
});

module.exports = router;
