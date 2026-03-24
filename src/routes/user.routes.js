/**
 * Routes utilisateurs.
 * Toutes réservées aux admins sauf consultation de son propre profil.
 */

const express = require("express");
const router = express.Router();
const UserController = require("../controllers/user.controller");
const { authenticate, mustChangePwd, requireRole } = require("../middlewares/auth.middleware");

// Tous les routes utilisateurs nécessitent l'authentification + mdp changé
router.use(authenticate, mustChangePwd);

router.post("/", requireRole("admin"), UserController.create);
router.get("/", requireRole("admin"), UserController.getAll);
router.get("/:id", requireRole("admin"), UserController.getOne);
router.put("/:id", requireRole("admin"), UserController.update);
router.patch("/:id", requireRole("admin"), UserController.desactive);

module.exports = router;
