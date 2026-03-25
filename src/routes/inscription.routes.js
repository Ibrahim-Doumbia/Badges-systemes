const express = require("express");
const router = express.Router();
const InscriptionController = require("../controllers/inscription.controller");
const { authenticate, mustChangePwd, requireRole } = require("../middlewares/auth.middleware");

router.use(authenticate, mustChangePwd);

/**
 * @swagger
 * tags:
 *   name: Inscriptions
 *   description: Inscriptions des participants aux événements
 */

/**
 * @swagger
 * /inscriptions:
 *   post:
 *     summary: Créer une inscription
 *     description: Inscrit un participant à un événement dans une catégorie donnée.
 *     tags: [Inscriptions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateInscriptionRequest'
 *     responses:
 *       201:
 *         description: Inscription créée
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Inscription'
 *       400:
 *         description: Données invalides ou participant déjà inscrit à cet événement
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé — rôle admin ou staff requis
 */
router.post("/", requireRole(["admin", "staff", "organisateur"]), InscriptionController.create);

/**
 * @swagger
 * /inscriptions:
 *   get:
 *     summary: Lister les inscriptions
 *     tags: [Inscriptions]
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
 *         name: event_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filtrer par événement
 *       - in: query
 *         name: statut
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, cancelled]
 *         description: Filtrer par statut
 *     responses:
 *       200:
 *         description: Liste des inscriptions
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
 *                         $ref: '#/components/schemas/Inscription'
 *       401:
 *         description: Non authentifié
 */
router.get("/", InscriptionController.getAll);

/**
 * @swagger
 * /inscriptions/{id}:
 *   get:
 *     summary: Récupérer une inscription
 *     tags: [Inscriptions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Inscription récupérée
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Inscription'
 *       404:
 *         description: Inscription introuvable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Non authentifié
 */
router.get("/:id", InscriptionController.getOne);

/**
 * @swagger
 * /inscriptions/{id}/status:
 *   patch:
 *     summary: Mettre à jour le statut d'une inscription
 *     description: >
 *       Permet de confirmer (`confirmed`) ou annuler (`cancelled`) une inscription.
 *       La confirmation déclenche automatiquement la génération du badge QR Code.
 *     tags: [Inscriptions]
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
 *             $ref: '#/components/schemas/UpdateInscriptionStatusRequest'
 *     responses:
 *       200:
 *         description: Statut mis à jour
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Inscription'
 *       400:
 *         description: Statut invalide
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
router.patch("/:id/status", requireRole(["admin", "staff", "organisateur"]), InscriptionController.updateStatus);

/**
 * @swagger
 * /inscriptions/{id}:
 *   delete:
 *     summary: Supprimer une inscription
 *     tags: [Inscriptions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Inscription supprimée
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé — rôle admin requis
 *       404:
 *         description: Inscription introuvable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete("/:id", requireRole(["admin", "organisateur"]), InscriptionController.delete);

module.exports = router;
