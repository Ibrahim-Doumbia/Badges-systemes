/**
 * Point d'entrée de toutes les routes.
 * Agrège toutes les routes et les monte sous /api.
 *
 * Routes imbriquées sous /events/:eventId :
 *   /days        → jours de l'événement
 *   /categories  → catégories de participation
 *   /roles       → rôles d'équipe de l'événement (créés auto à la création)
 *   /team        → membres assignés à l'équipe avec leur rôle
 */

const express = require("express");
const router = express.Router();

const authRoutes        = require("./auth.routes");
const userRoutes        = require("./user.routes");
const eventTypeRoutes   = require("./event_type.routes");
const eventRoutes       = require("./event.routes");
const eventDayRoutes    = require("./event_day.routes");
const eventRoleRoutes   = require("./event_role.routes");
const categoryRoutes    = require("./category.routes");
const participantRoutes = require("./participant.routes");
const inscriptionRoutes = require("./inscription.routes");
const badgeRoutes       = require("./badge.routes");
const userEventRoutes   = require("./user_event.routes");
const publicRoutes      = require("./public.routes");

// ─── Routes publiques (sans authentification) ────────────────────────────────
router.use("/public",       publicRoutes);

// ─── Routes principales ───────────────────────────────────────────────────────
router.use("/auth",         authRoutes);
router.use("/users",        userRoutes);
router.use("/event-types",  eventTypeRoutes);
router.use("/events",       eventRoutes);
router.use("/participants", participantRoutes);
router.use("/inscriptions", inscriptionRoutes);
router.use("/badges",       badgeRoutes);

// ─── Routes imbriquées sous /events/:eventId ──────────────────────────────────
router.use("/events/:eventId/days",       eventDayRoutes);
router.use("/events/:eventId/categories", categoryRoutes);
router.use("/events/:eventId/roles",      eventRoleRoutes);
router.use("/events/:eventId/team",       userEventRoutes);

module.exports = router;
