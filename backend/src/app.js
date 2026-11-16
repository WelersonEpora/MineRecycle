"use strict";

const express = require("express");
const cookieParser = require("cookie-parser");
const { sequelize } = require("./models");
const publicRoutes = require("./routes/public.routes");
const sellerRoutes = require("./routes/seller.routes");
const { requestLogger, resolveViewer, notFound, errorHandler } = require("./shared/middlewares");

const app = express();

app.disable("x-powered-by");
// Atrás do Nginx Proxy Manager e do nginx do frontend (redes privadas do Docker): o IP real vem do X-Forwarded-For.
app.set("trust proxy", "loopback, linklocal, uniquelocal");

app.use(requestLogger);
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

app.get("/health", async (_req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ status: "ok", commit: process.env.GIT_COMMIT || "local" });
  } catch (_err) {
    res.status(503).json({ status: "database_unavailable" });
  }
});

app.use("/api/v1", resolveViewer);
app.use("/api/v1/seller", sellerRoutes);
app.use("/api/v1", publicRoutes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;
