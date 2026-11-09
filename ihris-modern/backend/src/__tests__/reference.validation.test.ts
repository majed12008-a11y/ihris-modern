import {
  createCadreSchema,
  createClassificationSchema,
  createPositionTypeSchema,
  createSalaryGradeSchema,
  createSalarySourceSchema,
  formatReferenceZodErrors,
  idParamSchema,
  updateCadreSchema,
  updateSalaryGradeSchema,
} from "../services/referenceData.validation";

/**
 * Sprint 5 — اختبارات وحدة لمخططات التحقق (Zod).
 * لا تلمس قاعدة البيانات.
 */
describe("Sprint 5 — تحقق البيانات المرجعية", () => {
  it("يقبل إنشاء درجة راتب بالحد الأدنى المطلوب", () => {
    const parsed = createSalaryGradeSchema.safeParse({ name: "Entry-Level" });
    expect(parsed.success).toBe(true);
  });

  it("يرفض الاسم الفارغ", () => {
    const parsed = createSalaryGradeSchema.safeParse({ name: "   " });
    expect(parsed.success).toBe(false);
  });

  it("يرفض الاسم الأطول من 100 حرف", () => {
    const parsed = createCadreSchema.safeParse({ name: "x".repeat(101) });
    expect(parsed.success).toBe(false);
  });

  it("يقبل code = null والحقول الاختيارية", () => {
    const parsed = createClassificationSchema.safeParse({
      name: "Nurse",
      code: null,
      description: null,
    });
    expect(parsed.success).toBe(true);
  });

  it("يرفض الحقول غير المعروفة (Mass Assignment)", () => {
    const parsed = createPositionTypeSchema.safeParse({
      name: "Permanent",
      id: 5,
      version: 3,
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      const messages = formatReferenceZodErrors(parsed.error);
      expect(messages.some((m) => m.includes("حقل غير مسموح"))).toBe(true);
    }
  });

  it("يرفض تعديلاً بلا version", () => {
    const parsed = updateCadreSchema.safeParse({ name: "Updated" });
    expect(parsed.success).toBe(false);
  });

  it("يرفض تعديلاً بلا أي حقل غير version", () => {
    const parsed = updateSalaryGradeSchema.safeParse({ version: 1 });
    expect(parsed.success).toBe(false);
  });

  it("يقبل تعديلاً صحيحاً بـversion = 2", () => {
    const parsed = updateSalaryGradeSchema.safeParse({
      version: 2,
      name: "Professional",
      notes: "تحديث",
    });
    expect(parsed.success).toBe(true);
  });

  it("يرفض version غير صحيح (صفر أو كسري أو نص)", () => {
    expect(updateCadreSchema.safeParse({ version: 0, name: "X" }).success).toBe(false);
    expect(updateCadreSchema.safeParse({ version: 1.5, name: "X" }).success).toBe(false);
    expect(updateCadreSchema.safeParse({ version: "1", name: "X" }).success).toBe(false);
  });

  it("يقبل مصادر الرواتب بالحقول المشتركة فقط", () => {
    const parsed = createSalarySourceSchema.safeParse({
      name: "Ministry of Health",
      code: "SRC-MOH",
      description: "وزارة الصحة",
    });
    expect(parsed.success).toBe(true);
  });

  it("يرفض معرّفاً غير موجب", () => {
    expect(idParamSchema.safeParse(0).success).toBe(false);
    expect(idParamSchema.safeParse(-3).success).toBe(false);
    expect(idParamSchema.safeParse(12).success).toBe(true);
  });

  it("يرفض حقول درجات الرواتب الأطول من 255 حرفاً", () => {
    const parsed = createSalaryGradeSchema.safeParse({
      name: "Grade",
      startSalary: "1".repeat(256),
    });
    expect(parsed.success).toBe(false);
  });
});
