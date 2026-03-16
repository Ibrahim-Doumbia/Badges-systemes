/**
 * Routes pour les jours d'événement.
 * Imbriquées sous /api/events/:eventId/days
 * et aussi accessibles en direct via /api/event-days/:id
 */

const express = require("express");
const router = express.Router({ mergeParams: true }); // mergeParams permet d'accéder à req.params.eventId
const EventDayController = require("../controllers/event_day.controller");
const { authenticate, mustChangePwd, requireRole } = require("../middlewares/auth.middleware");

router.use(authenticate, mustChangePwd);

router.post("/", requireRole("admin"), EventDayController.create);
router.get("/", EventDayController.getByEvent);
router.get("/:id", EventDayController.getOne);
router.put("/:id", requireRole(["admin", "staff"]), EventDayController.update);
router.delete("/:id", requireRole("admin"), EventDayController.delete);

module.exports = router;
