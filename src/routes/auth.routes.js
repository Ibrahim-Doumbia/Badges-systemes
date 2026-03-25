/**
 * Routes d'authentification.
 * /api/auth/login          → public
 * /api/auth/change-password → authentifié (même si mustChangePassword = true)
 * /api/auth/me             → authentifié + mdp changé
 */

const express = require("express");
const router = express.Router();
const AuthController = require("../controllers/auth.controller");
const { authenticate, mustChangePwd } = require("../middlewares/auth.middleware");

/**
 * @swagger
 * tags:
 *   name: Authentification
 *   description: Connexion, profil et changement de mot de passe
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Inscription publique
 *     description: Crée un compte utilisateur avec le rôle organisateur et retourne un token JWT.
 *     tags: [Authentification]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nom, prenom, email, password]
 *             properties:
 *               nom:
 *                 type: string
 *               prenom:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 description: Min 8 caractères, 1 majuscule, 1 caractère spécial
 *     responses:
 *       201:
 *         description: Inscription réussie — retourne le token et le profil
 *       400:
 *         description: Données invalides ou email déjà utilisé
 */
router.post("/register", AuthController.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Connexion utilisateur
 *     description: Authentifie un utilisateur et retourne un token JWT.
 *     tags: [Authentification]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Connexion réussie — le champ `data` contient le token et le profil utilisateur
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
 *                         token:
 *                           type: string
 *                           example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                         user:
 *                           $ref: '#/components/schemas/User'
 *       401:
 *         description: Identifiants invalides
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/login", AuthController.login);

/**
 * @swagger
 * /auth/change-password:
 *   put:
 *     summary: Changer le mot de passe
 *     description: >
 *       Permet à l'utilisateur connecté de changer son mot de passe.
 *       Accessible même si `mustChangePassword` est `true`.
 *     tags: [Authentification]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChangePasswordRequest'
 *     responses:
 *       200:
 *         description: Mot de passe modifié avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Ancien mot de passe incorrect ou nouveau mot de passe invalide
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Non authentifié
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put("/change-password", authenticate, AuthController.changePassword);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Profil de l'utilisateur connecté
 *     description: Retourne les informations de l'utilisateur authentifié (sans le mot de passe).
 *     tags: [Authentification]
 *     responses:
 *       200:
 *         description: Profil récupéré
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         description: Non authentifié
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/me", authenticate, mustChangePwd, AuthController.me);

module.exports = router;
