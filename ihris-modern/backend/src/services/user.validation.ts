import { z } from "zod";

/**
 * مخططات تحقق صارمة لمسارات المستخدمين.
 * `.strict()` يرفض أي حقل غير معروف (حماية من Mass Assignment)،
 * بما في ذلك محاولة تعديل deletedAt / deletedBy / deletionReason / restoredAt.
 */

const email = z
  .string()
  .trim()
  .min(1, "البريد الإلكتروني مطلوب")
  .max(255, "البريد الإلكتروني طويل جداً")
  .email("صيغة البريد الإلكتروني غير صحيحة");

const name = (label: string) =>
  z.string().trim().min(1, `${label} مطلوب`).max(255, `${label} طويل جداً`);

const version = z
  .number({ invalid_type_error: "قيمة version يجب أن تكون رقماً" })
  .int("قيمة version يجب أن تكون عدداً صحيحاً")
  .positive("قيمة version يجب أن تكون أكبر من صفر");

const role = z.string().trim().min(1, "الدور مطلوب").max(50, "اسم الدور طويل جداً");

export const createUserSchema = z
  .object({
    username: z
      .string()
      .trim()
      .min(1, "اسم المستخدم مطلوب")
      .max(30, "اسم المستخدم يجب ألا يتجاوز 30 حرفاً")
      .regex(/^[A-Za-z0-9._-]+$/, "اسم المستخدم يحتوي على أحرف غير مسموحة"),
    password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل").max(255),
    firstname: name("الاسم الأول"),
    lastname: name("اسم العائلة"),
    email,
    role,
  })
  .strict();

export const updateUserSchema = z
  .object({
    version,
    firstname: name("الاسم الأول").optional(),
    lastname: name("اسم العائلة").optional(),
    email: email.optional(),
    role: role.optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).some((key) => key !== "version"), {
    message: "لا توجد حقول للتعديل",
  });

export const deleteUserSchema = z
  .object({
    version,
    reason: z
      .string()
      .trim()
      .min(1, "سبب الحذف مطلوب")
      .max(500, "سبب الحذف يجب ألا يتجاوز 500 حرف"),
  })
  .strict();

export const restoreUserSchema = z
  .object({
    version,
  })
  .strict();

/** BLK-008: تعطيل الحساب — السبب اختياري */
export const deactivateUserSchema = z
  .object({
    version,
    reason: z
      .string()
      .trim()
      .max(500, "سبب التعطيل يجب ألا يتجاوز 500 حرف")
      .optional(),
  })
  .strict();

/** BLK-008: إعادة تفعيل الحساب */
export const activateUserSchema = z
  .object({
    version,
  })
  .strict();

export const updateRoleSchema = z
  .object({
    role,
    version,
  })
  .strict();

export function formatZodErrors(error: z.ZodError): string[] {
  return error.errors.map((issue) => {
    if (issue.code === "unrecognized_keys") {
      return `حقل غير مسموح: ${issue.keys.join(", ")}`;
    }
    const path = issue.path.length ? `${issue.path.join(".")}: ` : "";
    return `${path}${issue.message}`;
  });
}
