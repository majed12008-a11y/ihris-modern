import request from "supertest";
import { createApp } from "../app";
import { prisma } from "../lib/prisma";
import { hashPassword } from "../lib/password";

/**
 * Sprint 6 — 10 اختبارات أمان لوحدة التدريب (ADR-009).
 * Mass assignment / IDOR / SQLi / XSS / version / auth / RBAC / linked delete /
 * enrollment after completion.
 */
const PREFIX = "gap6s";
const PASSWORD = "Passw0rd!";

let app: ReturnType<typeof createApp>;

interface SeededUser {
  id: number;
  username: string;
  token: string;
}

let admin: SeededUser;
let manager: SeededUser;
let training: SeededUser;
let staff: SeededUser;

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
      firstname: "Sec",
      lastname: username,
      email: `${username}@test.local`,
      creatorId: 1,
      access: { create: { roleId: role.id } },
    },
  });
  return { id: user.id, username, token: await login(username) };
}

function unique(prefix: string) {
  return `${PREFIX}-${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

async function makeCourse(token: string) {
  const res = await request(app)
    .post("/api/training/courses")
    .set("Authorization", `Bearer ${token}`)
    .send({ name: unique("Course"), trainingCourseStatusId: 15375 });
  expect(res.status).toBe(201);
  return res.body;
}

async function makeScheduled(token: string, courseId: number) {
  const res = await request(app)
    .post("/api/training/scheduled")
    .set("Authorization", `Bearer ${token}`)
    .send({ trainingCourseId: courseId, site: "قاعة" });
  expect(res.status).toBe(201);
  return res.body;
}

beforeAll(async () => {
  app = createApp();

  for (const [name, displayName] of [
    ["admin", "مدير النظام"],
    ["hr_manager", "مدير الموارد البشرية"],
    ["hr_staff", "موظف الموارد البشرية"],
    ["training_manager", "مدير التدريب"],
  ]) {
    await prisma.role.upsert({ where: { name }, update: {}, create: { name, displayName } });
  }

  admin = await createUser(`${PREFIX}admin`, "admin");
  manager = await createUser(`${PREFIX}manager`, "hr_manager");
  training = await createUser(`${PREFIX}training`, "training_manager");
  staff = await createUser(`${PREFIX}staff`, "hr_staff");
}, 60000);

afterAll(async () => {
  try {
    const users = await prisma.user.findMany({
      where: { username: { startsWith: PREFIX } },
      select: { id: true },
    });
    const ids = users.map((u) => u.id);
    if (ids.length) {
      await prisma.userAuditLog.deleteMany({ where: { userId: { in: ids } } });
      await prisma.user.deleteMany({ where: { id: { in: ids } } });
    }
    await prisma.person.deleteMany({ where: { surname: { startsWith: PREFIX } } });
  } finally {
    await prisma.$disconnect();
  }
});

describe("Sprint 6 — Security (10)", () => {
  it("1) Mass assignment على الدورة — 400", async () => {
    const res = await request(app)
      .post("/api/training/courses")
      .set("Authorization", `Bearer ${manager.token}`)
      .send({ name: unique("Mass"), version: 999, deletedAt: "2020-01-01" });

    expect(res.status).toBe(400);
    expect(res.body.errors.join(" ")).toContain("حقل غير مسموح");
  });

  it("2) Mass assignment على المؤسسة — 400", async () => {
    const res = await request(app)
      .post("/api/training/institutions")
      .set("Authorization", `Bearer ${manager.token}`)
      .send({ name: unique("InstMass"), id: 1 });

    expect(res.status).toBe(400);
    expect(res.body.errors.join(" ")).toContain("حقل غير مسموح");
  });

  it("3) IDOR على التسجيل: hr_staff يعدّل تسجيل غيره — 403", async () => {
    const course = await makeCourse(manager.token);
    const scheduled = await makeScheduled(manager.token, course.id);
    const person = await prisma.person.create({
      data: { surname: unique("Idor"), firstname: "متدرب", countryId: 1 },
    });
    const enrollment = await request(app)
      .post(`/api/training/scheduled/${scheduled.id}/enroll`)
      .set("Authorization", `Bearer ${manager.token}`)
      .send({ personId: person.id });
    expect(enrollment.status).toBe(201);

    const res = await request(app)
      .put(`/api/training/enrollments/${enrollment.body.id}`)
      .set("Authorization", `Bearer ${staff.token}`)
      .send({ completed: true });

    expect(res.status).toBe(403);
  });

  it("4) SQL injection في اسم المؤسسة — لا تنفيذ، تخزين حرفي", async () => {
    const payload = "Robert'); DROP TABLE training_institutions;--";
    const res = await request(app)
      .post("/api/training/institutions")
      .set("Authorization", `Bearer ${manager.token}`)
      .send({ name: payload });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe(payload);

    const stillThere = await prisma.trainingInstitution.count();
    expect(stillThere).toBeGreaterThan(0);
  });

  it("5) version خاطئ عند التعديل — 409", async () => {
    const course = await makeCourse(manager.token);

    const res = await request(app)
      .put(`/api/training/courses/${course.id}`)
      .set("Authorization", `Bearer ${manager.token}`)
      .send({ name: `${course.name}-x`, version: 99 });

    expect(res.status).toBe(409);
  });

  it("6) حذف بلا مصادقة — 401", async () => {
    const res = await request(app).delete("/api/training/courses/1");
    expect(res.status).toBe(401);
  });

  it("7) XSS في اسم الدورة — يُخزَّن نصاً حرفياً (React يعرضه آمناً)", async () => {
    const payload = "<script>alert('xss')</script>";
    const res = await request(app)
      .post("/api/training/courses")
      .set("Authorization", `Bearer ${manager.token}`)
      .send({ name: payload });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe(payload);
  });

  it("8) hr_staff CRUD — 403", async () => {
    const create = await request(app)
      .post("/api/training/institutions")
      .set("Authorization", `Bearer ${staff.token}`)
      .send({ name: unique("Denied") });
    expect(create.status).toBe(403);

    const course = await makeCourse(manager.token);
    const update = await request(app)
      .put(`/api/training/courses/${course.id}`)
      .set("Authorization", `Bearer ${staff.token}`)
      .send({ name: `${course.name}-y`, version: 1 });
    expect(update.status).toBe(403);

    const remove = await request(app)
      .delete(`/api/training/courses/${course.id}`)
      .set("Authorization", `Bearer ${staff.token}`);
    expect(remove.status).toBe(403);
  });

  it("9) training_manager CRUD — 201/200", async () => {
    const created = await request(app)
      .post("/api/training/institutions")
      .set("Authorization", `Bearer ${training.token}`)
      .send({ name: unique("TrainingManager") });
    expect(created.status).toBe(201);

    const course = await makeCourse(training.token);
    const updated = await request(app)
      .put(`/api/training/courses/${course.id}`)
      .set("Authorization", `Bearer ${training.token}`)
      .send({ topic: "محدث", version: 1 });
    expect(updated.status).toBe(200);
  });

  it("10) التسجيل بعد إتمام الدورة — 422", async () => {
    const course = await makeCourse(manager.token);
    const scheduled = await makeScheduled(manager.token, course.id);
    await request(app)
      .put(`/api/training/scheduled/${scheduled.id}`)
      .set("Authorization", `Bearer ${manager.token}`)
      .send({ status: "completed", version: 1 });

    const person = await prisma.person.create({
      data: { surname: unique("Late"), firstname: "متدرب", countryId: 1 },
    });
    const res = await request(app)
      .post(`/api/training/scheduled/${scheduled.id}/enroll`)
      .set("Authorization", `Bearer ${manager.token}`)
      .send({ personId: person.id });

    expect(res.status).toBe(422);
  });
});
