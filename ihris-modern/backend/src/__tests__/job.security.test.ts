import request from "supertest";
import { createApp } from "../app";
import { prisma } from "../lib/prisma";
import { hashPassword } from "../lib/password";

/**
 * Sprint 4 — اختبارات أمان المسميات الوظيفية (4).
 * تغطي: Mass assignment، تعارض version (409)، 403 للأدوار، حقن SQL في العنوان.
 */
const PREFIX = "gap4js";
const PASSWORD = "Passw0rd!";

let app: ReturnType<typeof createApp>;
let adminToken: string;
let managerToken: string;
let staffToken: string;

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
  const ids = jobs.map((j) => j.id);
  if (ids.length) {
    await prisma.position.deleteMany({ where: { jobId: { in: ids } } });
    await prisma.jobAuditLog.deleteMany({ where: { jobId: { in: ids } } });
    await prisma.job.deleteMany({ where: { id: { in: ids } } });
  }

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

  adminToken = (await createUser(`${PREFIX}admin`, "admin")).token;
  managerToken = (await createUser(`${PREFIX}manager`, "hr_manager")).token;
  staffToken = (await createUser(`${PREFIX}staff`, "hr_staff")).token;
}, 60000);

afterAll(async () => {
  try {
    await cleanup();
  } finally {
    await prisma.$disconnect();
  }
});

describe("أمان المسميات الوظيفية", () => {
  it("S5) Mass assignment عند الإنشاء (id/version) → 400", async () => {
    const res = await request(app)
      .post("/api/jobs")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ title: `${PREFIX}-mass`, id: 999, version: 9 });

    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body)).toContain("حقل غير مسموح");
  });

  it("S6) تعديل بـ version خاطئ → 409 ولا تُكتب القيمة", async () => {
    const created = await request(app)
      .post("/api/jobs")
      .set("Authorization", `Bearer ${managerToken}`)
      .send({ title: `${PREFIX}-version` });
    expect(created.status).toBe(201);

    const res = await request(app)
      .put(`/api/jobs/${created.body.id}`)
      .set("Authorization", `Bearer ${managerToken}`)
      .send({ version: created.body.version + 5, title: `${PREFIX}-hacked` });

    expect(res.status).toBe(409);

    const fresh = await prisma.job.findUniqueOrThrow({
      where: { id: created.body.id },
    });
    expect(fresh.title).toBe(`${PREFIX}-version`);
    expect(fresh.version).toBe(created.body.version);
  });

  it("S7) hr_staff يحاول الحذف → 403", async () => {
    const created = await request(app)
      .post("/api/jobs")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ title: `${PREFIX}-nodeplete` });
    expect(created.status).toBe(201);

    const res = await request(app)
      .delete(`/api/jobs/${created.body.id}`)
      .set("Authorization", `Bearer ${staffToken}`);

    expect(res.status).toBe(403);

    const stillThere = await prisma.job.findUnique({
      where: { id: created.body.id },
    });
    expect(stillThere).not.toBeNull();
  });

  it("S8) حقن SQL في العنوان → نص حرفي والجدول سليم", async () => {
    const injected = `${PREFIX}-x'); DROP TABLE jobs;--`;
    const res = await request(app)
      .post("/api/jobs")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ title: injected });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe(injected);

    // الجدول ما زال قائماً والصف محفوظ كنص
    const count = await prisma.job.count({ where: { title: injected } });
    expect(count).toBe(1);

    const search = await request(app)
      .get("/api/jobs")
      .query({ search: "'; DROP TABLE jobs;--" })
      .set("Authorization", `Bearer ${adminToken}`);
    expect(search.status).toBe(200);
    expect(Array.isArray(search.body.data)).toBe(true);
  });
});
