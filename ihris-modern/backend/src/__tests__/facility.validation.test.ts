import {
  createFacilitySchema,
  updateFacilitySchema,
  idParamSchema,
  formatFacilityZodErrors,
} from "../services/facility.validation";

/**
 * Sprint 3 — اختبارات وحدة لمخططات Zod (6).
 */
const validCreate = {
  name: "مستشفى السلام",
  facilityTypeId: 1,
  countryId: 1,
  districtId: 2,
  countyId: 3,
  regionId: 4,
};

describe("facility.validation — Zod", () => {
  it("1) يقبل منشأة كاملة صحيحة", () => {
    const result = createFacilitySchema.safeParse(validCreate);
    expect(result.success).toBe(true);
  });

  it("2) يرفض اسماً فارغاً", () => {
    const result = createFacilitySchema.safeParse({ ...validCreate, name: "   " });
    expect(result.success).toBe(false);
  });

  it("3) يرفض غياب أحد حقول الموقع الأربعة (BR-097)", () => {
    for (const key of ["countryId", "districtId", "countyId", "regionId"]) {
      const copy: any = { ...validCreate };
      delete copy[key];
      expect(createFacilitySchema.safeParse(copy).success).toBe(false);
    }
  });

  it("4) يرفض الحقول غير المعروفة (Mass Assignment)", () => {
    const result = createFacilitySchema.safeParse({
      ...validCreate,
      id: 5,
      version: 9,
      deletedAt: null,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = formatFacilityZodErrors(result.error);
      expect(errors.join(" ")).toContain("غير مسموح");
    }
  });

  it("5) التعديل يتطلب version ويرفض جسمًا بلا حقول", () => {
    expect(updateFacilitySchema.safeParse({ version: 1 }).success).toBe(false);
    expect(
      updateFacilitySchema.safeParse({ version: 1, name: "اسم جديد" }).success
    ).toBe(true);
    expect(updateFacilitySchema.safeParse({ name: "بلا نسخة" }).success).toBe(false);
  });

  it("6) معرّف المسار يرفض الصفر والسالب وغير الرقمي", () => {
    expect(idParamSchema.safeParse(0).success).toBe(false);
    expect(idParamSchema.safeParse(-3).success).toBe(false);
    expect(idParamSchema.safeParse(NaN).success).toBe(false);
    expect(idParamSchema.safeParse(12).success).toBe(true);
  });
});
