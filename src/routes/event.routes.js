/**
 * Routes événements.
 * La création/modification/suppression est réservée aux admins.
 * La lecture est accessible à tous les utilisateurs authentifiés.
 */

const express = require("express");
const router = express.Router();
const EventController = require("../controllers/event.controller");
const { authenticate, mustChangePwd, requireRole } = require("../middlewares/auth.middleware");

router.use(authenticate, mustChangePwd);

/**
 * @swagger
 * tags:
 *   name: Événements
 *   description: Gestion des événements
 */

/**
 * @swagger
 * /events:
 *   post:
 *     summary: Créer un événement
 *     description: Crée un nouvel événement. Le créateur est automatiquement extrait du token JWT.
 *     tags: [Événements]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateEventRequest'
 *     responses:
 *       201:
 *         description: Événement créé
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Event'
 *       400:
 *         description: Données invalides (ex. end_date avant start_date)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé — rôle admin requis
 */
router.post("/", requireRole("admin"), EventController.create);

/**
 * @swagger
 * /events:
 *   get:
 *     summary: Lister les événements
 *     tags: [Événements]
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
 *         description: Recherche sur le titre ou la description
 *       - in: query
 *         name: event_type_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filtrer par type d'événement
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filtrer par statut actif/inactif
 *     responses:
 *       200:
 *         description: Liste des événements
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
 *                         $ref: '#/components/schemas/Event'
 *       401:
 *         description: Non authentifié
 */
router.get("/", EventController.getAll);

/**
 * @swagger
 * /events/{id}:
 *   get:
 *     summary: Récupérer un événement
 *     tags: [Événements]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Événement récupéré
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Event'
 *       404:
 *         description: Événement introuvable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Non authentifié
 */
router.get("/:id", EventController.getOne);

/**
 * @swagger
 * /events/{id}:
 *   put:
 *     summary: Modifier un événement
 *     tags: [Événements]
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
 *             $ref: '#/components/schemas/CreateEventRequest'
 *     responses:
 *       200:
 *         description: Événement mis à jour
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Event'
 *       400:
 *         description: Données invalides
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé — rôle admin requis
 *       404:
 *         description: Événement introuvable
 */
router.put("/:id", requireRole("admin"), EventController.update);

/**
 * @swagger
 * /events/{id}:
 *   delete:
 *     summary: Supprimer un événement
 *     description: Supprime l'événement et toutes ses données associées (jours, rôles, inscriptions, badges…).
 *     tags: [Événements]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Événement supprimé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé — rôle admin requis
 *       404:
 *         description: Événement introuvable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete("/:id", requireRole("admin"), EventController.delete);

module.exports = router;
