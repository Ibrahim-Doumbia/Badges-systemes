const express = require("express");
const router = express.Router();
const EventTypeController = require("../controllers/event_type.controller");
const { authenticate, mustChangePwd, requireRole } = require("../middlewares/auth.middleware");

router.use(authenticate, mustChangePwd);

router.post("/", requireRole("admin"), EventTypeController.create);
router.get("/", EventTypeController.getAll);
router.get("/:id", EventTypeController.getOne);
router.put("/:id", requireRole("admin"), EventTypeController.update);
router.delete("/:id", requireRole("admin"), EventTypeController.delete);

module.exports = router;
