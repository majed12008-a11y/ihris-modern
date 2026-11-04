import { Router } from "express";
import { SalaryController } from "../controllers/salary.controller";
import { authenticate } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";

const router = Router();

router.get("/", authenticate, SalaryController.list);
router.get("/:id", authenticate, SalaryController.getById);
router.post("/", authenticate, requireRole("admin", "hr_manager"), SalaryController.create);
router.put("/:id", authenticate, requireRole("admin", "hr_manager"), SalaryController.update);
router.delete("/:id", authenticate, requireRole("admin"), SalaryController.delete);

export default router;
