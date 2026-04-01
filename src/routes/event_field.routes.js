/**
 * Routes champs de formulaire d'inscription.
 * Montées sous /events/:eventId/fields
 * Accessible à l'admin et à l'organisateur de l'événement.
 */

const express = require("express");
const router = express.Router({ mergeParams: true });
const EventFieldController = require("../controllers/event_field.controller");
const { authenticate, mustChangePwd, requireAdminOrEventOwner } = require("../middlewares/auth.middleware");

router.use(authenticate, mustChangePwd);

/**
 * @swagger
 * /events/{eventId}/fields:
 *   get:
 *     summary: Lister les champs du formulaire d'inscription
 *     tags: [Champs formulaire]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Liste des champs
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
 *                         $ref: '#/components/schemas/EventField'
 */
router.get("/", EventFieldController.getAll);

/**
 * @swagger
 * /events/{eventId}/fields:
 *   post:
 *     summary: Ajouter un champ au formulaire d'inscription
 *     description: Admin ou organisateur de l'événement uniquement.
 *     tags: [Champs formulaire]
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
 *             $ref: '#/components/schemas/CreateEventFieldRequest'
 *     responses:
 *       201:
 *         description: Champ créé
 *       400:
 *         description: Données invalides ou clé déjà existante
 */
router.post("/", requireAdminOrEventOwner, EventFieldController.create);

/**
 * @swagger
 * /events/{eventId}/fields/{id}:
 *   put:
 *     summary: Modifier un champ du formulaire
 *     tags: [Champs formulaire]
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
 *             $ref: '#/components/schemas/CreateEventFieldRequest'
 *     responses:
 *       200:
 *         description: Champ mis à jour
 */
router.put("/:id", requireAdminOrEventOwner, EventFieldController.update);

/**
 * @swagger
 * /events/{eventId}/fields/{id}:
 *   delete:
 *     summary: Supprimer un champ du formulaire
 *     tags: [Champs formulaire]
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
 *         description: Champ supprimé
 */
router.delete("/:id", requireAdminOrEventOwner, EventFieldController.delete);

module.exports = router;
