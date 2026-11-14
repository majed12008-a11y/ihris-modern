import { Router } from "express";
import { TrainingController } from "../controllers/training.controller";
import { authenticate } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";

/**
 * ADR-009 §9.2 (9) — مسارات وحدة التدريب.
 * القراءة: كل مستخدم مصادق. الكتابة: admin + hr_manager + training_manager.
 */
const router = Router();
const WRITE_ROLES: Array<"admin" | "hr_manager" | "training_manager"> = [
  "admin",
  "hr_manager",
  "training_manager",
];

// ---------------------------------------------------------------- courses
router.get("/courses", authenticate, TrainingController.listCourses);
router.get("/courses/:id", authenticate, TrainingController.getCourse);
router.post("/courses", authenticate, requireRole(...WRITE_ROLES), TrainingController.createCourse);
router.put("/courses/:id", authenticate, requireRole(...WRITE_ROLES), TrainingController.updateCourse);
router.delete(
  "/courses/:id",
  authenticate,
  requireRole(...WRITE_ROLES),
  TrainingController.deleteCourse
);

// ---------------------------------------------------------------- institutions
router.get("/institutions", authenticate, TrainingController.listInstitutions);
router.get("/institutions/:id", authenticate, TrainingController.getInstitution);
router.post(
  "/institutions",
  authenticate,
  requireRole(...WRITE_ROLES),
  TrainingController.createInstitution
);
router.put(
  "/institutions/:id",
  authenticate,
  requireRole(...WRITE_ROLES),
  TrainingController.updateInstitution
);
router.delete(
  "/institutions/:id",
  authenticate,
  requireRole(...WRITE_ROLES),
  TrainingController.deleteInstitution
);

// ---------------------------------------------------------------- scheduled courses
router.get("/scheduled", authenticate, TrainingController.listScheduled);
router.get("/scheduled/:id", authenticate, TrainingController.getScheduled);
router.post(
  "/scheduled",
  authenticate,
  requireRole(...WRITE_ROLES),
  TrainingController.createScheduled
);
router.put(
  "/scheduled/:id",
  authenticate,
  requireRole(...WRITE_ROLES),
  TrainingController.updateScheduled
);
router.delete(
  "/scheduled/:id",
  authenticate,
  requireRole(...WRITE_ROLES),
  TrainingController.deleteScheduled
);

// ---------------------------------------------------------------- enrollments
router.get("/scheduled/:id/enrollments", authenticate, TrainingController.listEnrollments);
router.post(
  "/scheduled/:id/enroll",
  authenticate,
  requireRole(...WRITE_ROLES),
  TrainingController.enroll
);
router.put(
  "/enrollments/:id",
  authenticate,
  requireRole(...WRITE_ROLES),
  TrainingController.updateEnrollment
);
router.delete(
  "/enrollments/:id",
  authenticate,
  requireRole(...WRITE_ROLES),
  TrainingController.deleteEnrollment
);

// ---------------------------------------------------------------- lookups
router.get("/statuses", authenticate, TrainingController.listStatuses);
router.get("/categories", authenticate, TrainingController.listCategories);

export default router;
