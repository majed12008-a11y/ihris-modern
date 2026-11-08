import { z } from "zod";

/**
 * ADR-007: مخططات تحقق صارمة للبيانات المرجعية (الدول).
 * `.strict()` يرفض أي حقل غير معروف (حماية من Mass Assignment).
 *
 * لا `iso_code`: النظام القديم لا يوثّق كوداً للدول، والعمود `code` اختياري
 * ومحدود بـ10 أحرف في المخطط الحديث.
 */

const positiveInt = (label: string) =>
  z
    .number({ invalid_type_error: `${label} يجب أن يكون رقماً` })
    .int(`${label} يجب أن يكون عدداً صحيحاً`)
    .positive(`${label} يجب أن يكون أكبر من صفر`);

const name = z
  .string()
  .trim()
  .min(1, "اسم الدولة مطلوب")
  .max(100, "اسم الدولة يجب ألا يتجاوز 100 حرف");

const code = z
  .string()
  .trim()
  .min(1, "كود الدولة لا يمكن أن يكون فارغاً")
  .max(10, "كود الدولة يجب ألا يتجاوز 10 أحرف");

export const createCountrySchema = z
  .object({
    name,
    code: code.nullable().optional(),
  })
  .strict();

export const updateCountrySchema = z
  .object({
    version: positiveInt("version"),
    name: name.optional(),
    code: code.nullable().optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).some((key) => key !== "version"), {
    message: "لا توجد حقول للتعديل",
  });

export const idParamSchema = z
  .number({ invalid_type_error: "المعرّف يجب أن يكون رقماً" })
  .int("المعرّف يجب أن يكون عدداً صحيحاً")
  .positive("المعرّف يجب أن يكون أكبر من صفر");

export function formatCountryZodErrors(error: z.ZodError): string[] {
  return error.errors.map((issue) => {
    if (issue.code === "unrecognized_keys") {
      return `حقل غير مسموح: ${issue.keys.join(", ")}`;
    }
    const path = issue.path.length ? `${issue.path.join(".")}: ` : "";
    return `${path}${issue.message}`;
  });
}
