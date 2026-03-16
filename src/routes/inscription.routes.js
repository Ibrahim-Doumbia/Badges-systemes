const express = require("express");
const router = express.Router();
const InscriptionController = require("../controllers/inscription.controller");
const { authenticate, mustChangePwd, requireRole } = require("../middlewares/auth.middleware");

router.use(authenticate, mustChangePwd);

router.post("/", requireRole(["admin", "staff"]), InscriptionController.create);
router.get("/", InscriptionController.getAll);
router.get("/:id", InscriptionController.getOne);
router.patch("/:id/status", requireRole(["admin", "staff"]), InscriptionController.updateStatus);
router.delete("/:id", requireRole("admin"), InscriptionController.delete);

module.exports = router;
