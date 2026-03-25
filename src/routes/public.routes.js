/**
 * Routes publiques — aucune authentification requise.
 * Utilisées par les participants pour s'inscrire via le lien QR code.
 */

const express = require("express");
const router = express.Router();
const PublicController = require("../controllers/public.controller");

/**
 * GET /api/public/events/:id
 * Retourne les infos de l'événement, les catégories disponibles et le QR code du lien d'inscription.
 */
router.get("/events/:id", PublicController.getEventInfo);

/**
 * POST /api/public/events/:id/register
 * Inscription publique d'un participant à un événement.
 * Body : { nom, prenom, email, telephone?, fonction?, organisation?, localite?, category_id }
 */
router.post("/events/:id/register", PublicController.register);

module.exports = router;
