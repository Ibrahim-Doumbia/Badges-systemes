/**
 * Routes de gestion de l'équipe d'un événement.
 * Toutes imbriquées sous /api/events/:eventId/team
 *
 * - Lecture : admin et staff
 * - Assignation / changement de rôle / retrait : admin uniquement
 */

const express = require("express");
const router = express.Router({ mergeParams: true }); // accès à req.params.eventId
const UserEventController = require("../controllers/user_event.controller");
const { authenticate, mustChangePwd, requireRole } = require("../middlewares/auth.middleware");

router.use(authenticate, mustChangePwd);

/**
 * @swagger
 * tags:
 *   name: Équipe événement
 *   description: Gestion des membres de l'équipe d'un événement
 */

/**
 * @swagger
 * /events/{eventId}/team:
 *   post:
 *     summary: Assigner un utilisateur à l'équipe
 *     tags: [Équipe événement]
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
 *             $ref: '#/components/schemas/AssignTeamMemberRequest'
 *     responses:
 *       201:
 *         description: Membre assigné
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/TeamMember'
 *       400:
 *         description: Utilisateur déjà assigné ou données invalides
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé — rôle admin requis
 *       404:
 *         description: Événement, utilisateur ou rôle introuvable
 */
router.post("/",              requireRole("admin"), UserEventController.assign);

/**
 * @swagger
 * /events/{eventId}/team:
 *   get:
 *     summary: Lister les membres de l'équipe
 *     tags: [Équipe événement]
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
 *         description: Liste des membres de l'équipe
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
 *                         $ref: '#/components/schemas/TeamMember'
 *       401:
 *         description: Non authentifié
 */
router.get("/",                                     UserEventController.getTeam);

/**
 * @swagger
 * /events/{eventId}/team/{id}/role:
 *   patch:
 *     summary: Changer le rôle d'un membre
 *     tags: [Équipe événement]
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
 *         description: UUID de l'assignation (UserEvent)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChangeRoleRequest'
 *     responses:
 *       200:
 *         description: Rôle du membre mis à jour
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/TeamMember'
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
 *         description: Assignation introuvable
 */
router.patch("/:id/role",     requireRole("admin"), UserEventController.changeRole);

/**
 * @swagger
 * /events/{eventId}/team/{id}:
 *   delete:
 *     summary: Retirer un membre de l'équipe
 *     tags: [Équipe événement]
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
 *         description: UUID de l'assignation (UserEvent)
 *     responses:
 *       200:
 *         description: Membre retiré de l'équipe
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé — rôle admin requis
 *       404:
 *         description: Assignation introuvable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete("/:id",         requireRole("admin"), UserEventController.remove);

module.exports = router;
