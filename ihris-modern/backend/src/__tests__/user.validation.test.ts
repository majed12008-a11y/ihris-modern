import {
  createUserSchema,
  deleteUserSchema,
  restoreUserSchema,
  updateUserSchema,
  formatZodErrors,
} from "../services/user.validation";

/** اختبارات وحدة لمخططات التحقق (بلا قاعدة بيانات) */
describe("User validation schemas (unit)", () => {
  it("يقبل تعديلاً صالحاً بحقل واحد + version", () => {
    const parsed = updateUserSchema.safeParse({ version: 1, firstname: "أحمد" });
    expect(parsed.success).toBe(true);
  });

  it("يرفض التعديل بلا version", () => {
    const parsed = updateUserSchema.safeParse({ firstname: "أحمد" });
    expect(parsed.success).toBe(false);
  });

  it("يرفض version غير صحيح", () => {
    expect(updateUserSchema.safeParse({ version: 0, firstname: "أ" }).success).toBe(false);
    expect(updateUserSchema.safeParse({ version: 1.5, firstname: "أ" }).success).toBe(false);
    expect(updateUserSchema.safeParse({ version: "1", firstname: "أ" }).success).toBe(false);
  });

  it("يرفض البريد غير الصالح برسالة عربية", () => {
    const parsed = updateUserSchema.safeParse({ version: 1, email: "bad-email" });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(formatZodErrors(parsed.error).join(" ")).toContain("البريد الإلكتروني");
    }
  });

  it("يرفض الحقول غير المعروفة (mass assignment)", () => {
    const parsed = updateUserSchema.safeParse({
      version: 1,
      firstname: "أ",
      deletedAt: "2026-01-01",
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(formatZodErrors(parsed.error).join(" ")).toContain("غير مسموح");
    }
  });

  it("يرفض تعديلاً بلا أي حقل فعلي", () => {
    expect(updateUserSchema.safeParse({ version: 1 }).success).toBe(false);
  });

  it("يتحقق من سبب الحذف (مطلوب + حد 500)", () => {
    expect(deleteUserSchema.safeParse({ version: 1, reason: "" }).success).toBe(false);
    expect(deleteUserSchema.safeParse({ version: 1, reason: "x".repeat(501) }).success).toBe(false);
    expect(deleteUserSchema.safeParse({ version: 1, reason: "سبب واضح" }).success).toBe(true);
  });

  it("يرفض الحقول الإضافية في الحذف والاستعادة", () => {
    expect(
      deleteUserSchema.safeParse({ version: 1, reason: "سبب", deletedAt: "x" }).success
    ).toBe(false);
    expect(restoreUserSchema.safeParse({ version: 1, extra: true }).success).toBe(false);
    expect(restoreUserSchema.safeParse({ version: 1 }).success).toBe(true);
  });

  it("يتحقق من مخطط الإنشاء (كلمة مرور قصيرة / دور ناقص)", () => {
    const base = {
      username: "user1",
      password: "123",
      firstname: "أ",
      lastname: "ب",
      email: "user1@test.local",
      role: "hr_staff",
    };
    expect(createUserSchema.safeParse(base).success).toBe(false);
    expect(createUserSchema.safeParse({ ...base, password: "123456" }).success).toBe(true);
    expect(createUserSchema.safeParse({ ...base, password: "123456", role: "" }).success).toBe(false);
  });
});
