const express = require("express");
const router = express.Router({ mergeParams: true });
const CategoryController = require("../controllers/category.controller");
const { authenticate, mustChangePwd, requireRole } = require("../middlewares/auth.middleware");

router.use(authenticate, mustChangePwd);

router.post("/", requireRole("admin"), CategoryController.create);
router.get("/", CategoryController.getByEvent);
router.get("/:id", CategoryController.getOne);
router.put("/:id", requireRole("admin"), CategoryController.update);
router.delete("/:id", requireRole("admin"), CategoryController.delete);

module.exports = router;
