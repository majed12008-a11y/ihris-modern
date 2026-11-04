import { Router } from "express";
import { PersonController } from "../controllers/person.controller";
import { authenticate } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";

const router = Router();

router.get("/", authenticate, PersonController.list);
router.get("/:id", authenticate, PersonController.getById);
router.post("/", authenticate, requireRole("admin", "hr_manager"), PersonController.create);
router.put("/:id", authenticate, requireRole("admin", "hr_manager"), PersonController.update);
router.delete("/:id", authenticate, requireRole("admin"), PersonController.delete);

export default router;
