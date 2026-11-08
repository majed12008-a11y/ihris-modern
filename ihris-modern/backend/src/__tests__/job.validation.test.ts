import { createJobSchema, updateJobSchema } from "../services/job.validation";

/**
 * Sprint 4 — اختبارات وحدة لمخططات Zod للمسميات الوظيفية (4).
 */
describe("Zod — المسميات الوظيفية", () => {
  it("1) يقبل مسمى كاملاً صحيحاً", () => {
    const parsed = createJobSchema.safeParse({
      title: "مدير موارد بشرية",
      code: "HR-01",
      description: "وصف",
      salaryGradeId: 1,
      cadreId: 2,
      classificationId: 3,
    });
    expect(parsed.success).toBe(true);
  });

  it("2) يرفض عنواناً فارغاً", () => {
    const parsed = createJobSchema.safeParse({ title: "  " });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(JSON.stringify(parsed.error.errors)).toContain("المسمى الوظيفي مطلوب");
    }
  });

  it("3) يرفض الحقول غير المعروفة (Mass Assignment)", () => {
    const parsed = createJobSchema.safeParse({
      title: "مسمى",
      createdAt: "2026-01-01",
      positionsCount: 3,
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.errors[0].code).toBe("unrecognized_keys");
    }
  });

  it("4) التعديل يتطلب version ويرفض جسماً بلا حقول قابلة للتعديل", () => {
    expect(updateJobSchema.safeParse({ title: "جديد" }).success).toBe(false);
    expect(updateJobSchema.safeParse({ version: 1 }).success).toBe(false);
    expect(
      updateJobSchema.safeParse({ version: 1, salaryGradeId: null }).success
    ).toBe(true);
  });
});
