/**
 * Routes événements.
 * La création/modification/suppression est réservée aux admins.
 * La lecture est accessible à tous les utilisateurs authentifiés.
 */

const express = require("express");
const router = express.Router();
const EventController = require("../controllers/event.controller");
const { authenticate, mustChangePwd, requireRole, requireAdminOrEventOwner } = require("../middlewares/auth.middleware");
const { uploadEventPhoto } = require("../middlewares/upload.middleware");

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
 *     description: |
 *       Crée un nouvel événement avec une photo optionnelle.
 *       - Le créateur est automatiquement extrait du token JWT.
 *       - **Admin** : peut désigner n'importe quel utilisateur actif comme organisateur via `organisateur_id`.
 *       - **Non-admin** : l'organisateur est automatiquement fixé à l'utilisateur connecté, même si `organisateur_id` est fourni.
 *     tags: [Événements]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
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
 *         description: Données invalides (ex. end_date avant start_date, format image non supporté)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé
 */
router.post("/", (req, res, next) => {
  uploadEventPhoto(req, res, (err) => {
    if (err) return res.status(400).json({ success: false, message: err.message });
    next();
  });
}, EventController.create);

/**
 * @swagger
 * /events:
 *   get:
 *     summary: Lister les événements
 *     description: |
 *       Retourne la liste paginée des événements.
 *       - **Admin** : voit tous les événements de la plateforme.
 *       - **Non-admin** : voit uniquement les événements qu'il a lui-même créés.
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
 * /events/my-dashboard:
 *   get:
 *     summary: Tableau de bord de l'organisateur
 *     description: |
 *       Retourne tous les événements dont l'utilisateur connecté est organisateur,
 *       avec pour chaque événement :
 *       - Le nombre total de participants inscrits
 *       - Le montant total généré (prix catégorie × nombre d'inscrits par catégorie)
 *       - Le nombre de badges générés
 *       - Un détail complet par catégorie (inscrits, revenue, badges)
 *
 *       **Dashboard strictement personnel** : chaque utilisateur ne voit que
 *       les événements dont il est lui-même organisateur (via UserEvent).
 *       Accessible à tout utilisateur authentifié ayant au moins un événement en tant qu'organisateur.
 *     tags: [Événements]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tableau de bord récupéré
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
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           title:
 *                             type: string
 *                             example: "Conférence Tech 2026"
 *                           description:
 *                             type: string
 *                           start_date:
 *                             type: string
 *                             format: date-time
 *                           end_date:
 *                             type: string
 *                             format: date-time
 *                           lieu:
 *                             type: string
 *                           isActive:
 *                             type: boolean
 *                           photo_url:
 *                             type: string
 *                             nullable: true
 *                           eventType:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                                 format: uuid
 *                               name:
 *                                 type: string
 *                               label:
 *                                 type: string
 *                           total_participants:
 *                             type: integer
 *                             description: Nombre total d'inscrits à cet événement
 *                             example: 42
 *                           revenue:
 *                             type: number
 *                             format: float
 *                             description: Montant total généré (somme prix × inscrits par catégorie)
 *                             example: 315000.00
 *                           badges_count:
 *                             type: integer
 *                             description: Nombre de badges générés pour cet événement
 *                             example: 38
 *                           categories_breakdown:
 *                             type: array
 *                             description: Détail statistique par catégorie
 *                             items:
 *                               type: object
 *                               properties:
 *                                 category_id:
 *                                   type: string
 *                                   format: uuid
 *                                 category_name:
 *                                   type: string
 *                                   example: "VIP"
 *                                 price:
 *                                   type: number
 *                                   format: float
 *                                   example: 15000.00
 *                                 inscrits:
 *                                   type: integer
 *                                   example: 10
 *                                 revenue:
 *                                   type: number
 *                                   format: float
 *                                   example: 150000.00
 *                                 badges:
 *                                   type: integer
 *                                   example: 9
 *       401:
 *         description: Non authentifié
 */
router.get("/my-dashboard", EventController.getMyDashboard);

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
router.put("/:id", requireAdminOrEventOwner, EventController.update);

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
router.delete("/:id", requireAdminOrEventOwner, EventController.delete);

module.exports = router;
