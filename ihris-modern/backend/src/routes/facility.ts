import { Router } from "express";
import { FacilityController } from "../controllers/facility.controller";
import { authenticate } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";

const router = Router();

router.get("/", authenticate, FacilityController.list);
router.get("/:id", authenticate, FacilityController.getById);
router.post("/", authenticate, requireRole("admin", "hr_manager"), FacilityController.create);
router.put("/:id", authenticate, requireRole("admin", "hr_manager"), FacilityController.update);
router.delete("/:id", authenticate, requireRole("admin"), FacilityController.delete);

export default router;
