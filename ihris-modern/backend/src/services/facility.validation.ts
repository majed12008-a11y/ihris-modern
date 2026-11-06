import { z } from "zod";

/**
 * ADR-006: مخططات تحقق صارمة لمنشآت الرعاية الصحية.
 * `.strict()` يرفض أي حقل غير معروف (حماية من Mass Assignment).
 *
 * BR-097: المنشأة يجب أن يكون لها دولة + محافظة (district) + مديرية (county) + منطقة (region).
 * الحقول الأربعة مطلوبة عند الإنشاء. عند التعديل تُتحقق فقط إذا مُسّ أي منها،
 * حفاظاً على قابلية تعديل البيانات القديمة الناقصة دون كسرها.
 */

const positiveInt = (label: string) =>
  z
    .number({ invalid_type_error: `${label} يجب أن يكون رقماً` })
    .int(`${label} يجب أن يكون عدداً صحيحاً`)
    .positive(`${label} يجب أن يكون أكبر من صفر`);

const name = z
  .string()
  .trim()
  .min(1, "اسم المنشأة مطلوب")
  .max(255, "اسم المنشأة يجب ألا يتجاوز 255 حرفاً");

export const createFacilitySchema = z
  .object({
    name,
    facilityTypeId: positiveInt("نوع المنشأة").nullable().optional(),
    countryId: positiveInt("الدولة"),
    districtId: positiveInt("المحافظة"),
    countyId: positiveInt("المديرية"),
    regionId: positiveInt("المنطقة"),
  })
  .strict();

export const updateFacilitySchema = z
  .object({
    version: positiveInt("version"),
    name: name.optional(),
    facilityTypeId: positiveInt("نوع المنشأة").nullable().optional(),
    countryId: positiveInt("الدولة").optional(),
    districtId: positiveInt("المحافظة").optional(),
    countyId: positiveInt("المديرية").optional(),
    regionId: positiveInt("المنطقة").optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).some((key) => key !== "version"), {
    message: "لا توجد حقول للتعديل",
  });

export const idParamSchema = z
  .number({ invalid_type_error: "المعرّف يجب أن يكون رقماً" })
  .int("المعرّف يجب أن يكون عدداً صحيحاً")
  .positive("المعرّف يجب أن يكون أكبر من صفر");

export function formatFacilityZodErrors(error: z.ZodError): string[] {
  return error.errors.map((issue) => {
    if (issue.code === "unrecognized_keys") {
      return `حقل غير مسموح: ${issue.keys.join(", ")}`;
    }
    const path = issue.path.length ? `${issue.path.join(".")}: ` : "";
    return `${path}${issue.message}`;
  });
}
