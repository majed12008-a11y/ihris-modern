import { z } from "zod";

/**
 * ADR-008: مخططات تحقق صارمة للبيانات المرجعية الخمسة.
 * `.strict()` يرفض أي حقل غير معروف (حماية من Mass Assignment).
 *
 * القواعد مشتركة: `name` إلزامي وفريد، `code` اختياري وفريد (case-insensitive)،
 * و`version` إلزامي عند التعديل (قفل تفاؤلي).
 */

const nameField = z
  .string({ invalid_type_error: "الاسم يجب أن يكون نصاً" })
  .trim()
  .min(1, "الاسم مطلوب")
  .max(100, "الاسم يجب ألا يتجاوز 100 حرفاً");

const codeField = z
  .string({ invalid_type_error: "الكود يجب أن يكون نصاً" })
  .trim()
  .min(1, "الكود لا يمكن أن يكون فارغاً")
  .max(50, "الكود يجب ألا يتجاوز 50 حرفاً");

const descriptionField = z
  .string({ invalid_type_error: "الوصف يجب أن يكون نصاً" })
  .trim()
  .max(2000, "الوصف يجب ألا يتجاوز 2000 حرف");

const noteField = z
  .string({ invalid_type_error: "الملاحظات يجب أن تكون نصاً" })
  .trim()
  .max(2000, "الملاحظات يجب ألا تتجاوز 2000 حرف");

const moneyField = (label: string) =>
  z
    .string({ invalid_type_error: `${label} يجب أن يكون نصاً` })
    .trim()
    .max(255, `${label} يجب ألا يتجاوز 255 حرفاً`);

const versionField = z
  .number({ invalid_type_error: "version يجب أن يكون رقماً" })
  .int("version يجب أن يكون عدداً صحيحاً")
  .positive("version يجب أن يكون أكبر من صفر");

/** خرائط مشتركة لبناء مخططات الإنشاء/التعديل لكل كيان. */
const sharedCreateFields = {
  name: nameField,
  code: codeField.nullable().optional(),
  description: descriptionField.nullable().optional(),
};

const sharedUpdateFields = {
  version: versionField,
  name: nameField.optional(),
  code: codeField.nullable().optional(),
  description: descriptionField.nullable().optional(),
};

const requireAtLeastOneField = (data: Record<string, unknown>) =>
  Object.keys(data).some((key) => key !== "version");

// ---------------------------------------------------------------- salary_grades
export const createSalaryGradeSchema = z
  .object({
    ...sharedCreateFields,
    startSalary: moneyField("الحد الأدنى").nullable().optional(),
    endSalary: moneyField("الحد الأعلى").nullable().optional(),
    midpointSalary: moneyField("نقطة الوسط").nullable().optional(),
    notes: noteField.nullable().optional(),
  })
  .strict();

export const updateSalaryGradeSchema = z
  .object({
    ...sharedUpdateFields,
    startSalary: moneyField("الحد الأدنى").nullable().optional(),
    endSalary: moneyField("الحد الأعلى").nullable().optional(),
    midpointSalary: moneyField("نقطة الوسط").nullable().optional(),
    notes: noteField.nullable().optional(),
  })
  .strict()
  .refine(requireAtLeastOneField, { message: "لا توجد حقول للتعديل" });

// ---------------------------------------------------------------- cadres
export const createCadreSchema = z.object({ ...sharedCreateFields }).strict();
export const updateCadreSchema = z
  .object({ ...sharedUpdateFields })
  .strict()
  .refine(requireAtLeastOneField, { message: "لا توجد حقول للتعديل" });

// ---------------------------------------------------------------- classifications
export const createClassificationSchema = z
  .object({ ...sharedCreateFields })
  .strict();
export const updateClassificationSchema = z
  .object({ ...sharedUpdateFields })
  .strict()
  .refine(requireAtLeastOneField, { message: "لا توجد حقول للتعديل" });

// ---------------------------------------------------------------- position_types
export const createPositionTypeSchema = z
  .object({ ...sharedCreateFields })
  .strict();
export const updatePositionTypeSchema = z
  .object({ ...sharedUpdateFields })
  .strict()
  .refine(requireAtLeastOneField, { message: "لا توجد حقول للتعديل" });

// ---------------------------------------------------------------- salary_sources
export const createSalarySourceSchema = z
  .object({ ...sharedCreateFields })
  .strict();
export const updateSalarySourceSchema = z
  .object({ ...sharedUpdateFields })
  .strict()
  .refine(requireAtLeastOneField, { message: "لا توجد حقول للتعديل" });

// ---------------------------------------------------------------- shared
export const idParamSchema = z
  .number({ invalid_type_error: "المعرّف يجب أن يكون رقماً" })
  .int("المعرّف يجب أن يكون عدداً صحيحاً")
  .positive("المعرّف يجب أن يكون أكبر من صفر");

export function formatReferenceZodErrors(error: z.ZodError): string[] {
  return error.errors.map((issue) => {
    if (issue.code === "unrecognized_keys") {
      return `حقل غير مسموح: ${issue.keys.join(", ")}`;
    }
    const path = issue.path.length ? `${issue.path.join(".")}: ` : "";
    return `${path}${issue.message}`;
  });
}
