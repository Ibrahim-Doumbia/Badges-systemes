const express = require("express");
const router = express.Router();
const BadgeController = require("../controllers/badge.controller");
const { authenticate, mustChangePwd, requireRole } = require("../middlewares/auth.middleware");

router.use(authenticate, mustChangePwd);

router.post("/generate/:inscriptionId", requireRole(["admin", "staff"]), BadgeController.generate);
router.get("/", BadgeController.getAll);
router.get("/:id", BadgeController.getOne);
router.patch("/:id/print", requireRole(["admin", "staff"]), BadgeController.markAsPrinted);
router.patch("/:id/regenerate", requireRole("admin"), BadgeController.regenerate);

module.exports = router;
