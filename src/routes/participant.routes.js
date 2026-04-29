const express = require("express");
const router = express.Router();
const ParticipantController = require("../controllers/participant.controller");
const { authenticate, mustChangePwd, requireRole } = require("../middlewares/auth.middleware");

router.use(mustChangePwd);

/**
 * @swagger
 * tags:
 *   name: Participants
 *   description: Gestion des participants aux événements
 */

/**
 * @swagger
 * /participants:
 *   post:
 *     summary: Créer un participant et l'inscrire à un événement
 *     tags: [Participants]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/CreateParticipantRequest'
 *               - type: object
 *                 required:
 *                   - event_id
 *                   - category_id
 *                 properties:
 *                   event_id:
 *                     type: string
 *                     format: uuid
 *                     description: Identifiant de l'événement actif auquel inscrire le participant
 *                   category_id:
 *                     type: string
 *                     format: uuid
 *                     description: Identifiant de la catégorie (doit appartenir à l'événement)
 *     responses:
 *       201:
 *         description: Participant créé et inscrit à l'événement
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Participant'
 *       400:
 *         description: Données invalides, événement inactif ou participant déjà inscrit
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé — l'événement ne vous appartient pas
 */
router.post("/", requireRole("organisateur"), ParticipantController.create);

/**
 * @swagger
 * /participants:
 *   get:
 *     summary: Lister les participants
 *     tags: [Participants]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Recherche sur le nom, prénom, email ou organisation
 *       - in: query
 *         name: event_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filtrer les participants inscrits à un événement précis (obligatoire pour un organisateur)
 *     responses:
 *       200:
 *         description: Liste des participants
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/PaginatedResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Participant'
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé — l'événement ne vous appartient pas
 */
router.get("/", authenticate, ParticipantController.getAll);

/**
 * @swagger
 * /participants/{id}:
 *   get:
 *     summary: Récupérer un participant
 *     tags: [Participants]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Participant récupéré
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Participant'
 *       404:
 *         description: Participant introuvable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Non authentifié
 */
router.get("/:id", authenticate, ParticipantController.getOne);

/**
 * @swagger
 * /participants/{id}:
 *   put:
 *     summary: Modifier un participant
 *     tags: [Participants]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateParticipantRequest'
 *     responses:
 *       200:
 *         description: Participant mis à jour
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Participant'
 *       400:
 *         description: Données invalides
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé — rôle admin ou staff requis
 *       404:
 *         description: Participant introuvable
 */
router.put("/:id", requireRole(["organisateur", "staff"]), ParticipantController.update);

/**
 * @swagger
 * /participants/{id}:
 *   delete:
 *     summary: Supprimer un participant
 *     tags: [Participants]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Participant supprimé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé — rôle admin requis
 *       404:
 *         description: Participant introuvable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete("/:id", requireRole("organisateur"), authenticate, ParticipantController.delete);

module.exports = router;
