import {
  createCountrySchema,
  updateCountrySchema,
} from "../services/country.validation";

/**
 * Sprint 4 — اختبارات وحدة لمخططات Zod للدول (4).
 */
describe("Zod — الدول", () => {
  it("1) يقبل دولة صحيحة (name + code)", () => {
    const parsed = createCountrySchema.safeParse({ name: "اليمن", code: "YE" });
    expect(parsed.success).toBe(true);
  });

  it("2) يرفض اسماً فارغاً", () => {
    const parsed = createCountrySchema.safeParse({ name: "   " });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(JSON.stringify(parsed.error.errors)).toContain("اسم الدولة مطلوب");
    }
  });

  it("3) يرفض الحقول غير المعروفة (Mass Assignment)", () => {
    const parsed = createCountrySchema.safeParse({
      name: "اليمن",
      id: 1,
      version: 2,
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.errors[0].code).toBe("unrecognized_keys");
    }
  });

  it("4) التعديل يتطلب version ويرفض جسماً بلا حقول", () => {
    expect(updateCountrySchema.safeParse({ name: "مصر" }).success).toBe(false);
    expect(updateCountrySchema.safeParse({ version: 1 }).success).toBe(false);
    expect(updateCountrySchema.safeParse({ version: 1, name: "مصر" }).success).toBe(
      true
    );
  });
});
