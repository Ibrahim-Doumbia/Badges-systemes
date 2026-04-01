/**
 * Routes publiques — aucune authentification requise.
 * Utilisées par les participants pour s'inscrire via le lien ou le QR code.
 */

const express = require("express");
const router = express.Router();
const PublicController = require("../controllers/public.controller");

/**
 * @swagger
 * tags:
 *   name: Public
 *   description: Endpoints accessibles sans authentification (inscription participants)
 */

/**
 * @swagger
 * /public/events:
 *   get:
 *     summary: Lister les événements en cours et à venir
 *     description: Retourne tous les événements actifs dont la date de fin est supérieure ou égale à aujourd'hui. Accessible sans authentification.
 *     tags: [Public]
 *     responses:
 *       200:
 *         description: Liste des événements
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Event'
 */
router.get("/events", PublicController.getEvents);

/**
 * @swagger
 * /public/register/{token}:
 *   get:
 *     summary: Récupérer le formulaire d'inscription d'un événement
 *     description: |
 *       Accessible via le lien partagé par l'organisateur.
 *       Retourne les infos de l'événement, les catégories et les champs du formulaire à remplir.
 *     tags: [Public]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Token unique de l'événement (registration_token)
 *     responses:
 *       200:
 *         description: Formulaire récupéré
 *       404:
 *         description: Lien invalide ou événement inactif
 */
router.get("/register/:token", PublicController.getRegistrationForm);

/**
 * @swagger
 * /public/register/{token}:
 *   post:
 *     summary: S'inscrire à un événement (auto-inscription participant)
 *     description: |
 *       Le participant remplit ses informations personnelles et s'inscrit directement.
 *       Le champ `email` est obligatoire. Si le participant existe déjà (même email), ses données sont réutilisées.
 *     tags: [Public]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PublicRegisterRequest'
 *     responses:
 *       201:
 *         description: Inscription enregistrée
 *       400:
 *         description: Champs requis manquants ou déjà inscrit
 *       404:
 *         description: Lien invalide
 */
router.post("/register/:token", PublicController.register);

/**
 * @swagger
 * /public/events/{eventId}/qr:
 *   get:
 *     summary: QR code d'inscription à un événement
 *     description: |
 *       Retourne le QR code à afficher le jour J.
 *       Les participants scannent ce QR code pour accéder directement au formulaire d'inscription.
 *     tags: [Public]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: QR code généré
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         registration_url:
 *                           type: string
 *                         qr_code:
 *                           type: string
 *                           description: Data URL base64 du QR code
 *       404:
 *         description: Événement introuvable
 */
router.get("/events/:eventId/qr", PublicController.getEventQr);

module.exports = router;
