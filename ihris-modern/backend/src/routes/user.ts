import { Router } from "express";
import { UserController } from "../controllers/user.controller";
import { authenticate } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";

const router = Router();

router.get("/", authenticate, requireRole("admin", "hr_manager"), UserController.list);
router.post("/", authenticate, requireRole("admin"), UserController.create);
router.post("/:id/role", authenticate, requireRole("admin"), UserController.updateRole);

export default router;
