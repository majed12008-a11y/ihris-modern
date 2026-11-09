import { Router } from "express";
import { ReferenceController } from "../controllers/reference.controller";
import { authenticate } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";

/**
 * ADR-008 §8.2 — مسارات البيانات المرجعية الخمسة.
 * GET متاح لكل مستخدم مصادق؛ الكتابة admin + hr_manager؛ الحذف admin.
 */
const router = Router();

router.get("/:entity", authenticate, ReferenceController.list);
router.get("/:entity/:id", authenticate, ReferenceController.getById);

router.post(
  "/:entity",
  authenticate,
  requireRole("admin", "hr_manager"),
  ReferenceController.create
);
router.put(
  "/:entity/:id",
  authenticate,
  requireRole("admin", "hr_manager"),
  ReferenceController.update
);

router.delete("/:entity/:id", authenticate, requireRole("admin"), ReferenceController.delete);

export default router;
