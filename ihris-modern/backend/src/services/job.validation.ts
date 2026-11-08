import { z } from "zod";

/**
 * ADR-007: مخططات تحقق صارمة للمسميات الوظيفية.
 * `.strict()` يرفض أي حقل غير معروف (حماية من Mass Assignment).
 *
 * `title` إلزامي وفريد تطبيقياً (سيناريو القبول 9)؛ `code` اختياري وغير فريد
 * (لا دليل على UNIQUE في `hippo_job`).
 */

const positiveInt = (label: string) =>
  z
    .number({ invalid_type_error: `${label} يجب أن يكون رقماً` })
    .int(`${label} يجب أن يكون عدداً صحيحاً`)
    .positive(`${label} يجب أن يكون أكبر من صفر`);

const title = z
  .string()
  .trim()
  .min(1, "المسمى الوظيفي مطلوب")
  .max(255, "المسمى الوظيفي يجب ألا يتجاوز 255 حرفاً");

const code = z
  .string()
  .trim()
  .min(1, "كود المسمى لا يمكن أن يكون فارغاً")
  .max(50, "كود المسمى يجب ألا يتجاوز 50 حرفاً");

const description = z
  .string()
  .trim()
  .max(5000, "الوصف يجب ألا يتجاوز 5000 حرف");

export const createJobSchema = z
  .object({
    title,
    code: code.nullable().optional(),
    description: description.nullable().optional(),
    salaryGradeId: positiveInt("درجة الراتب").nullable().optional(),
    cadreId: positiveInt("الفئة الوظيفية").nullable().optional(),
    classificationId: positiveInt("التصنيف الوظيفي").nullable().optional(),
  })
  .strict();

export const updateJobSchema = z
  .object({
    version: positiveInt("version"),
    title: title.optional(),
    code: code.nullable().optional(),
    description: description.nullable().optional(),
    salaryGradeId: positiveInt("درجة الراتب").nullable().optional(),
    cadreId: positiveInt("الفئة الوظيفية").nullable().optional(),
    classificationId: positiveInt("التصنيف الوظيفي").nullable().optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).some((key) => key !== "version"), {
    message: "لا توجد حقول للتعديل",
  });

export const idParamSchema = z
  .number({ invalid_type_error: "المعرّف يجب أن يكون رقماً" })
  .int("المعرّف يجب أن يكون عدداً صحيحاً")
  .positive("المعرّف يجب أن يكون أكبر من صفر");

export function formatJobZodErrors(error: z.ZodError): string[] {
  return error.errors.map((issue) => {
    if (issue.code === "unrecognized_keys") {
      return `حقل غير مسموح: ${issue.keys.join(", ")}`;
    }
    const path = issue.path.length ? `${issue.path.join(".")}: ` : "";
    return `${path}${issue.message}`;
  });
}
