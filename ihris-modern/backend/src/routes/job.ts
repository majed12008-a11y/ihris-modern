import { Router } from "express";
import { JobController } from "../controllers/job.controller";
import { authenticate } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";

const router = Router();

// ADR-007: بيانات مرجعية للـcascade — متاحة لكل مستخدم مصادَق
router.get("/meta/salary-grades", authenticate, JobController.salaryGrades);
router.get("/meta/cadres", authenticate, JobController.cadres);
router.get("/meta/classifications", authenticate, JobController.classifications);

// القراءة متاحة لكل المصادَقين
router.get("/", authenticate, JobController.list);
router.get("/:id", authenticate, JobController.getById);

// الكتابة: admin + hr_manager — hr_staff قراءة فقط
router.post("/", authenticate, requireRole("admin", "hr_manager"), JobController.create);
router.put("/:id", authenticate, requireRole("admin", "hr_manager"), JobController.update);

// الحذف: admin فقط
router.delete("/:id", authenticate, requireRole("admin"), JobController.delete);

export default router;
