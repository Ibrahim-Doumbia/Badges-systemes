const express = require("express");
const router = express.Router();
const BadgeController = require("../controllers/badge.controller");
const { authenticate, mustChangePwd, requireRole } = require("../middlewares/auth.middleware");

router.use(authenticate, mustChangePwd);

/**
 * @swagger
 * tags:
 *   name: Badges
 *   description: Génération et gestion des badges QR Code
 */

/**
 * @swagger
 * /badges/generate/{inscriptionId}:
 *   post:
 *     summary: Générer manuellement un badge
 *     description: >
 *       Génère (ou régénère) un badge QR Code pour une inscription donnée.
 *       Normalement, le badge est généré automatiquement à la confirmation de l'inscription.
 *     tags: [Badges]
 *     parameters:
 *       - in: path
 *         name: inscriptionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID de l'inscription
 *     responses:
 *       201:
 *         description: Badge généré
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Badge'
 *       400:
 *         description: Inscription non confirmée ou badge déjà existant
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé — rôle admin ou staff requis
 *       404:
 *         description: Inscription introuvable
 */
router.post("/generate/:inscriptionId", requireRole(["organisateur", "staff"]), BadgeController.generate);

/**
 * @swagger
 * /badges:
 *   get:
 *     summary: Lister les badges
 *     tags: [Badges]
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
 *         name: statut
 *         schema:
 *           type: string
 *           enum: [generated, printed]
 *         description: Filtrer par statut du badge
 *     responses:
 *       200:
 *         description: Liste des badges
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
 *                         $ref: '#/components/schemas/Badge'
 *       401:
 *         description: Non authentifié
 */
router.get("/", BadgeController.getAll);

/**
 * @swagger
 * /badges/{id}:
 *   get:
 *     summary: Récupérer un badge
 *     tags: [Badges]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Badge récupéré
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Badge'
 *       404:
 *         description: Badge introuvable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Non authentifié
 */
router.get("/:id", BadgeController.getOne);

/**
 * @swagger
 * /badges/{id}/print:
 *   patch:
 *     summary: Marquer un badge comme imprimé
 *     description: Change le statut du badge de `generated` à `printed`.
 *     tags: [Badges]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Badge marqué comme imprimé
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Badge'
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé — rôle admin ou staff requis
 *       404:
 *         description: Badge introuvable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch("/:id/print", requireRole(["organisateur", "staff"]), BadgeController.markAsPrinted);

/**
 * @swagger
 * /badges/{id}/regenerate:
 *   patch:
 *     summary: Régénérer un badge
 *     description: Génère un nouveau QR Code pour le badge et remet son statut à `generated`.
 *     tags: [Badges]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Badge régénéré
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Badge'
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé — rôle admin requis
 *       404:
 *         description: Badge introuvable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch("/:id/regenerate", requireRole("organisateur", "staff"), BadgeController.regenerate);

/**
 * @swagger
 * /badges/inscription/{inscriptionId}/regenerate:
 *   patch:
 *     summary: Régénérer (ou créer) le badge d'une inscription
 *     description: >
 *       Si un badge existe pour cette inscription, son QR Code est régénéré.
 *       Si aucun badge n'existe, un nouveau badge est créé.
 *     tags: [Badges]
 *     parameters:
 *       - in: path
 *         name: inscriptionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID de l'inscription
 *     responses:
 *       200:
 *         description: Badge régénéré ou créé
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Badge'
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé — rôle admin requis
 *       404:
 *         description: Inscription introuvable
 */
router.patch(
  "/inscription/:inscriptionId/regenerate",
  requireRole("organisateur", "staff"),
  BadgeController.regenerateBadge
);

module.exports = router;
