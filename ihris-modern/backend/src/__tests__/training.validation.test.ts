import {
  createCourseSchema,
  createScheduledSchema,
  enrollSchema,
  updateCourseSchema,
  updateEnrollmentSchema,
} from "../services/training.validation";

/**
 * Sprint 6 — اختبارات وحدة لمخططات التحقق (Zod).
 * تحمي من Mass Assignment وتضمن القفل التفاؤلي ومنع القيم غير الصالحة.
 */
describe("Sprint 6 — Training validation (unit)", () => {
  it("1) يرفض الحقول غير المعروفة في إنشاء الدورة", () => {
    const result = createCourseSchema.safeParse({ name: "دورة", isAdmin: true });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors.some((e) => e.code === "unrecognized_keys")).toBe(true);
    }
  });

  it("2) يرفض الاسم الفارغ", () => {
    expect(createCourseSchema.safeParse({ name: "   " }).success).toBe(false);
  });

  it("3) يتطلب version عند تعديل الدورة", () => {
    const result = updateCourseSchema.safeParse({ name: "اسم جديد" });
    expect(result.success).toBe(false);
  });

  it("4) يرفض حالة دورة مجدولة غير معروفة", () => {
    const result = createScheduledSchema.safeParse({
      trainingCourseId: 1,
      status: "archived",
    });
    expect(result.success).toBe(false);
  });

  it("5) يتطلب personId موجباً عند التسجيل", () => {
    expect(enrollSchema.safeParse({ personId: 0 }).success).toBe(false);
    expect(enrollSchema.safeParse({ personId: -3 }).success).toBe(false);
    expect(enrollSchema.safeParse({ personId: 3 }).success).toBe(true);
  });

  it("6) يرفض تحديث تسجيل بلا حقول", () => {
    expect(updateEnrollmentSchema.safeParse({}).success).toBe(false);
    expect(updateEnrollmentSchema.safeParse({ completed: true }).success).toBe(true);
  });
});
