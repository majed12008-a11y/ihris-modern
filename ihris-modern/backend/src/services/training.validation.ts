import { z } from "zod";

/**
 * ADR-009: مخططات تحقق صارمة لوحدة التدريب.
 * `.strict()` يرفض أي حقل غير معروف (حماية من Mass Assignment).
 */

const nameField = z
  .string({ invalid_type_error: "الاسم يجب أن يكون نصاً" })
  .trim()
  .min(1, "الاسم مطلوب")
  .max(255, "الاسم يجب ألا يتجاوز 255 حرفاً");

const optionalText = (label: string, max = 2000) =>
  z
    .string({ invalid_type_error: `${label} يجب أن يكون نصاً` })
    .trim()
    .max(max, `${label} يجب ألا يتجاوز ${max} حرفاً`)
    .nullable()
    .optional();

const optionalId = z
  .number({ invalid_type_error: "المعرّف يجب أن يكون رقماً" })
  .int("المعرّف يجب أن يكون عدداً صحيحاً")
  .positive("المعرّف يجب أن يكون أكبر من صفر")
  .nullable()
  .optional();

const requiredId = z
  .number({ invalid_type_error: "المعرّف يجب أن يكون رقماً" })
  .int("المعرّف يجب أن يكون عدداً صحيحاً")
  .positive("المعرّف يجب أن يكون أكبر من صفر");

const versionField = z
  .number({ invalid_type_error: "version يجب أن يكون رقماً" })
  .int("version يجب أن يكون عدداً صحيحاً")
  .positive("version يجب أن يكون أكبر من صفر");

const dateField = z
  .string({ invalid_type_error: "التاريخ يجب أن يكون نصاً" })
  .trim()
  .refine((value) => !Number.isNaN(Date.parse(value)), "تاريخ غير صالح")
  .nullable()
  .optional();

const statusField = z.enum(["planning", "scheduled", "completed", "cancelled"], {
  invalid_type_error: "حالة غير معروفة",
});

const atLeastOne = (data: Record<string, unknown>) =>
  Object.keys(data).some((key) => key !== "version");

// ---------------------------------------------------------------- courses
export const createCourseSchema = z
  .object({
    name: nameField,
    topic: optionalText("الموضوع"),
    notes: optionalText("الملاحظات"),
    trainingInstitutionId: optionalId,
    trainingFunder: optionalText("الممول", 255),
    continuingEducationCourse: optionalText("دورة التعليم المستمر", 255),
    trainingCourseStatusId: optionalId,
    trainingCourseCategoryId: optionalId,
    competency: optionalText("الجدارة", 255),
  })
  .strict();

export const updateCourseSchema = z
  .object({
    version: versionField,
    name: nameField.optional(),
    topic: optionalText("الموضوع"),
    notes: optionalText("الملاحظات"),
    trainingInstitutionId: optionalId,
    trainingFunder: optionalText("الممول", 255),
    continuingEducationCourse: optionalText("دورة التعليم المستمر", 255),
    trainingCourseStatusId: optionalId,
    trainingCourseCategoryId: optionalId,
    competency: optionalText("الجدارة", 255),
  })
  .strict()
  .refine(atLeastOne, { message: "لا توجد حقول للتعديل" });

// ---------------------------------------------------------------- institutions
export const createInstitutionSchema = z.object({ name: nameField }).strict();

export const updateInstitutionSchema = z
  .object({
    version: versionField,
    name: nameField.optional(),
  })
  .strict()
  .refine(atLeastOne, { message: "لا توجد حقول للتعديل" });

// ---------------------------------------------------------------- scheduled courses
export const createScheduledSchema = z
  .object({
    trainingCourseId: requiredId,
    site: optionalText("الموقع", 255),
    numStudents: z
      .number({ invalid_type_error: "عدد المتدربين يجب أن يكون رقماً" })
      .int("عدد المتدربين يجب أن يكون عدداً صحيحاً")
      .min(0, "عدد المتدربين لا يمكن أن يكون سالباً")
      .nullable()
      .optional(),
    notes: optionalText("الملاحظات"),
    instructors: optionalText("المدربون", 255),
    startDate: dateField,
    endDate: dateField,
    countryId: optionalId,
    districtId: optionalId,
    countyId: optionalId,
    status: statusField.optional(),
  })
  .strict();

export const updateScheduledSchema = z
  .object({
    version: versionField,
    site: optionalText("الموقع", 255),
    numStudents: z
      .number({ invalid_type_error: "عدد المتدربين يجب أن يكون رقماً" })
      .int("عدد المتدربين يجب أن يكون عدداً صحيحاً")
      .min(0, "عدد المتدربين لا يمكن أن يكون سالباً")
      .nullable()
      .optional(),
    notes: optionalText("الملاحظات"),
    instructors: optionalText("المدربون", 255),
    startDate: dateField,
    endDate: dateField,
    countryId: optionalId,
    districtId: optionalId,
    countyId: optionalId,
    status: statusField.optional(),
  })
  .strict()
  .refine(atLeastOne, { message: "لا توجد حقول للتعديل" });

// ---------------------------------------------------------------- enrollments
export const enrollSchema = z
  .object({
    personId: requiredId,
    notes: optionalText("الملاحظات"),
    isRetraining: z.boolean().optional(),
    trainingCourseEvaluationId: optionalId,
    trainingCourseRequestorId: optionalId,
  })
  .strict();

export const updateEnrollmentSchema = z
  .object({
    completed: z.boolean({ invalid_type_error: "completed يجب أن يكون منطقياً" }).optional(),
    notes: optionalText("الملاحظات"),
    trainingCourseEvaluationId: optionalId,
    trainingCourseRequestorId: optionalId,
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "لا توجد حقول للتعديل",
  });

// ---------------------------------------------------------------- shared
export const idParamSchema = z
  .number({ invalid_type_error: "المعرّف يجب أن يكون رقماً" })
  .int("المعرّف يجب أن يكون عدداً صحيحاً")
  .positive("المعرّف يجب أن يكون أكبر من صفر");

export function formatTrainingZodErrors(error: z.ZodError): string[] {
  return error.errors.map((issue) => {
    if (issue.code === "unrecognized_keys") {
      return `حقل غير مسموح: ${issue.keys.join(", ")}`;
    }
    const path = issue.path.length ? `${issue.path.join(".")}: ` : "";
    return `${path}${issue.message}`;
  });
}
