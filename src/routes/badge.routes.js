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
 *       Génère un badge QR Code pour une inscription donnée.
 *       L'inscription doit appartenir à un événement dont l'utilisateur est organisateur.
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
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               couleur:
 *                 type: string
 *                 pattern: '^#[0-9A-Fa-f]{6}$'
 *                 example: "#16a34a"
 *                 description: Couleur principale du badge (#RRGGBB). Par défaut '#2563eb'.
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
 *         description: Badge déjà existant pour cette inscription
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé — cet événement ne vous appartient pas
 *       404:
 *         description: Inscription introuvable
 */
router.post("/generate/:inscriptionId", requireRole(["organisateur", "staff"]), BadgeController.generate);

/**
 * @swagger
 * /badges:
 *   get:
 *     summary: Lister les badges d'un événement
 *     description: |
 *       Retourne la liste paginée des badges d'un événement.
 *
 *       **Règles d'accès :**
 *       - Le paramètre `event_id` est **obligatoire pour tout le monde** (admin inclus).
 *       - Vous ne pouvez lister que les badges d'un événement dont vous êtes créateur ou membre.
 *       - Le paramètre optionnel `inscription_id` permet de cibler le badge d'une inscription précise.
 *     tags: [Badges]
 *     parameters:
 *       - in: query
 *         name: event_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: "**Obligatoire.** UUID de l'événement dont on veut lister les badges."
 *       - in: query
 *         name: inscription_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filtrer sur une inscription précise dans l'événement
 *       - in: query
 *         name: statut
 *         schema:
 *           type: string
 *           enum: [generated, printed]
 *         description: Filtrer par statut du badge
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
 *       400:
 *         description: Paramètre event_id manquant
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé — réservé aux organisateurs et staff (les admins n'ont pas accès aux badges)
 *       404:
 *         description: Événement introuvable
 */
router.get("/", requireRole(["organisateur", "staff"]), BadgeController.getAll);

/**
 * @swagger
 * /badges/{id}:
 *   get:
 *     summary: Récupérer un badge
 *     description: Retourne un badge avec les détails de l'inscription, du participant, de l'événement et de la catégorie. Vérifie que l'événement appartient à l'utilisateur.
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
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé — réservé aux organisateurs et staff (les admins n'ont pas accès aux badges)
 *       404:
 *         description: Badge introuvable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/:id", requireRole(["organisateur", "staff"]), BadgeController.getOne);

/**
 * @swagger
 * /badges/{id}/print:
 *   patch:
 *     summary: Marquer un badge comme imprimé
 *     description: Change le statut du badge de `generated` à `printed`. L'événement doit appartenir à l'utilisateur.
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
 *       400:
 *         description: Badge déjà marqué comme imprimé
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé — cet événement ne vous appartient pas
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
 *     summary: Régénérer le QR Code d'un badge
 *     description: Génère un nouveau QR Code pour le badge et remet son statut à `generated`. L'événement doit appartenir à l'utilisateur. Permet également de changer la couleur en passant `couleur` dans le body.
 *     tags: [Badges]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               couleur:
 *                 type: string
 *                 pattern: '^#[0-9A-Fa-f]{6}$'
 *                 example: "#7c3aed"
 *                 description: Nouvelle couleur principale du badge (#RRGGBB). Conserve l'existante si absent.
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
 *         description: Accès refusé — cet événement ne vous appartient pas
 *       404:
 *         description: Badge introuvable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch("/:id/regenerate", requireRole(["organisateur", "staff"]), BadgeController.regenerate);

/**
 * @swagger
 * /badges/inscription/{inscriptionId}/regenerate:
 *   patch:
 *     summary: Régénérer (ou créer) le badge d'une inscription
 *     description: >
 *       Si un badge existe pour cette inscription, son QR Code est régénéré.
 *       Si aucun badge n'existe, un nouveau badge est créé.
 *       L'inscription doit appartenir à un événement dont l'utilisateur est organisateur.
 *       Permet également de définir ou changer la couleur via le body.
 *     tags: [Badges]
 *     parameters:
 *       - in: path
 *         name: inscriptionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID de l'inscription
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               couleur:
 *                 type: string
 *                 pattern: '^#[0-9A-Fa-f]{6}$'
 *                 example: "#0f766e"
 *                 description: Couleur principale du badge (#RRGGBB). Par défaut '#2563eb'.
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
 *         description: Accès refusé — cet événement ne vous appartient pas
 *       404:
 *         description: Inscription introuvable
 */
router.patch(
  "/inscription/:inscriptionId/regenerate",
  requireRole(["organisateur", "staff"]),
  BadgeController.regenerateBadge
);

/**
 * @swagger
 * /badges/{id}/color:
 *   patch:
 *     summary: Changer la couleur d'un badge
 *     description: >
 *       Met à jour la couleur principale du badge (en-tête et catégorie dans le PDF).
 *       La couleur doit être un code hexadécimal valide au format `#RRGGBB`.
 *       Le badge PDF généré lors du prochain téléchargement utilisera cette nouvelle couleur.
 *     tags: [Badges]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID du badge
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [couleur]
 *             properties:
 *               couleur:
 *                 type: string
 *                 pattern: '^#[0-9A-Fa-f]{6}$'
 *                 example: "#e63946"
 *                 description: Code couleur hexadécimal (#RRGGBB)
 *     responses:
 *       200:
 *         description: Couleur mise à jour
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
 *         description: Couleur manquante ou format invalide
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé — cet événement ne vous appartient pas
 *       404:
 *         description: Badge introuvable
 */
router.patch("/:id/color", requireRole(["organisateur", "staff"]), BadgeController.updateColor);

module.exports = router;
