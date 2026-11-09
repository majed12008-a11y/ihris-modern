import request from "supertest";
import { createApp } from "../app";
import { prisma } from "../lib/prisma";
import { hashPassword } from "../lib/password";

/**
 * Sprint 5 — اختبارات أمان البيانات المرجعية (10).
 * Mass assignment، IDOR، SQL injection، version، 401/403، رفع ملف، XSS،
 * حذف مرتبط (422)، قراءة hr_staff، تعديل hr_staff.
 */
const PREFIX = "gap5rs";
const PASSWORD = "Passw0rd!";

let app: ReturnType<typeof createApp>;
let adminToken: string;
let managerToken: string;
let staffToken: string;

const SLUGS = [
  "salary-grades",
  "cadres",
  "classifications",
  "position-types",
  "salary-sources",
] as const;

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
      firstname: "Sec",
      lastname: username,
      email: `${username}@test.local`,
      creatorId: 1,
      access: { create: { roleId: role.id } },
    },
  });
  return { id: user.id, token: await login(username) };
}

async function cleanup() {
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

async function createSalaryGrade(token: string, name = uniqueName("sg")) {
  const res = await request(app)
    .post("/api/reference/salary-grades")
    .set("Authorization", `Bearer ${token}`)
    .send({ name, code: `${PREFIX.toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}` });
  if (res.status !== 201) throw new Error(`create failed: ${JSON.stringify(res.body)}`);
  return res.body as { id: number; name: string; version: number };
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
  staffToken = (await createUser(`${PREFIX}staff`, "hr_staff")).token;
});

afterAll(async () => {
  await cleanup();
});

describe("Sprint 5 — أمان البيانات المرجعية (10)", () => {
  it("1) Mass assignment على الجداول الخمسة → 400", async () => {
    for (const slug of SLUGS) {
      const res = await request(app)
        .post(`/api/reference/${slug}`)
        .set("Authorization", `Bearer ${managerToken}`)
        .send({
          name: uniqueName(slug),
          version: 99,
          id: 999999,
          role: "admin",
          unexpected: "x",
        });
      expect(res.status).toBe(400);
      expect(res.body.code).toBe("VALIDATION_ERROR");
    }
  });

  it("2) IDOR: قراءة سجل غير موجود → 404، وتعديل سجل غريب بواسطة hr_staff → 403", async () => {
    const missing = await request(app)
      .get("/api/reference/salary-grades/99999999")
      .set("Authorization", `Bearer ${staffToken}`);
    expect(missing.status).toBe(404);

    const grade = await createSalaryGrade(managerToken);
    const idor = await request(app)
      .put(`/api/reference/salary-grades/${grade.id}`)
      .set("Authorization", `Bearer ${staffToken}`)
      .send({ name: `${grade.name}-hack`, version: grade.version });
    expect(idor.status).toBe(403);
  });

  it("3) حقن SQL في الاسم يُعامل كنص ولا يؤثر على الجدول", async () => {
    const malicious = `${PREFIX}-x'; DROP TABLE salary_grades; --`;
    const grade = await createSalaryGrade(managerToken, malicious);

    const check = await prisma.salaryGrade.findUnique({ where: { id: grade.id } });
    expect(check?.name).toBe(malicious);

    const stillThere = await prisma.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables WHERE table_name = 'salary_grades'
      ) AS exists
    `;
    expect(stillThere[0].exists).toBe(true);
  });

  it("4) version خاطئ عند التعديل → 409", async () => {
    const grade = await createSalaryGrade(managerToken);
    const res = await request(app)
      .put(`/api/reference/salary-grades/${grade.id}`)
      .set("Authorization", `Bearer ${managerToken}`)
      .send({ name: `${grade.name}-conflict`, version: 99 });
    expect(res.status).toBe(409);
    expect(res.body.code).toBe("CONFLICT");
  });

  it("5) حذف بلا توثيق → 401", async () => {
    const grade = await createSalaryGrade(managerToken);
    const res = await request(app).delete(`/api/reference/salary-grades/${grade.id}`);
    expect(res.status).toBe(401);
  });

  it("6) رفع ملف إلى endpoint JSON → 400", async () => {
    const res = await request(app)
      .post("/api/reference/cadres")
      .set("Authorization", `Bearer ${managerToken}`)
      .field("name", uniqueName("file"))
      .attach("file", Buffer.from("malicious"), "payload.txt");
    expect(res.status).toBe(400);
  });

  it("7) XSS في الاسم يُخزَّن كنص حرفي (بلا تنفيذ/تحويل)", async () => {
    const payload = `<script>alert('x')</script>`;
    const grade = await createSalaryGrade(managerToken, `${PREFIX}-${payload}`);
    const res = await request(app)
      .get(`/api/reference/salary-grades/${grade.id}`)
      .set("Authorization", `Bearer ${staffToken}`);
    expect(res.status).toBe(200);
    expect(res.body.name).toBe(`${PREFIX}-${payload}`);
  });

  it("8) حذف سجل مرتبط بوظيفة → 422", async () => {
    const grade = await createSalaryGrade(managerToken, `${PREFIX}-linked`);
    const job = await request(app)
      .post("/api/jobs")
      .set("Authorization", `Bearer ${managerToken}`)
      .send({ title: `${PREFIX}-Linked-Job`, salaryGradeId: grade.id });
    expect(job.status).toBe(201);

    const res = await request(app)
      .delete(`/api/reference/salary-grades/${grade.id}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(422);
    expect(res.body.code).toBe("UNPROCESSABLE_ENTITY");
  });

  it("9) hr_staff يقرأ القائمة → 200", async () => {
    const res = await request(app)
      .get("/api/reference/classifications?page=1&limit=20")
      .set("Authorization", `Bearer ${staffToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("10) hr_staff يحاول التعديل → 403", async () => {
    const grade = await createSalaryGrade(managerToken);
    const res = await request(app)
      .put(`/api/reference/salary-grades/${grade.id}`)
      .set("Authorization", `Bearer ${staffToken}`)
      .send({ name: `${grade.name}-nope`, version: grade.version });
    expect(res.status).toBe(403);
  });
});
