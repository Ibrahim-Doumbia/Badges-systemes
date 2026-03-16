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

// Assigner un utilisateur à l'équipe
router.post("/",              requireRole("admin"), UserEventController.assign);

// Lister les membres de l'équipe
router.get("/",                                     UserEventController.getTeam);

// Changer le rôle d'un membre
router.patch("/:id/role",     requireRole("admin"), UserEventController.changeRole);

// Retirer un membre de l'équipe
router.delete("/:id",         requireRole("admin"), UserEventController.remove);

module.exports = router;
