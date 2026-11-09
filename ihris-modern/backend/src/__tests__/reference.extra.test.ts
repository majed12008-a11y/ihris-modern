import request from "supertest";
import { createApp } from "../app";
import { prisma } from "../lib/prisma";
import { hashPassword } from "../lib/password";

/**
 * Sprint 5 — اختبارات تكميلية للبيانات المرجعية (11).
 * الفريدية (409)، البحث، الترقيم، المسار المجهول، صلاحيات الحذف،
 * الحذف المرتبط بمنصب (422)، وسجل التدقيق.
 */
const PREFIX = "gap5rx";
const PASSWORD = "Passw0rd!";

let app: ReturnType<typeof createApp>;
let adminToken: string;
let managerToken: string;

async function login(username: string): Promise<string> {
  const res = await request(app)
    .post("/api/auth/login")
    .send({ username, password: PASSWORD });
  if (res.status !== 200) throw new Error(`login failed: ${username}`);
  return res.body.token;
}

async function createUser(username: string, roleName: string) {
  const role = await prisma.role.findUniqueOrThrow({ where: { name: roleName } });
  const user = await prisma.user.create({
    data: {
      username,
      password: await hashPassword(PASSWORD),
      firstname: "Extra",
      lastname: username,
      email: `${username}@test.local`,
      creatorId: 1,
      access: { create: { roleId: role.id } },
    },
  });
  return { id: user.id, token: await login(username) };
}

async function cleanup() {
  const facilities = await prisma.facility.findMany({
    where: { name: { startsWith: PREFIX } },
    select: { id: true },
  });
  const facilityIds = facilities.map((f) => f.id);
  await prisma.position.deleteMany({
    where: {
      OR: [{ title: { startsWith: PREFIX } }, { facilityId: { in: facilityIds } }],
    },
  });
  await prisma.facility.deleteMany({ where: { id: { in: facilityIds } } });

  const jobs = await prisma.job.findMany({
    where: { title: { startsWith: PREFIX } },
    select: { id: true },
  });
  const jobIds = jobs.map((j) => j.id);
  if (jobIds.length) {
    await prisma.position.deleteMany({ where: { jobId: { in: jobIds } } });
    await prisma.jobAuditLog.deleteMany({ where: { jobId: { in: jobIds } } });
    await prisma.job.deleteMany({ where: { id: { in: jobIds } } });
  }

  const salaryGrades = await prisma.salaryGrade.findMany({
    where: { name: { startsWith: PREFIX } },
    select: { id: true },
  });
  const cadres = await prisma.cadre.findMany({
    where: { name: { startsWith: PREFIX } },
    select: { id: true },
  });
  const classifications = await prisma.classification.findMany({
    where: { name: { startsWith: PREFIX } },
    select: { id: true },
  });
  const positionTypes = await prisma.jobType.findMany({
    where: { name: { startsWith: PREFIX } },
    select: { id: true },
  });
  const salarySources = await prisma.salarySource.findMany({
    where: { name: { startsWith: PREFIX } },
    select: { id: true },
  });

  const ids = [
    ...salaryGrades.map((r) => ({ entityType: "salary_grade", entityId: r.id })),
    ...cadres.map((r) => ({ entityType: "cadre", entityId: r.id })),
    ...classifications.map((r) => ({ entityType: "classification", entityId: r.id })),
    ...positionTypes.map((r) => ({ entityType: "position_type", entityId: r.id })),
    ...salarySources.map((r) => ({ entityType: "salary_source", entityId: r.id })),
  ];
  if (ids.length) {
    await prisma.referenceDataAuditLog.deleteMany({ where: { OR: ids } });
  }

  await prisma.salaryGrade.deleteMany({ where: { name: { startsWith: PREFIX } } });
  await prisma.cadre.deleteMany({ where: { name: { startsWith: PREFIX } } });
  await prisma.classification.deleteMany({ where: { name: { startsWith: PREFIX } } });
  await prisma.jobType.deleteMany({ where: { name: { startsWith: PREFIX } } });
  await prisma.salarySource.deleteMany({ where: { name: { startsWith: PREFIX } } });

  const users = await prisma.user.findMany({
    where: { username: { startsWith: PREFIX } },
    select: { id: true },
  });
  const userIds = users.map((u) => u.id);
  if (userIds.length) {
    await prisma.userAuditLog.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  }
}

function uniqueName(suffix: string) {
  return `${PREFIX}-${suffix}-${Math.random().toString(36).slice(2, 8)}`;
}

async function createSalaryGrade(name = uniqueName("sg"), code?: string) {
  const res = await request(app)
    .post("/api/reference/salary-grades")
    .set("Authorization", `Bearer ${managerToken}`)
    .send({
      name,
      code: code ?? `${PREFIX.toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    });
  if (res.status !== 201) throw new Error(`create failed: ${JSON.stringify(res.body)}`);
  return res.body as { id: number; name: string; code: string; version: number };
}

beforeAll(async () => {
  app = createApp();

  for (const [name, displayName] of [
    ["admin", "مسؤول النظام"],
    ["hr_manager", "مدير الموارد البشرية"],
    ["hr_staff", "موظف موارد بشرية"],
  ]) {
    await prisma.role.upsert({ where: { name }, update: {}, create: { name, displayName } });
  }

  await cleanup();

  adminToken = (await createUser(`${PREFIX}admin`, "admin")).token;
  managerToken = (await createUser(`${PREFIX}manager`, "hr_manager")).token;
});

afterAll(async () => {
  await cleanup();
});

describe("Sprint 5 — اختبارات تكميلية (11)", () => {
  it("1) اسم مكرر (باختلاف حالة الأحرف) → 409", async () => {
    const name = uniqueName("dup");
    await createSalaryGrade(name);
    const res = await request(app)
      .post("/api/reference/salary-grades")
      .set("Authorization", `Bearer ${managerToken}`)
      .send({ name: name.toUpperCase() });
    expect(res.status).toBe(409);
  });

  it("2) كود مكرر → 409", async () => {
    const code = `${PREFIX.toUpperCase()}-DUP`;
    await createSalaryGrade(uniqueName("c1"), code);
    const res = await request(app)
      .post("/api/reference/salary-grades")
      .set("Authorization", `Bearer ${managerToken}`)
      .send({ name: uniqueName("c2"), code: code.toLowerCase() });
    expect(res.status).toBe(409);
  });

  it("3) البحث بالكود يعيد السجل الصحيح", async () => {
    const code = `${PREFIX.toUpperCase()}-SRCH`;
    const grade = await createSalaryGrade(uniqueName("search"), code);
    const res = await request(app)
      .get(`/api/reference/salary-grades?search=${encodeURIComponent(code)}`)
      .set("Authorization", `Bearer ${managerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.map((row: any) => row.id)).toContain(grade.id);
  });

  it("4) الترقيم يحترم limit ويرجع totalPages", async () => {
    await createSalaryGrade(uniqueName("page1"));
    await createSalaryGrade(uniqueName("page2"));
    const res = await request(app)
      .get(`/api/reference/salary-grades?page=1&limit=1&search=${PREFIX}`)
      .set("Authorization", `Bearer ${managerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.limit).toBe(1);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.totalPages).toBeGreaterThanOrEqual(2);
  });

  it("5) نوع بيانات مرجعية غير معروف → 404", async () => {
    const res = await request(app)
      .get("/api/reference/unknown-entities")
      .set("Authorization", `Bearer ${managerToken}`);
    expect(res.status).toBe(404);
  });

  it("6) hr_manager يحاول الحذف → 403 (الحذف لـadmin فقط)", async () => {
    const grade = await createSalaryGrade(uniqueName("delmgr"));
    const res = await request(app)
      .delete(`/api/reference/salary-grades/${grade.id}`)
      .set("Authorization", `Bearer ${managerToken}`);
    expect(res.status).toBe(403);
  });

  it("7) تعديل سجل غير موجود → 404", async () => {
    const res = await request(app)
      .put("/api/reference/cadres/99999999")
      .set("Authorization", `Bearer ${managerToken}`)
      .send({ name: "Ghost", version: 1 });
    expect(res.status).toBe(404);
  });

  it("8) اسم أطول من 100 حرف → 400", async () => {
    const res = await request(app)
      .post("/api/reference/cadres")
      .set("Authorization", `Bearer ${managerToken}`)
      .send({ name: "x".repeat(101) });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("VALIDATION_ERROR");
  });

  it("9) حذف نوع وظيفة مرتبط بمنصب → 422", async () => {
    const positionType = await prisma.jobType.create({
      data: { name: uniqueName("pt"), code: `${PREFIX.toUpperCase()}-PT` },
    });
    const facility = await prisma.facility.create({
      data: { name: uniqueName("facility") },
    });
    const position = await request(app)
      .post("/api/positions")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        title: uniqueName("position"),
        facilityId: facility.id,
        posTypeId: positionType.id,
      });
    expect(position.status).toBe(201);

    const res = await request(app)
      .delete(`/api/reference/position-types/${positionType.id}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(422);
    expect(res.body.details).toMatchObject({ "مناصب": 1 });
  });

  it("10) سجل التدقيق يُكتب عند الإنشاء والتعديل والحذف", async () => {
    const grade = await createSalaryGrade(uniqueName("audit"));
    await request(app)
      .put(`/api/reference/salary-grades/${grade.id}`)
      .set("Authorization", `Bearer ${managerToken}`)
      .send({ name: `${grade.name}-v2`, version: 1 });
    await request(app)
      .delete(`/api/reference/salary-grades/${grade.id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    const logs = await prisma.referenceDataAuditLog.findMany({
      where: { entityType: "salary_grade", entityId: grade.id },
      orderBy: { id: "asc" },
    });
    expect(logs.map((log) => log.action)).toEqual(["create", "update", "delete"]);
    expect(logs[0].newValues).toBeTruthy();
    expect(logs[2].oldValues).toBeTruthy();
  });

  it("11) حقل code المحذوف يعود null", async () => {
    const res = await request(app)
      .post("/api/reference/cadres")
      .set("Authorization", `Bearer ${managerToken}`)
      .send({ name: uniqueName("emptycode") });
    expect(res.status).toBe(201);
    expect(res.body.code).toBeNull();
  });
});
