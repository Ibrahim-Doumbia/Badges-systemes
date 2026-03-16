const express = require("express");
const router = express.Router();
const ParticipantController = require("../controllers/participant.controller");
const { authenticate, mustChangePwd, requireRole } = require("../middlewares/auth.middleware");

router.use(authenticate, mustChangePwd);

router.post("/", requireRole(["admin", "staff"]), ParticipantController.create);
router.get("/", ParticipantController.getAll);
router.get("/:id", ParticipantController.getOne);
router.put("/:id", requireRole(["admin", "staff"]), ParticipantController.update);
router.delete("/:id", requireRole("admin"), ParticipantController.delete);

module.exports = router;
