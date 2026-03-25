/**
 * Routes des rôles d'événement.
 * Toutes imbriquées sous /api/events/:eventId/roles
 *
 * - Lecture : admin et staff
 * - Écriture (create/update/delete) : admin uniquement
 */

const express = require("express");
const router = express.Router({ mergeParams: true }); // accès à req.params.eventId
const EventRoleController = require("../controllers/event_role.controller");
const { authenticate, mustChangePwd, requireRole, requireAdminOrEventOwner } = require("../middlewares/auth.middleware");

router.use(authenticate, mustChangePwd);

/**
 * @swagger
 * tags:
 *   name: Rôles d'événement
 *   description: Rôles personnalisés de l'équipe d'un événement (Coordinateur, Accueil, Sécurité…)
 */

/**
 * @swagger
 * /events/{eventId}/roles:
 *   post:
 *     summary: Créer un rôle pour un événement
 *     tags: [Rôles d'événement]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateEventRoleRequest'
 *     responses:
 *       201:
 *         description: Rôle créé
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/EventRole'
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
 */
router.post("/",    requireAdminOrEventOwner,        EventRoleController.create);

/**
 * @swagger
 * /events/{eventId}/roles:
 *   get:
 *     summary: Lister les rôles d'un événement
 *     description: Retourne les rôles avec le nombre de membres assignés.
 *     tags: [Rôles d'événement]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
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
 *     responses:
 *       200:
 *         description: Liste des rôles
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
 *                         $ref: '#/components/schemas/EventRole'
 *       401:
 *         description: Non authentifié
 */
router.get("/",                                     EventRoleController.getByEvent);

/**
 * @swagger
 * /events/{eventId}/roles/{id}:
 *   get:
 *     summary: Récupérer un rôle
 *     tags: [Rôles d'événement]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Rôle récupéré
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/EventRole'
 *       404:
 *         description: Rôle introuvable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Non authentifié
 */
router.get("/:id",                                  EventRoleController.getOne);

/**
 * @swagger
 * /events/{eventId}/roles/{id}:
 *   put:
 *     summary: Modifier un rôle
 *     tags: [Rôles d'événement]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
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
 *             $ref: '#/components/schemas/CreateEventRoleRequest'
 *     responses:
 *       200:
 *         description: Rôle mis à jour
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/EventRole'
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
 *         description: Rôle introuvable
 */
router.put("/:id",  requireAdminOrEventOwner,        EventRoleController.update);

/**
 * @swagger
 * /events/{eventId}/roles/{id}:
 *   delete:
 *     summary: Supprimer un rôle
 *     description: La suppression échoue si des membres sont encore assignés à ce rôle.
 *     tags: [Rôles d'événement]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Rôle supprimé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Des membres sont encore assignés à ce rôle
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé — rôle admin requis
 *       404:
 *         description: Rôle introuvable
 */
router.delete("/:id", requireAdminOrEventOwner,      EventRoleController.delete);

module.exports = router;
