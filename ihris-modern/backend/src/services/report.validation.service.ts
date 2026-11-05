import { prisma } from "../lib/prisma";
import { ALLOWED_TABLES, IDENTIFIER_RE } from "./report.whitelist";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export class ReportValidator {
  /**
   * التحقق من صحة تعريف تقرير جديد قبل الإنشاء
   */
  static async validateDefinition(data: {
    name: string;
    type: string;
    definition: any;
  }): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // التحقق من الاسم
    if (!data.name || data.name.trim().length === 0) {
      errors.push("Report name is required");
    } else if (data.name.length > 255) {
      errors.push("Report name must not exceed 255 characters");
    }

    // التحقق من النوع
    const validTypes = ["list", "table", "chart", "pie", "bar", "line"];
    if (!data.type || !validTypes.includes(data.type)) {
      errors.push(`Invalid report type. Must be one of: ${validTypes.join(", ")}`);
    }

    // التحقق من تعريف التقرير
    if (!data.definition) {
      errors.push("Report definition is required");
    } else {
      // التحقق من وجود حقول أساسية في التعريف
      if (!data.definition.fields || !Array.isArray(data.definition.fields)) {
        warnings.push("Report definition does not contain fields array");
      }

      if (!data.definition.table && !data.definition.form) {
        warnings.push("Report definition does not specify source table or form");
      }

      // التحقق من حقول SQL محتملة الخطورة
      const definitionStr = JSON.stringify(data.definition).toLowerCase();
      const dangerousKeywords = ["drop ", "delete ", "update ", "insert ", "truncate ", "alter ", "create ", "drop table"];
      for (const keyword of dangerousKeywords) {
        if (definitionStr.includes(keyword)) {
          errors.push(`Report definition contains potentially dangerous SQL keyword: ${keyword}`);
        }
      }

      // ADR-004: لا يُسمح بـ SQL خام داخل التعريف
      if (Object.prototype.hasOwnProperty.call(data.definition, "sqlQuery")) {
        errors.push("Raw SQL (sqlQuery) is not allowed; use the declarative JSON definition");
      }

      // ADR-004: الجدول يجب أن يكون ضمن القائمة البيضاء
      if (typeof data.definition.table === "string") {
        if (!ALLOWED_TABLES.includes(data.definition.table)) {
          errors.push(
            `Table "${data.definition.table}" is not allowed. Allowed: ${ALLOWED_TABLES.join(", ")}`
          );
        } else if (!IDENTIFIER_RE.test(data.definition.table)) {
          errors.push(`Table name "${data.definition.table}" contains invalid characters`);
        }
      }

      // ADR-004: أسماء الحقول/الفلاتر/الترتيب يجب أن تكون معرّفات صالحة
      const checkIdentifiers = (values: unknown, label: string) => {
        if (values === undefined) return;
        if (!Array.isArray(values)) {
          errors.push(`${label} must be an array`);
          return;
        }
        for (const v of values) {
          if (typeof v !== "string" || !IDENTIFIER_RE.test(v)) {
            errors.push(`${label} contains invalid identifier: "${String(v)}"`);
          }
        }
      };
      checkIdentifiers(data.definition.fields, "fields");
      checkIdentifiers(data.definition.groupBy, "groupBy");
      checkIdentifiers(data.definition.orderBy?.map?.((o: any) => o?.field), "orderBy.field");
      if (data.definition.filters !== undefined) {
        if (typeof data.definition.filters !== "object" || data.definition.filters === null) {
          errors.push("filters must be an object");
        } else {
          for (const key of Object.keys(data.definition.filters)) {
            if (!IDENTIFIER_RE.test(key)) {
              errors.push(`filters contains invalid identifier: "${key}"`);
            }
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * التحقق من صلاحية المستخدم لإنشاء تقرير
   */
  static async validateUserPermission(userId: number, action: "create" | "edit" | "delete" | "execute"): Promise<{
    allowed: boolean;
    reason?: string;
  }> {
    // في النظام الحالي، جميع المستخدمين المصادق عليهم يمكنهم تنفيذ التقارير
    // لكن فقط أدوار admin و hr_manager يمكنهم إنشاء وتعديل وحذف التقارير
    const adminRoles = ["admin", "hr_manager"];
    const executionRoles = ["admin", "hr_manager", "hr_staff", "training_manager", "exec_manager"];

    // في المستقبل، سيتم التحقق من دور المستخدم الفعلي في قاعدة البيانات
    // حاليًا نفترض أن جميع المستخدمين المصادق عليهم يمكنهم تنفيذ التقارير
    if (action === "execute") {
      return { allowed: true };
    }

    // للإجراءات الأخرى (create, edit, delete)، يتطلب دور admin أو hr_manager
    // هذا سيكون مخصصًا بعد إضافة نظام الأدوار الكامل
    return {
      allowed: false,
      reason: "Insufficient permissions. Admin or HR Manager role required.",
    };
  }

  /**
   * التحقق من صحة معرف التقرير قبل التنفيذ
   */
  static async validateReportDefinitionExists(reportDefinitionId: number): Promise<{
    exists: boolean;
    report?: any;
  }> {
    const report = await prisma.reportDefinition.findUnique({
      where: { id: reportDefinitionId },
      select: {
        id: true,
        name: true,
        type: true,
        isEnabled: true,
        definition: true,
      },
    });

    if (!report) {
      return { exists: false };
    }

    if (!report.isEnabled) {
      return { exists: false, report };
    }

    return { exists: true, report };
  }

  /**
   * تنظيف واستبدال القيم الخطيرة في تعريف التقرير
   */
  static sanitizeDefinition(definition: any): any {
    if (!definition) return definition;

    const cleaned = { ...definition };

    // إزالة حقول SQL الخطيرة إذا وجدت
    if (cleaned.sqlQuery && typeof cleaned.sqlQuery === "string") {
      const dangerousPatterns = ["drop ", "delete ", "update ", "insert ", "truncate ", "alter ", "create "];
      let hasDangerous = false;
      for (const pattern of dangerousPatterns) {
        if (cleaned.sqlQuery.toLowerCase().includes(pattern)) {
          hasDangerous = true;
          break;
        }
      }

      if (hasDangerous) {
        cleaned.sqlQuery = "-- REMOVED: Potentially dangerous SQL";
        cleaned.warning = "SQL query contained potentially dangerous statements and was sanitized";
      }
    }

    return cleaned;
  }
}
