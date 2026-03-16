/**
 * Routes événements.
 * La création/modification/suppression est réservée aux admins.
 * La lecture est accessible à tous les utilisateurs authentifiés.
 */

const express = require("express");
const router = express.Router();
const EventController = require("../controllers/event.controller");
const { authenticate, mustChangePwd, requireRole } = require("../middlewares/auth.middleware");

router.use(authenticate, mustChangePwd);

router.post("/", requireRole("admin"), EventController.create);
router.get("/", EventController.getAll);
router.get("/:id", EventController.getOne);
router.put("/:id", requireRole("admin"), EventController.update);
router.delete("/:id", requireRole("admin"), EventController.delete);

module.exports = router;
