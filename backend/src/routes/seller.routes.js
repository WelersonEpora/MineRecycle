"use strict";

const { Router } = require("express");
const multer = require("multer");
const env = require("../config/env");
const { requireSeller, requireAdmin } = require("../shared/middlewares");
const packageService = require("../services/package.service");
const lineService = require("../services/line.service");
const attachmentService = require("../services/attachment.service");
const importService = require("../services/import.service");
const exportService = require("../services/export.service");
const packageImportService = require("../services/package-import.service");
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

// ---------- Pacotes ----------
router.get("/packages", async (req, res) => res.json(await packageService.listForSeller(req.query)));
router.post("/packages", async (req, res) => res.status(201).json(await packageService.create(req.body || {}, userId(req))));
// Planilha (.xlsx). "/packages/export" vem antes de "/packages/:id" para "export" não ser lido como id.
const sendSheet = (res, { buffer, fileName }) => {
  res.attachment(fileName);
  res.type("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.set("Cache-Control", "no-store");
  res.send(buffer);
};
router.get("/packages/export", async (req, res) => sendSheet(res, await exportService.exportList(req.query)));
router.get("/packages/:id/export", async (req, res) => sendSheet(res, await exportService.exportOne(req.params.id, req.query)));
// Importação de pacotes pela planilha do sistema (packageId no corpo = "Importar pacote", só o pacote aberto).
router.post("/package-imports", upload.single("file"), async (req, res) =>
  res.status(201).json(await packageImportService.start(req.file, req.body || {}))
);
router.post("/package-imports/:importId/commit", async (req, res) =>
  res.json(await packageImportService.commit(req.params.importId, req.body || {}, userId(req)))
);
router.delete("/package-imports/:importId", async (req, res) => {
  await packageImportService.cancel(req.params.importId);
  res.status(204).end();
});
router.get("/packages/:id", async (req, res) => res.json(await packageService.getForSeller(req.params.id)));
router.patch("/packages/:id", async (req, res) => res.json(await packageService.update(req.params.id, req.body || {}, userId(req))));
router.put("/packages/:id/status", async (req, res) =>
  res.json(await packageService.setStatus(req.params.id, req.body?.status, userId(req)))
);
router.delete("/packages/:id", async (req, res) => {
  await packageService.remove(req.params.id);
  res.status(204).end();
});

// ---------- Linhas ----------
router.get("/packages/:id/lines", async (req, res) => res.json(await lineService.listLines(req.params.id, req.query)));
router.post("/packages/:id/lines", async (req, res) => res.status(201).json(await lineService.create(req.params.id, req.body || {})));
router.patch("/lines/:lineId", async (req, res) => res.json(await lineService.update(req.params.lineId, req.body || {})));
router.delete("/lines/:lineId", async (req, res) => {
  await lineService.remove(req.params.lineId);
  res.status(204).end();
});

// ---------- Importação de planilha ----------
router.post("/packages/:id/imports", upload.single("file"), async (req, res) =>
  res.status(201).json(await importService.start(req.params.id, req.file))
);
router.post("/packages/:id/imports/:importId/layout", async (req, res) =>
  res.json(await importService.describeExisting(req.params.importId, req.body || {}))
);
router.post("/packages/:id/imports/:importId/preview", async (req, res) =>
  res.json(await importService.preview(req.params.id, req.params.importId, req.body || {}))
);
router.post("/packages/:id/imports/:importId/commit", async (req, res) =>
  res.json(await importService.commit(req.params.id, req.params.importId, req.body || {}, userId(req)))
);
router.delete("/packages/:id/imports/:importId", async (req, res) => {
  await importService.cancel(req.params.importId);
  res.status(204).end();
});

// ---------- Anexos ----------
router.get("/packages/:id/attachments", async (req, res) => res.json(await attachmentService.list(req.params.id)));
router.post("/packages/:id/attachments", upload.array("files", 30), async (req, res) =>
  res.status(201).json(await attachmentService.upload(req.params.id, req.files, req.body || {}, userId(req)))
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
