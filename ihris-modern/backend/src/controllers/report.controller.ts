import { Response } from "express";
import { ReportService } from "../services/report.service";
import { ReportValidator } from "../services/report.validation.service";
import {
  toCsv,
  toPdf,
  toXlsx,
  buildContentDisposition,
  XLSX_CONTENT_TYPE,
} from "../services/report.export.service";
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
   * تصدير نتيجة تقرير كملف CSV أو PDF (عربي) أو Excel (بيانات فعلية من قاعدة البيانات)
   */
  static exportReport = asyncHandler(async (req: AuthRequest, res: Response) => {
    const reportDefinitionId = parseInt(req.params.id, 10);
    const requested = String(req.query.format ?? "csv").toLowerCase();
    // `excel` اسم بديل مقبول لـ`xlsx`.
    const format = requested === "excel" ? "xlsx" : requested;
    if (format !== "csv" && format !== "pdf" && format !== "xlsx") {
      res.status(400).json({ error: "Unsupported format. Use csv, pdf or xlsx." });
      return;
    }

    const reportCheck = await ReportValidator.validateReportDefinitionExists(reportDefinitionId);
    if (!reportCheck.exists) {
      res.status(404).json({ error: "Report definition not found or disabled" });
      return;
    }

    const reportName: string =
      (reportCheck.report?.name as string | undefined) ?? `Report #${reportDefinitionId}`;

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

    const generatedAt = new Date();
    const meta = { title: reportName, generatedAt };

    if (format === "csv") {
      const csv = toCsv({ columns, rows: data });
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        buildContentDisposition(reportDefinitionId, reportName, "csv", generatedAt)
      );
      res.setHeader("X-Report-Row-Count", String(data.length));
      res.send(csv);
      return;
    }

    if (format === "xlsx") {
      const xlsx = await toXlsx({ columns, rows: data }, meta);
      res.setHeader("Content-Type", XLSX_CONTENT_TYPE);
      res.setHeader(
        "Content-Disposition",
        buildContentDisposition(reportDefinitionId, reportName, "xlsx", generatedAt)
      );
      res.setHeader("X-Report-Row-Count", String(data.length));
      res.send(xlsx);
      return;
    }

    const pdf = await toPdf({ columns, rows: data }, meta);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      buildContentDisposition(reportDefinitionId, reportName, "pdf", generatedAt)
    );
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
