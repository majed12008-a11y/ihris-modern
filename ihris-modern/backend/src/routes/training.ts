import { Router } from "express";
import { TrainingController } from "../controllers/training.controller";
import { authenticate } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";

const router = Router();

router.get("/courses", authenticate, TrainingController.listCourses);
router.post("/courses", authenticate, requireRole("admin", "hr_manager", "training_manager"), TrainingController.createCourse);
router.get("/institutions", authenticate, TrainingController.listInstitutions);
router.post("/institutions", authenticate, requireRole("admin", "hr_manager"), TrainingController.createInstitution);
router.get("/statuses", authenticate, TrainingController.listStatuses);
router.get("/categories", authenticate, TrainingController.listCategories);

export default router;
