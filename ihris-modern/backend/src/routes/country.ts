import { Router } from "express";
import { CountryController } from "../controllers/country.controller";
import { authenticate } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";

const router = Router();

// ADR-007: القراءة متاحة لكل المصادَقين (بيانات مرجعية)
router.get("/", authenticate, CountryController.list);
router.get("/:id", authenticate, CountryController.getById);

// الكتابة: admin + hr_manager — hr_staff قراءة فقط
router.post("/", authenticate, requireRole("admin", "hr_manager"), CountryController.create);
router.put("/:id", authenticate, requireRole("admin", "hr_manager"), CountryController.update);

// الحذف: admin فقط
router.delete("/:id", authenticate, requireRole("admin"), CountryController.delete);

export default router;
