import request from "supertest";
import { createApp } from "../app";
import { prisma } from "../lib/prisma";

/**
 * اختبار تكامل حقيقي لواجهة التقارير.
 *
 * IMPORTANT: هذا الاختبار يتطلب:
 *   1. قاعدة PostgreSQL متاحة عبر DATABASE_URL
 *   2. تطبيق الترحيل migrations/pending/001_create_report_tables.sql
 *
 * ما دام الترحيل "معلّقاً" (لم يُطبَّق بأمر المهمة)، سيفشل هذا الاختبار
 * بخطأ Prisma P2021 (الجدول غير موجود). هذا مقصود: لا نزعم نجاحاً وهمياً.
 */
const REPORT_TEST_USER = "reporttest";
const REPORT_TEST_PASSWORD = "report123";
let app: ReturnType<typeof createApp>;
let authToken: string;

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

  const loginRes = await request(app)
    .post("/api/auth/login")
    .send({ username: REPORT_TEST_USER, password: REPORT_TEST_PASSWORD });

  authToken = loginRes.body.token;
}, 30000);

afterAll(async () => {
  // تنظيف متسامح: لو كان الجدول غير موجود (الترحيل معلّق) لا نُفشل التنظيف
  try {
    await prisma.reportExecution.deleteMany({});
  } catch (_) {}
  try {
    await prisma.reportDefinition.deleteMany({});
  } catch (_) {}
  try {
    await prisma.user.deleteMany({ where: { username: REPORT_TEST_USER } });
  } catch (_) {}
  await prisma.$disconnect();
});

describe("Reports API (integration)", () => {
  it("ينشئ تعريف تقرير ثم يعيده بنفس القيم المخزّنة", async () => {
    const createRes = await request(app)
      .post("/api/reports")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        name: "قائمة الموظفين التجريبية",
        description: "تقرير اختبار تكامل",
        type: "list",
        definition: { table: "persons", fields: ["firstname", "surname"] },
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.id).toEqual(expect.any(Number));
    expect(createRes.body.name).toBe("قائمة الموظفين التجريبية");

    const getRes = await request(app)
      .get(`/api/reports/${createRes.body.id}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.name).toBe("قائمة الموظفين التجريبية");
    expect(getRes.body.definition).toEqual({
      table: "persons",
      fields: ["firstname", "surname"],
    });
  });

  it("ينفّذ التقرير ويسجّل عملية تنفيذ مرتبطة بالمستخدم", async () => {
    const createRes = await request(app)
      .post("/api/reports")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        name: "تقرير تنفيذي",
        type: "list",
        definition: { table: "persons", fields: ["firstname"] },
      });

    const execRes = await request(app)
      .post(`/api/reports/${createRes.body.id}/execute`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({});

    expect(execRes.status).toBe(201);
    expect(execRes.body.executionId).toEqual(expect.any(Number));
    expect(execRes.body.status).toBe("completed");
    // المحرك الحالي stub: نؤكد القيمة الفعلية بدل ادعاء وجود صفوف
    expect(execRes.body.result.rowCount).toBe(0);
    expect(Array.isArray(execRes.body.result.data)).toBe(true);

    const listRes = await request(app)
      .get(`/api/reports/${createRes.body.id}/executions`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.total).toBeGreaterThan(0);
    expect(listRes.body.data[0].executedByUser.username).toBe(REPORT_TEST_USER);
  });

  it("يرفض إنشاء تقرير بتعريف خطير", async () => {
    const res = await request(app)
      .post("/api/reports")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        name: "تقرير ضار",
        type: "list",
        definition: { table: "persons; DROP TABLE users", fields: ["firstname"] },
      });

    expect(res.status).toBe(400);
    expect(Array.isArray(res.body.errors)).toBe(true);
  });
});
