import { Router } from "express";
import { PositionController } from "../controllers/position.controller";
import { authenticate } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";

const router = Router();

router.get("/", authenticate, PositionController.list);
router.get("/:id", authenticate, PositionController.getById);
router.post("/", authenticate, requireRole("admin", "hr_manager"), PositionController.create);
router.put("/:id", authenticate, requireRole("admin", "hr_manager"), PositionController.update);
router.delete("/:id", authenticate, requireRole("admin"), PositionController.delete);

export default router;
