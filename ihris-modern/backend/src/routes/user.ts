import { Router } from "express";
import { UserController } from "../controllers/user.controller";
import { authenticate } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";

const router = Router();

// ADR-003: القائمة تعرض غير المحذوفين فقط؛ قائمة المحذوفين admin فقط
router.get("/", authenticate, requireRole("admin", "hr_manager"), UserController.list);
router.get("/deleted", authenticate, requireRole("admin"), UserController.listDeleted);
router.get("/:id", authenticate, UserController.getById);
router.post("/", authenticate, requireRole("admin"), UserController.create);
router.put("/:id", authenticate, UserController.update);
router.delete("/:id", authenticate, requireRole("admin"), UserController.softDelete);
router.post("/:id/restore", authenticate, requireRole("admin"), UserController.restore);

// BLK-008: تعطيل/تفعيل الحساب — admin فقط
router.put("/:id/deactivate", authenticate, requireRole("admin"), UserController.deactivate);
router.put("/:id/activate", authenticate, requireRole("admin"), UserController.activate);

// @deprecated — يبقى للتوافق؛ يتطلب version الآن
router.post("/:id/role", authenticate, requireRole("admin"), UserController.updateRole);

export default router;
