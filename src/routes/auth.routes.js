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

router.post("/login", AuthController.login);
router.put("/change-password", authenticate, AuthController.changePassword);
router.get("/me", authenticate, mustChangePwd, AuthController.me);

module.exports = router;
