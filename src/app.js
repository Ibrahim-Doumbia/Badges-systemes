/**
 * Configuration principale de l'application Express.
 * Ce fichier configure les middlewares globaux et monte les routes.
 * Il ne démarre PAS le serveur (c'est le rôle de server.js).
 */

const express = require("express");
const cors = require("cors");
const routes = require("./routes");
const { error } = require("./utils/response.util");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");

const app = express();

// ─── Middlewares globaux ──────────────────────────────────────────────────────

// CORS : autorise les requêtes cross-origin (à restreindre en production)
app.use(cors({
  origin: process.env.CORS_ORIGIN || "*",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// Parse les corps JSON et URL-encoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use("/api", routes);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
// Route de santé (health check) — accessible sans auth
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});

// ─── Gestion des routes inexistantes ─────────────────────────────────────────
app.use((req, res) => {
  return error(res, `Route ${req.method} ${req.originalUrl} introuvable`, 404);
});

// ─── Gestionnaire d'erreurs global ───────────────────────────────────────────
// Capture les erreurs non gérées lancées par les middlewares/controllers
app.use((err, req, res, next) => {
  console.error("Erreur non gérée:", err);
  return error(res, "Erreur interne du serveur", 500);
});

module.exports = app;
