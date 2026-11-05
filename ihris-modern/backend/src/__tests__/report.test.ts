import request from "supertest";
import { createApp } from "../app";
import { prisma } from "../lib/prisma";

/**
 * اختبار تكامل حقيقي لواجهة التقارير + محرك التنفيذ.
 *
 * يتطلب قاعدة `ihris_test_gap001` مع الترحيل المطبَّق.
 * يتحقق من قيم فعلية قادمة من PostgreSQL وليس من mocks.
 */
const REPORT_TEST_USER = "reporttest";
const REPORT_TEST_PASSWORD = "report123";
const TEST_SURNAME = "تكامل-تقرير-001";

let app: ReturnType<typeof createApp>;
let authToken: string;

const binaryParser = (res: any, cb: any) => {
  res.setEncoding("binary");
  let data = "";
  res.on("data", (chunk: string) => (data += chunk));
  res.on("end", () => cb(null, Buffer.from(data, "binary")));
};

beforeAll(async () => {
  app = createApp();

  await prisma.role.upsert({
    where: { name: "admin" },
    update: {},
    create: { name: "admin", displayName: "مسؤول", description: "مسؤول النظام" },
  });

  await prisma.user.upsert({
    where: { username: REPORT_TEST_USER },
    update: {},
    create: {
      username: REPORT_TEST_USER,
      password: await require("../lib/password").hashPassword(REPORT_TEST_PASSWORD),
      firstname: "Report",
      lastname: "Test",
      email: "reporttest@test.com",
      creatorId: 1,
    },
  });

  await prisma.person.deleteMany({ where: { surname: TEST_SURNAME } });
  await prisma.person.createMany({
    data: [
      { surname: TEST_SURNAME, firstname: "سالم", countryId: 1 },
      { surname: TEST_SURNAME, firstname: "نورة", countryId: 1 },
      { surname: TEST_SURNAME, firstname: "فهد", countryId: 2 },
    ],
  });

  const loginRes = await request(app)
    .post("/api/auth/login")
    .send({ username: REPORT_TEST_USER, password: REPORT_TEST_PASSWORD });

  authToken = loginRes.body.token;
}, 30000);

afterAll(async () => {
  try {
    await prisma.reportExecution.deleteMany({});
    await prisma.reportDefinition.deleteMany({});
    await prisma.person.deleteMany({ where: { surname: TEST_SURNAME } });
    await prisma.user.deleteMany({ where: { username: REPORT_TEST_USER } });
  } finally {
    await prisma.$disconnect();
  }
});

const baseDefinition = () => ({
  table: "people",
  fields: ["id", "firstname", "surname"],
  filters: { surname: TEST_SURNAME },
  orderBy: [{ field: "id", dir: "asc" }],
});

describe("Reports API (integration — real DB)", () => {
  it("ينشئ تعريف تقرير ثم يعيده بنفس القيم المخزّنة", async () => {
    const createRes = await request(app)
      .post("/api/reports")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        name: "قائمة الموظفين التجريبية",
        description: "تقرير اختبار تكامل",
        type: "list",
        definition: baseDefinition(),
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.id).toEqual(expect.any(Number));
    expect(createRes.body.name).toBe("قائمة الموظفين التجريبية");

    const getRes = await request(app)
      .get(`/api/reports/${createRes.body.id}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.definition.table).toBe("people");
    expect(getRes.body.definition.fields).toEqual(["id", "firstname", "surname"]);
  });

  it("ينفّذ التقرير ويعيد صفوفاً حقيقية من قاعدة البيانات", async () => {
    const createRes = await request(app)
      .post("/api/reports")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ name: "تقرير تنفيذي", type: "list", definition: baseDefinition() });

    const execRes = await request(app)
      .post(`/api/reports/${createRes.body.id}/execute`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({});

    expect(execRes.status).toBe(201);
    expect(execRes.body.executionId).toEqual(expect.any(Number));
    expect(execRes.body.status).toBe("completed");
    expect(execRes.body.result.rowCount).toBe(3);
    expect(execRes.body.result.columns).toEqual(["id", "firstname", "surname"]);
    expect(execRes.body.result.data.map((r: any) => r.firstname)).toEqual([
      "سالم",
      "نورة",
      "فهد",
    ]);
    expect(execRes.body.result.data[0].surname).toBe(TEST_SURNAME);
    expect(execRes.body.result.sql).toContain('FROM "people"');

    // سجل التنفيذ حُفظ بأسماء المستخدم الفعلية
    const listRes = await request(app)
      .get(`/api/reports/${createRes.body.id}/executions`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.total).toBeGreaterThan(0);
    expect(listRes.body.data[0].executedByUser.username).toBe(REPORT_TEST_USER);
    expect(listRes.body.data[0].rowCount).toBe(3);
  });

  it("يحلّ معاملات وقت التشغيل (runtime params)", async () => {
    const createRes = await request(app)
      .post("/api/reports")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        name: "تقرير بمعامل",
        type: "list",
        definition: {
          table: "people",
          fields: ["id", "firstname"],
          filters: { surname: TEST_SURNAME, firstname: ":name" },
          params: { name: "نورة" },
        },
      });

    expect(createRes.status).toBe(201);

    const execRes = await request(app)
      .post(`/api/reports/${createRes.body.id}/execute`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({ params: { name: "فهد" } });

    expect(execRes.status).toBe(201);
    expect(execRes.body.result.rowCount).toBe(1);
    expect(execRes.body.result.data[0].firstname).toBe("فهد");
  });

  it("يصدّر CSV ببيانات حقيقية", async () => {
    const createRes = await request(app)
      .post("/api/reports")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ name: "تقرير CSV", type: "list", definition: baseDefinition() });

    const res = await request(app)
      .post(`/api/reports/${createRes.body.id}/export?format=csv`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({});

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("text/csv");
    expect(res.headers["x-report-row-count"]).toBe("3");
    expect(res.text).toContain("id,firstname,surname");
    expect(res.text).toContain("سالم");
    expect(res.text).toContain(TEST_SURNAME);
  });

  it("يصدّر PDF صالحاً", async () => {
    const createRes = await request(app)
      .post("/api/reports")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ name: "تقرير PDF", type: "list", definition: baseDefinition() });

    const res = await request(app)
      .post(`/api/reports/${createRes.body.id}/export?format=pdf`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({})
      .buffer(true)
      .parse(binaryParser);

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("application/pdf");
    expect(res.body.subarray(0, 5).toString()).toBe("%PDF-");
    expect(res.body.length).toBeGreaterThan(500);
  });

  it("يرفض إنشاء تقرير بتعريف خطير", async () => {
    const res = await request(app)
      .post("/api/reports")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        name: "تقرير ضار",
        type: "list",
        definition: { table: "people; DROP TABLE users", fields: ["firstname"] },
      });

    expect(res.status).toBe(400);
    expect(Array.isArray(res.body.errors)).toBe(true);
  });

  it("يرفض إنشاء تقرير بجدول خارج القائمة البيضاء", async () => {
    const res = await request(app)
      .post("/api/reports")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        name: "تقرير جدول ممنوع",
        type: "list",
        definition: { table: "pg_shadow", fields: ["usename"] },
      });

    expect(res.status).toBe(400);
    expect(res.body.errors.join(" ")).toContain("not allowed");
  });

  it("يرفض تنفيذ تقرير مُخترَق التعريف (جدول غير مسموح)", async () => {
    const createRes = await request(app)
      .post("/api/reports")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ name: "تقرير سيُخترَق", type: "list", definition: baseDefinition() });

    // تعديل مباشر في قاعدة البيانات لتجاوز تحقق الإنشاء
    await prisma.reportDefinition.update({
      where: { id: createRes.body.id },
      data: { definition: { table: "pg_shadow", fields: ["usename"] } },
    });

    const execRes = await request(app)
      .post(`/api/reports/${createRes.body.id}/execute`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({});

    expect(execRes.status).toBe(400);
    expect(String(execRes.body.error)).toContain("غير مسموح");
  });

  // ---------------- السيناريوهات الأربعة المتبقية من قبول GAP-001 ----------------

  it("يرفض المستخدم غير المخوّل (بلا توكن) بـ401", async () => {
    const res = await request(app)
      .post("/api/reports")
      .send({ name: "بلا توكن", type: "list", definition: baseDefinition() });

    expect(res.status).toBe(401);

    const execRes = await request(app)
      .get("/api/reports")
      .set("Authorization", "Bearer invalid-token");

    expect(execRes.status).toBe(401);
  });

  it("يرفض تعريفاً خاطئاً (اسم مفقود) بـ400 ورسالة واضحة", async () => {
    const res = await request(app)
      .post("/api/reports")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ type: "list", definition: baseDefinition() });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Validation failed");
    expect(res.body.errors.join(" ")).toMatch(/name/i);
  });

  it("يعدّل تعريف تقرير ويعيد الإصدار المحدَّث", async () => {
    const createRes = await request(app)
      .post("/api/reports")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ name: "قبل التعديل", type: "list", definition: baseDefinition() });

    const updateRes = await request(app)
      .put(`/api/reports/${createRes.body.id}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        name: "بعد التعديل",
        type: "table",
        definition: { ...baseDefinition(), fields: ["id", "surname"] },
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.name).toBe("بعد التعديل");
    expect(updateRes.body.type).toBe("table");
    expect(updateRes.body.definition.fields).toEqual(["id", "surname"]);

    const execRes = await request(app)
      .post(`/api/reports/${createRes.body.id}/execute`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({});

    expect(execRes.status).toBe(201);
    expect(execRes.body.result.columns).toEqual(["id", "surname"]);
  });

  it("يحذف تعريف تقرير بأمان (204 ثم يختفي من القائمة)", async () => {
    const createRes = await request(app)
      .post("/api/reports")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ name: "تقرير للحذف", type: "list", definition: baseDefinition() });

    const delRes = await request(app)
      .delete(`/api/reports/${createRes.body.id}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(delRes.status).toBe(204);
    expect(await prisma.reportDefinition.findUnique({ where: { id: createRes.body.id } })).toBeNull();

    const listRes = await request(app)
      .get("/api/reports")
      .set("Authorization", `Bearer ${authToken}`);

    expect(listRes.status).toBe(200);
    const ids = listRes.body.data.map((r: any) => r.id);
    expect(ids).not.toContain(createRes.body.id);
  });
});
