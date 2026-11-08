import request from "supertest";
import { createApp } from "../app";
import { prisma } from "../lib/prisma";
import { hashPassword } from "../lib/password";

/**
 * Sprint 4 — سيناريوهات قبول GAP-M-005/006/007 (6): إدارة المسميات الوظيفية.
 * تكامل حقيقي على `ihris_test_gap001`، بلا mocks.
 */
const PREFIX = "gap4j";
const PASSWORD = "Passw0rd!";

let app: ReturnType<typeof createApp>;

interface SeededUser {
  id: number;
  username: string;
  token: string;
}

let admin: SeededUser;
let manager: SeededUser;
let staff: SeededUser;

let salaryGrade: { id: number; name: string };
let cadre: { id: number; name: string };
let classification: { id: number; name: string };

async function login(username: string): Promise<string> {
  const res = await request(app)
    .post("/api/auth/login")
    .send({ username, password: PASSWORD });
  if (res.status !== 200) throw new Error(`login failed: ${username}`);
  return res.body.token;
}

async function createUser(username: string, roleName: string): Promise<SeededUser> {
  const role = await prisma.role.findUniqueOrThrow({ where: { name: roleName } });
  const user = await prisma.user.create({
    data: {
      username,
      password: await hashPassword(PASSWORD),
      firstname: "Job",
      lastname: username,
      email: `${username}@test.local`,
      creatorId: 1,
      access: { create: { roleId: role.id } },
    },
  });
  return { id: user.id, username, token: await login(username) };
}

function payload(overrides: Record<string, unknown> = {}) {
  return {
    title: `${PREFIX}-Job-${Math.random().toString(36).slice(2, 8)}`,
    code: `J${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    description: "وصف اختباري",
    ...overrides,
  };
}

async function createJob(token: string, overrides: Record<string, unknown> = {}) {
  return request(app)
    .post("/api/jobs")
    .set("Authorization", `Bearer ${token}`)
    .send(payload(overrides));
}

async function cleanup() {
  const jobs = await prisma.job.findMany({
    where: { title: { startsWith: PREFIX } },
    select: { id: true },
  });
  const ids = jobs.map((j) => j.id);

  if (ids.length) {
    await prisma.position.deleteMany({ where: { jobId: { in: ids } } });
    await prisma.jobAuditLog.deleteMany({ where: { jobId: { in: ids } } });
    await prisma.job.deleteMany({ where: { id: { in: ids } } });
  }

  await prisma.salaryGrade.deleteMany({ where: { name: { startsWith: PREFIX } } });
  await prisma.cadre.deleteMany({ where: { name: { startsWith: PREFIX } } });
  await prisma.classification.deleteMany({ where: { name: { startsWith: PREFIX } } });

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

  admin = await createUser(`${PREFIX}admin`, "admin");
  manager = await createUser(`${PREFIX}manager`, "hr_manager");
  staff = await createUser(`${PREFIX}staff`, "hr_staff");

  salaryGrade = await prisma.salaryGrade.create({
    data: { name: `${PREFIX}-SG` },
  });
  cadre = await prisma.cadre.create({ data: { name: `${PREFIX}-Cadre` } });
  classification = await prisma.classification.create({
    data: { name: `${PREFIX}-Class` },
  });
}, 60000);

afterAll(async () => {
  try {
    await cleanup();
  } finally {
    await prisma.$disconnect();
  }
});

describe("GAP-M-005 — إضافة مسمى وظيفي", () => {
  it("7) admin ينشئ مسمى وظيفي → 201 + audit", async () => {
    const res = await createJob(admin.token);

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.version).toBe(1);
    expect(res.body.title).toContain(PREFIX);

    const audit = await prisma.jobAuditLog.findFirst({
      where: { jobId: res.body.id, action: "create" },
    });
    expect(audit).not.toBeNull();
    expect(audit!.changedBy).toBe(admin.id);
  });

  it("8) hr_staff يحاول إنشاء مسمى → 403", async () => {
    const res = await request(app)
      .post("/api/jobs")
      .set("Authorization", `Bearer ${staff.token}`)
      .send(payload());

    expect(res.status).toBe(403);
  });

  it("9) مسمى مكرر → 409", async () => {
    const title = `${PREFIX}-Duplicate`;
    const first = await createJob(admin.token, { title });
    expect(first.status).toBe(201);

    const second = await createJob(admin.token, { title });
    expect(second.status).toBe(409);
    expect(second.body.error).toContain("بنفس الاسم");
  });

  it("10) cascade: salary_grade/cadre/classification تعمل", async () => {
    const grades = await request(app)
      .get("/api/jobs/meta/salary-grades")
      .set("Authorization", `Bearer ${staff.token}`);
    expect(grades.status).toBe(200);
    expect(grades.body.map((g: any) => g.id)).toContain(salaryGrade.id);

    const cadres = await request(app)
      .get("/api/jobs/meta/cadres")
      .set("Authorization", `Bearer ${staff.token}`);
    expect(cadres.status).toBe(200);
    expect(cadres.body.map((c: any) => c.id)).toContain(cadre.id);

    const classes = await request(app)
      .get("/api/jobs/meta/classifications")
      .set("Authorization", `Bearer ${staff.token}`);
    expect(classes.status).toBe(200);
    expect(classes.body.map((c: any) => c.id)).toContain(classification.id);

    const created = await createJob(admin.token, {
      salaryGradeId: salaryGrade.id,
      cadreId: cadre.id,
      classificationId: classification.id,
    });
    expect(created.status).toBe(201);
    expect(created.body.salaryGrade.name).toBe(salaryGrade.name);
    expect(created.body.cadre.name).toBe(cadre.name);
    expect(created.body.classification.name).toBe(classification.name);
  });
});

describe("GAP-M-006 — تعديل مسمى وظيفي", () => {
  it("11) admin يعدّل مسمى → 200 + audit + version+1", async () => {
    const created = await createJob(admin.token);
    expect(created.status).toBe(201);

    const newTitle = `${PREFIX}-Renamed-${Math.random().toString(36).slice(2, 6)}`;
    const res = await request(app)
      .put(`/api/jobs/${created.body.id}`)
      .set("Authorization", `Bearer ${admin.token}`)
      .send({ version: created.body.version, title: newTitle });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe(newTitle);
    expect(res.body.version).toBe(created.body.version + 1);

    const audit = await prisma.jobAuditLog.findFirst({
      where: { jobId: created.body.id, action: "update" },
    });
    expect(audit).not.toBeNull();
    expect(audit!.changedBy).toBe(admin.id);
  });
});

describe("GAP-M-007 — حذف مسمى وظيفي", () => {
  it("12) admin يحذف مسمى بلا مراجع → 200", async () => {
    const created = await createJob(admin.token);
    expect(created.status).toBe(201);

    const res = await request(app)
      .delete(`/api/jobs/${created.body.id}`)
      .set("Authorization", `Bearer ${admin.token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const gone = await prisma.job.findUnique({ where: { id: created.body.id } });
    expect(gone).toBeNull();

    const audit = await prisma.jobAuditLog.findFirst({
      where: { jobId: created.body.id, action: "delete" },
    });
    expect(audit).not.toBeNull();
  });
});
