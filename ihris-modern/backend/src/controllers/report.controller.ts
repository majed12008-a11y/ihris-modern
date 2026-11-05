import { Response } from "express";
import { ReportService } from "../services/report.service";
import { ReportValidator } from "../services/report.validation.service";
import { toCsv, toPdf } from "../services/report.export.service";
import { asyncHandler } from "../middleware/error";
import { AuthRequest } from "../middleware/auth";

export class ReportController {
  /**
   * قائمة تعريفات التقارير مع التصفح والبحث
   */
  static list = asyncHandler(async (req: AuthRequest, res: Response) => {
    const filter = {
      search: req.query.search as string | undefined,
      isEnabled:
        req.query.isEnabled !== undefined
          ? req.query.isEnabled === "true"
          : undefined,
      createdBy: req.query.createdBy ? parseInt(req.query.createdBy as string, 10) : undefined,
      page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 50,
    };

    const result = await ReportService.list(filter);
    res.json(result);
  });

  /**
   * جلب تعريف تقرير بواسطة المعرف
   */
  static getById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const id = parseInt(req.params.id, 10);
    const report = await ReportService.getById(id);
    res.json(report);
  });

  /**
   * إنشاء تعريف تقرير جديد
   */
  static create = asyncHandler(async (req: AuthRequest, res: Response) => {
    // التحقق من صحة البيانات المدخلة
    const validation = await ReportValidator.validateDefinition(req.body);
    if (!validation.valid) {
      res.status(400).json({
        error: "Validation failed",
        errors: validation.errors,
        warnings: validation.warnings,
      });
      return;
    }

    // التحقق من صلاحية المستخدم
    // في الإصدار الحالي، يتم افتراض أن المستخدم مصادق عليه
    // في الإصدار الكامل، سيتم التحقق من دور المستخدم في قاعدة البيانات
    const userId = req.user?.userId || 1; // مؤقتًا، افتراض أن المستخدم هو admin

    const report = await ReportService.create({
      name: req.body.name,
      description: req.body.description,
      type: req.body.type,
      definition: req.body.definition,
      isEnabled: req.body.isEnabled,
      createdBy: userId,
    });

    res.status(201).json(report);
  });

  /**
   * تعديل تعريف تقرير
   */
  static update = asyncHandler(async (req: AuthRequest, res: Response) => {
    const id = parseInt(req.params.id, 10);

    // التحقق من صحة البيانات المدخلة
    const validation = await ReportValidator.validateDefinition(req.body);
    if (!validation.valid) {
      res.status(400).json({
        error: "Validation failed",
        errors: validation.errors,
        warnings: validation.warnings,
      });
      return;
    }

    const report = await ReportService.update(id, req.body);
    res.json(report);
  });

  /**
   * حذف تعريف تقرير
   */
  static delete = asyncHandler(async (req: AuthRequest, res: Response) => {
    const id = parseInt(req.params.id, 10);
    await ReportService.delete(id);
    res.status(204).send();
  });

  /**
   * تنفيذ تقرير
   */
  static execute = asyncHandler(async (req: AuthRequest, res: Response) => {
    const reportDefinitionId = parseInt(req.params.id, 10);

    // التحقق من وجود التقرير وتعقيله للتنفيذ
    const reportCheck = await ReportValidator.validateReportDefinitionExists(reportDefinitionId);
    if (!reportCheck.exists) {
      res.status(404).json({
        error: "Report definition not found or disabled",
      });
      return;
    }

    // التحقق من صلاحية المستخدم للتنفيذ
    const userId = req.user?.userId || 1; // مؤقتًا، افتراض أن المستخدم مصادق عليه

    const execution = await ReportService.execute({
      reportDefinitionId,
      executedBy: userId,
      startedAt: new Date(),
      runtimeParams: req.body?.params,
      maxRows: req.user?.role === "admin" ? 50000 : undefined,
    });

    res.status(201).json(execution);
  });

  /**
   * تصدير نتيجة تقرير كملف CSV أو PDF (بيانات فعلية من قاعدة البيانات)
   */
  static exportReport = asyncHandler(async (req: AuthRequest, res: Response) => {
    const reportDefinitionId = parseInt(req.params.id, 10);
    const format = String(req.query.format ?? "csv").toLowerCase();
    if (format !== "csv" && format !== "pdf") {
      res.status(400).json({ error: "Unsupported format. Use csv or pdf." });
      return;
    }

    const reportCheck = await ReportValidator.validateReportDefinitionExists(reportDefinitionId);
    if (!reportCheck.exists) {
      res.status(404).json({ error: "Report definition not found or disabled" });
      return;
    }

    const userId = req.user?.userId || 1;

    const execution = await ReportService.execute({
      reportDefinitionId,
      executedBy: userId,
      startedAt: new Date(),
      runtimeParams: req.body?.params,
      maxRows: req.user?.role === "admin" ? 50000 : undefined,
    });

    const { columns, data } = execution.result as {
      columns: string[];
      data: Array<Record<string, unknown>>;
    };

    const safeName = `report-${reportDefinitionId}`;

    if (format === "csv") {
      const csv = toCsv({ columns, rows: data });
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="${safeName}.csv"`);
      res.setHeader("X-Report-Row-Count", String(data.length));
      res.send(csv);
      return;
    }

    const pdf = await toPdf({ columns, rows: data }, `Report #${reportDefinitionId}`);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${safeName}.pdf"`);
    res.setHeader("X-Report-Row-Count", String(data.length));
    res.send(pdf);
  });

  /**
   * جلب سجل تنفيذ تقرير بواسطة المعرف
   */
  static getExecutionById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const id = parseInt(req.params.id, 10);
    const execution = await ReportService.getExecutionById(id);
    res.json(execution);
  });

  /**
   * قائمة سجلات تنفيذ تقرير معين
   */
  static listExecutions = asyncHandler(async (req: AuthRequest, res: Response) => {
    const reportDefinitionId = parseInt(req.params.id, 10);
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

    const result = await ReportService.listExecutions(reportDefinitionId, page, limit);
    res.json(result);
  });

  /**
   * إلغاء تنشيط تقرير (soft delete)
   */
  static disable = asyncHandler(async (req: AuthRequest, res: Response) => {
    const id = parseInt(req.params.id, 10);
    await ReportService.disable(id);
    res.status(204).send();
  });

  /**
   * إعادة تنشيط تقرير
   */
  static enable = asyncHandler(async (req: AuthRequest, res: Response) => {
    const id = parseInt(req.params.id, 10);
    await ReportService.enable(id);
    res.status(204).send();
  });
}
