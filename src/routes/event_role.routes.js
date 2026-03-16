/**
 * Routes des rôles d'événement.
 * Toutes imbriquées sous /api/events/:eventId/roles
 *
 * - Lecture : admin et staff
 * - Écriture (create/update/delete) : admin uniquement
 */

const express = require("express");
const router = express.Router({ mergeParams: true }); // accès à req.params.eventId
const EventRoleController = require("../controllers/event_role.controller");
const { authenticate, mustChangePwd, requireRole } = require("../middlewares/auth.middleware");

router.use(authenticate, mustChangePwd);

router.post("/",    requireRole("admin"),           EventRoleController.create);
router.get("/",                                     EventRoleController.getByEvent);
router.get("/:id",                                  EventRoleController.getOne);
router.put("/:id",  requireRole("admin"),           EventRoleController.update);
router.delete("/:id", requireRole("admin"),         EventRoleController.delete);

module.exports = router;
