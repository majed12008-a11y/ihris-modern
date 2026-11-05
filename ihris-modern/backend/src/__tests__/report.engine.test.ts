import { prisma } from "../lib/prisma";
import { ReportEngine } from "../services/report.engine";
import { ReportDefinitionError } from "../services/report.whitelist";

/**
 * اختبارات محرك التقارير الحقيقي (ADR-004).
 * تتصل بقاعدة الاختبار ihris_test_gap001 وتتحقق من صفوف فعلية.
 */
const TEST_SURNAME = "محرك-اختبار-001";

let ahmedId: number;
let basherId: number;
let tamerId: number;

beforeAll(async () => {
  await prisma.person.deleteMany({ where: { surname: TEST_SURNAME } });

  const ahmed = await prisma.person.create({
    data: { surname: TEST_SURNAME, firstname: "أحمد", countryId: 1 },
  });
  const basher = await prisma.person.create({
    data: { surname: TEST_SURNAME, firstname: "بشار", countryId: 1 },
  });
  const tamer = await prisma.person.create({
    data: { surname: TEST_SURNAME, firstname: "تامر", countryId: 2 },
  });

  ahmedId = ahmed.id;
  basherId = basher.id;
  tamerId = tamer.id;
});

afterAll(async () => {
  await prisma.person.deleteMany({ where: { surname: TEST_SURNAME } });
  await prisma.$disconnect();
});

describe("ReportEngine — استعلامات حقيقية", () => {
  it("1) يسترجع الصفوف المطابقة بأعمدتها الحقيقية", async () => {
    const result = await ReportEngine.execute({
      table: "people",
      fields: ["id", "firstname", "surname"],
      filters: { surname: TEST_SURNAME },
      orderBy: [{ field: "id", dir: "asc" }],
    });

    expect(result.rowCount).toBe(3);
    expect(result.columns).toEqual(["id", "firstname", "surname"]);
    expect(result.rows[0].id).toBe(ahmedId);
    expect(result.rows[2].id).toBe(tamerId);
    expect(result.sql).toContain('FROM "people"');
    expect(result.sql).toContain('"surname" = $1');
  });

  it("2) يطبّق فلتر مساواة على عمود آخر", async () => {
    const result = await ReportEngine.execute({
      table: "people",
      fields: ["id", "firstname"],
      filters: { surname: TEST_SURNAME, firstname: "بشار" },
    });

    expect(result.rowCount).toBe(1);
    expect(result.rows[0].id).toBe(basherId);
  });

  it("3) يحلّ المعاملات المسماة (named params) بأمان", async () => {
    const result = await ReportEngine.execute({
      table: "people",
      fields: ["id", "firstname"],
      filters: { firstname: ":target" },
      params: { target: "أحمد" },
    });

    expect(result.rowCount).toBeGreaterThanOrEqual(1);
    expect(result.rows[0].id).toBe(ahmedId);
    expect(result.paramCount).toBeGreaterThanOrEqual(1);
  });

  it("4) يدعم معامل in مع قيم متعددة", async () => {
    const result = await ReportEngine.execute({
      table: "people",
      fields: ["id", "firstname"],
      filters: { id: { op: "in", value: [ahmedId, tamerId] } },
      orderBy: [{ field: "id", dir: "asc" }],
    });

    expect(result.rowCount).toBe(2);
    expect(result.rows.map((r) => r.id)).toEqual([ahmedId, tamerId]);
    expect(result.sql).toContain(" IN ($1, $2)");
  });

  it("5) يدعم GROUP BY مع دالة count", async () => {
    const result = await ReportEngine.execute({
      table: "people",
      fields: ["countryId"],
      filters: { surname: TEST_SURNAME },
      groupBy: ["countryId"],
      aggregates: [{ fn: "count", field: "*", as: "total" }],
      orderBy: [{ field: "countryId", dir: "asc" }],
    });

    expect(result.rowCount).toBe(2);
    expect(result.columns).toContain("total");
    const byCountry = Object.fromEntries(result.rows.map((r) => [r.countryId, r.total]));
    expect(byCountry[1]).toBe(2);
    expect(byCountry[2]).toBe(1);
  });

  it("6) يطبّق ORDER BY DESC", async () => {
    const result = await ReportEngine.execute({
      table: "people",
      fields: ["id", "firstname"],
      filters: { surname: TEST_SURNAME },
      orderBy: [{ field: "id", dir: "desc" }],
    });

    expect(result.rows[0].id).toBe(tamerId);
  });

  it("7) يحترم حد الصفوف (limit)", async () => {
    const result = await ReportEngine.execute({
      table: "people",
      fields: ["id"],
      filters: { surname: TEST_SURNAME },
      orderBy: [{ field: "id", dir: "asc" }],
      limit: 2,
    });

    expect(result.rowCount).toBe(2);
    expect(result.truncated).toBe(true);
  });
});

describe("ReportEngine — الرفض الأمني", () => {
  it("8) يرفض جدولاً خارج القائمة البيضاء", async () => {
    await expect(
      ReportEngine.execute({ table: "pg_shadow", fields: ["usename"] })
    ).rejects.toBeInstanceOf(ReportDefinitionError);
  });

  it("9) يرفض الأعمدة الحساسة (password)", async () => {
    await expect(
      ReportEngine.execute({ table: "users", fields: ["id", "password"] })
    ).rejects.toThrow(/عمود حساس/);
  });

  it("10) يرفض حقن المعرّفات في أسماء الأعمدة", async () => {
    await expect(
      ReportEngine.execute({
        table: "people",
        fields: ['id" FROM users; DROP TABLE users; --'],
      })
    ).rejects.toThrow(/غير صالح/);
  });

  it("11) يرفض حقن المعرّفات في مفاتيح الفلاتر", async () => {
    await expect(
      ReportEngine.execute({
        table: "people",
        fields: ["id"],
        filters: { "id = 1 OR 1=1 --": 1 },
      })
    ).rejects.toThrow(/غير صالح/);
  });

  it("12) يرفض الدوال التجميعية غير المسموحة", async () => {
    await expect(
      ReportEngine.execute({
        table: "people",
        fields: ["countryId"],
        groupBy: ["countryId"],
        aggregates: [{ fn: "pg_sleep", field: "id", as: "x" }],
      })
    ).rejects.toThrow(/دالة تجميع غير مسموحة/);
  });
});
