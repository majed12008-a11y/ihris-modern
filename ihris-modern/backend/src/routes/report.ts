import { Router } from "express";
import { ReportController } from "../controllers/report.controller";
import { authenticate } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";

const router = Router();

/**
 * @route GET /api/reports
 * @desc قائمة تعريفات التقارير مع التصفح والبحث
 * @access Private (المستخدمون المصادق عليهم)
 */
router.get("/", authenticate, ReportController.list);

/**
 * @route GET /api/reports/:id
 * @desc جلب تعريف تقرير بواسطة المعرف
 * @access Private (المستخدمون المصادق عليهم)
 */
router.get("/:id", authenticate, ReportController.getById);

/**
 * @route POST /api/reports
 * @desc إنشاء تعريف تقرير جديد
 * @access Private (admin, hr_manager فقط)
 */
router.post("/", authenticate, ReportController.create);

/**
 * @route PUT /api/reports/:id
 * @desc تعديل تعريف تقرير
 * @access Private (admin, hr_manager فقط)
 */
router.put("/:id", authenticate, ReportController.update);

/**
 * @route DELETE /api/reports/:id
 * @desc حذف تعريف تقرير
 * @access Private (admin فقط)
 */
router.delete("/:id", authenticate, ReportController.delete);

/**
 * @route POST /api/reports/:id/execute
 * @desc تنفيذ تقرير
 * @access Private (المستخدمون المصادق عليهم)
 */
router.post("/:id/execute", authenticate, ReportController.execute);

/**
 * @route GET /api/reports/:id/executions
 * @desc قائمة سجلات تنفيذ تقرير معين
 * @access Private (المستخدمون المصادق عليهم)
 */
router.get("/:id/executions", authenticate, ReportController.listExecutions);

/**
 * @route GET /api/reports/executions/:id
 * @desc جلب سجل تنفيذ تقرير بواسطة المعرف
 * @access Private (المستخدمون المصادق عليهم)
 */
router.get("/executions/:id", authenticate, ReportController.getExecutionById);

/**
 * @route POST /api/reports/:id/disable
 * @desc إلغاء تنشيط تقرير (soft delete)
 * @access Private (admin, hr_manager فقط)
 */
router.post("/:id/disable", authenticate, ReportController.disable);

/**
 * @route POST /api/reports/:id/enable
 * @desc إعادة تنشيط تقرير
 * @access Private (admin, hr_manager فقط)
 */
router.post("/:id/enable", authenticate, ReportController.enable);

export default router;
