import { ReportValidator } from "../services/report.validation.service";

/**
 * اختبارات وحدة حقيقية لمنطق التحقق من تعريفات التقارير.
 * لا تتصل بقاعدة البيانات: تختبر القيم المُعادة فعلياً من الدوال.
 */
describe("ReportValidator.validateDefinition", () => {
  it("يقبل تعريفاً صحيحاً كاملاً", async () => {
    const result = await ReportValidator.validateDefinition({
      name: "قائمة الموظفين",
      type: "list",
      definition: {
        table: "persons",
        fields: ["firstname", "surname"],
        filters: { countryId: 1 },
      },
    });

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
  });

  it("يرفض تعريفاً بلا اسم ويعيد رسالة الخطأ الصحيحة", async () => {
    const result = await ReportValidator.validateDefinition({
      name: "   ",
      type: "list",
      definition: { table: "persons", fields: ["firstname"] },
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Report name is required");
  });

  it("يرفض نوع تقرير غير مسموح", async () => {
    const result = await ReportValidator.validateDefinition({
      name: "تقرير تجريبي",
      type: "sql",
      definition: { table: "persons", fields: ["firstname"] },
    });

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.startsWith("Invalid report type"))).toBe(true);
  });

  it("يرفض تعريفاً يحتوي محاولة حقن SQL", async () => {
    const result = await ReportValidator.validateDefinition({
      name: "تقرير ضار",
      type: "list",
      definition: {
        table: "persons; DROP TABLE users",
        fields: ["firstname"],
      },
    });

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("dangerous SQL keyword"))).toBe(true);
  });

  it("يعيد تحذيراً (لا خطأ) عندما يغيب حقل fields", async () => {
    const result = await ReportValidator.validateDefinition({
      name: "تقرير بلا حقول",
      type: "table",
      definition: { table: "persons" },
    });

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.warnings).toContain("Report definition does not contain fields array");
  });
});

describe("ReportValidator.sanitizeDefinition", () => {
  it("يزيل استعلام SQL الخطير ويضيف تحذيراً", () => {
    const cleaned = ReportValidator.sanitizeDefinition({
      sqlQuery: "SELECT * FROM persons; DELETE FROM users",
      table: "persons",
    });

    expect(cleaned.sqlQuery).toBe("-- REMOVED: Potentially dangerous SQL");
    expect(cleaned.table).toBe("persons");
    expect(typeof cleaned.warning).toBe("string");
    expect(cleaned.warning).toContain("sanitized");
  });

  it("يحافظ على الاستعلام الآمن كما هو", () => {
    const input = { sqlQuery: "SELECT id, firstname FROM persons", table: "persons" };
    const cleaned = ReportValidator.sanitizeDefinition(input);

    expect(cleaned.sqlQuery).toBe(input.sqlQuery);
    expect(cleaned.warning).toBeUndefined();
  });
});
