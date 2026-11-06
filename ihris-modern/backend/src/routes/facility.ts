import { Router } from "express";
import { FacilityController } from "../controllers/facility.controller";
import { authenticate } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";

const router = Router();

// ADR-006: بيانات مرجعية للتسلسل الجغرافي — متاحة لكل مستخدم مصادَق
router.get("/meta/countries", authenticate, FacilityController.countries);
router.get("/meta/districts", authenticate, FacilityController.districts);
router.get("/meta/counties", authenticate, FacilityController.counties);
router.get("/meta/regions", authenticate, FacilityController.regions);
router.get("/meta/facility-types", authenticate, FacilityController.facilityTypes);

// القراءة متاحة لكل الأدوار (المنشآت بيانات عامة)
router.get("/", authenticate, FacilityController.list);
router.get("/:id", authenticate, FacilityController.getById);

// الكتابة: admin + hr_manager — hr_staff قراءة فقط
router.post("/", authenticate, requireRole("admin", "hr_manager"), FacilityController.create);
router.put("/:id", authenticate, requireRole("admin", "hr_manager"), FacilityController.update);

// الحذف: admin فقط
router.delete("/:id", authenticate, requireRole("admin"), FacilityController.delete);

export default router;
