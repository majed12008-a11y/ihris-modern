import request from "supertest";
import { createApp } from "../app";
import { prisma } from "../lib/prisma";
import { hashPassword } from "../lib/password";

/**
 * Sprint 6 — 18 سيناريو قبول لوحدة التدريب (ADR-009).
 * 17 هنا + سيناريو التنقّل المجمّع في اختبار الواجهة.
 * تكامل حقيقي على ihris_test_gap001؛ كل اختبار داخل معاملة تُلغى (Sprint 5.5).
 */
const PREFIX = "gap6t";
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
      firstname: "Training",
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

async function createInstitution(token: string, name = unique("Inst")) {
  return request(app)
    .post("/api/training/institutions")
    .set("Authorization", `Bearer ${token}`)
    .send({ name });
}

async function createCourse(token: string, overrides: Record<string, unknown> = {}) {
  return request(app)
    .post("/api/training/courses")
    .set("Authorization", `Bearer ${token}`)
    .send({
      name: unique("Course"),
      topic: "موضوع اختباري",
      trainingCourseStatusId: 15375,
      trainingCourseCategoryId: 15374,
      ...overrides,
    });
}

async function createScheduled(token: string, courseId: number, overrides: Record<string, unknown> = {}) {
  return request(app)
    .post("/api/training/scheduled")
    .set("Authorization", `Bearer ${token}`)
    .send({
      trainingCourseId: courseId,
      site: "قاعة الاختبار",
      numStudents: 10,
      startDate: "2026-01-10",
      endDate: "2026-01-12",
      ...overrides,
    });
}

async function createPerson(label: string) {
  return prisma.person.create({
    data: { surname: unique(label), firstname: "متدرب", countryId: 1 },
  });
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

describe("Sprint 6 — Training Institution (1-4)", () => {
  it("1) ينشئ مؤسسة تدريبية — 201", async () => {
    const name = unique("InstCreate");
    const res = await createInstitution(manager.token, name);

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.name).toBe(name);
    expect(res.body.version).toBe(1);
  });

  it("2) يقرأ المؤسسات (قائمة + بالمعرّف) — 200", async () => {
    const created = await createInstitution(training.token);
    expect(created.status).toBe(201);

    const list = await request(app)
      .get("/api/training/institutions")
      .set("Authorization", `Bearer ${staff.token}`);
    expect(list.status).toBe(200);
    expect(Array.isArray(list.body)).toBe(true);
    expect(list.body.some((i: any) => i.id === created.body.id)).toBe(true);

    const byId = await request(app)
      .get(`/api/training/institutions/${created.body.id}`)
      .set("Authorization", `Bearer ${staff.token}`);
    expect(byId.status).toBe(200);
    expect(byId.body.name).toBe(created.body.name);
  });

  it("3) يعدّل مؤسسة ويرفع الإصدار إلى 2 — 200", async () => {
    const created = await createInstitution(admin.token);
    const newName = `${created.body.name}-معدل`;

    const res = await request(app)
      .put(`/api/training/institutions/${created.body.id}`)
      .set("Authorization", `Bearer ${training.token}`)
      .send({ name: newName, version: 1 });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe(newName);
    expect(res.body.version).toBe(2);
  });

  it("4) يحذف مؤسسة غير مرتبطة — 200 ثم 404", async () => {
    const created = await createInstitution(admin.token);

    const del = await request(app)
      .delete(`/api/training/institutions/${created.body.id}`)
      .set("Authorization", `Bearer ${manager.token}`);
    expect(del.status).toBe(200);
    expect(del.body.success).toBe(true);

    const after = await request(app)
      .get(`/api/training/institutions/${created.body.id}`)
      .set("Authorization", `Bearer ${staff.token}`);
    expect(after.status).toBe(404);
  });
});

describe("Sprint 6 — Training Course (5-10)", () => {
  it("5) ينشئ دورة + سجل تدقيق — 201", async () => {
    const res = await createCourse(manager.token);

    expect(res.status).toBe(201);
    expect(res.body.version).toBe(1);

    const audit = await prisma.trainingAuditLog.findFirst({
      where: { entityType: "course", entityId: res.body.id, action: "create" },
    });
    expect(audit).not.toBeNull();
    expect(audit!.changedBy).toBe(manager.id);
  });

  it("6) يعدّل دورة ويرفع الإصدار — 200 + version 2", async () => {
    const created = await createCourse(manager.token);
    const newName = `${created.body.name}-معدل`;

    const res = await request(app)
      .put(`/api/training/courses/${created.body.id}`)
      .set("Authorization", `Bearer ${training.token}`)
      .send({ name: newName, version: 1 });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe(newName);
    expect(res.body.version).toBe(2);

    const audit = await prisma.trainingAuditLog.findFirst({
      where: { entityType: "course", entityId: created.body.id, action: "update" },
    });
    expect(audit).not.toBeNull();
  });

  it("7) يحذف دورة بلا دورات مجدولة — 200 (soft delete)", async () => {
    const created = await createCourse(admin.token);

    const del = await request(app)
      .delete(`/api/training/courses/${created.body.id}`)
      .set("Authorization", `Bearer ${admin.token}`);
    expect(del.status).toBe(200);
    expect(del.body.softDeleted).toBe(true);

    const after = await request(app)
      .get(`/api/training/courses/${created.body.id}`)
      .set("Authorization", `Bearer ${staff.token}`);
    expect(after.status).toBe(404);
  });

  it("8) يحذف دورة لها دورة مجدولة — 422", async () => {
    const course = await createCourse(admin.token);
    const scheduled = await createScheduled(admin.token, course.body.id);
    expect(scheduled.status).toBe(201);

    const del = await request(app)
      .delete(`/api/training/courses/${course.body.id}`)
      .set("Authorization", `Bearer ${admin.token}`);
    expect(del.status).toBe(422);
    expect(del.body.details?.scheduledCourses).toBe(1);
  });

  it("9) hr_staff يحاول إنشاء دورة — 403", async () => {
    const res = await createCourse(staff.token);
    expect(res.status).toBe(403);
  });

  it("10) حذف مؤسسة تستخدمها دورة — 422 (cascade guard)", async () => {
    const institution = await createInstitution(admin.token);
    const course = await createCourse(admin.token, {
      trainingInstitutionId: institution.body.id,
    });
    expect(course.status).toBe(201);

    const del = await request(app)
      .delete(`/api/training/institutions/${institution.body.id}`)
      .set("Authorization", `Bearer ${admin.token}`);
    expect(del.status).toBe(422);
    expect(del.body.details?.courses).toBeGreaterThanOrEqual(1);
  });
});

describe("Sprint 6 — Scheduled Course + Enrollment (11-15)", () => {
  it("11) ينشئ دورة مجدولة — 201 + audit", async () => {
    const course = await createCourse(manager.token);
    const res = await createScheduled(training.token, course.body.id);

    expect(res.status).toBe(201);
    expect(res.body.status).toBe("scheduled");
    expect(res.body.version).toBe(1);

    const audit = await prisma.trainingAuditLog.findFirst({
      where: { entityType: "scheduled_course", entityId: res.body.id, action: "create" },
    });
    expect(audit).not.toBeNull();
  });

  it("12) يعدّل الحالة scheduled → completed — 200", async () => {
    const course = await createCourse(manager.token);
    const scheduled = await createScheduled(manager.token, course.body.id);

    const res = await request(app)
      .put(`/api/training/scheduled/${scheduled.body.id}`)
      .set("Authorization", `Bearer ${training.token}`)
      .send({ status: "completed", version: 1 });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("completed");
    expect(res.body.version).toBe(2);
  });

  it("13) يسجّل متدرباً — 201 + audit", async () => {
    const course = await createCourse(manager.token);
    const scheduled = await createScheduled(manager.token, course.body.id);
    const person = await createPerson("Enroll");

    const res = await request(app)
      .post(`/api/training/scheduled/${scheduled.body.id}/enroll`)
      .set("Authorization", `Bearer ${training.token}`)
      .send({ personId: person.id });

    expect(res.status).toBe(201);
    expect(res.body.completed).toBe(false);

    const audit = await prisma.trainingAuditLog.findFirst({
      where: { entityType: "enrollment", entityId: res.body.id, action: "create" },
    });
    expect(audit).not.toBeNull();
  });

  it("14) يعرض متدربي الدورة — 200 + قائمة", async () => {
    const course = await createCourse(manager.token);
    const scheduled = await createScheduled(manager.token, course.body.id);
    const person = await createPerson("List");
    await request(app)
      .post(`/api/training/scheduled/${scheduled.body.id}/enroll`)
      .set("Authorization", `Bearer ${manager.token}`)
      .send({ personId: person.id });

    const res = await request(app)
      .get(`/api/training/scheduled/${scheduled.body.id}/enrollments`)
      .set("Authorization", `Bearer ${staff.token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].person.id).toBe(person.id);
  });

  it("15) يحذف دورة مجدولة بها متدربون — 422", async () => {
    const course = await createCourse(manager.token);
    const scheduled = await createScheduled(manager.token, course.body.id);
    const person = await createPerson("Del");
    await request(app)
      .post(`/api/training/scheduled/${scheduled.body.id}/enroll`)
      .set("Authorization", `Bearer ${manager.token}`)
      .send({ personId: person.id });

    const del = await request(app)
      .delete(`/api/training/scheduled/${scheduled.body.id}`)
      .set("Authorization", `Bearer ${admin.token}`);
    expect(del.status).toBe(422);
    expect(del.body.details?.enrollments).toBe(1);
  });
});

describe("Sprint 6 — Tech debt (16-17)", () => {
  it("16) ينشئ منصباً بمصدر راتب (sourceId FK) — 201", async () => {
    const sources = await request(app)
      .get("/api/reference/salary-sources")
      .set("Authorization", `Bearer ${staff.token}`);
    expect(sources.status).toBe(200);
    const sourceId = sources.body.data[0].id;

    const res = await request(app)
      .post("/api/positions")
      .set("Authorization", `Bearer ${manager.token}`)
      .send({ title: unique("Position"), sourceId });

    expect(res.status).toBe(201);
    expect(res.body.sourceId).toBe(sourceId);
  });

  it("17) حذف salary_source مستخدم في position — 422", async () => {
    const sources = await request(app)
      .get("/api/reference/salary-sources")
      .set("Authorization", `Bearer ${staff.token}`);
    const sourceId = sources.body.data[0].id;

    await request(app)
      .post("/api/positions")
      .set("Authorization", `Bearer ${manager.token}`)
      .send({ title: unique("PositionUsed"), sourceId });

    const del = await request(app)
      .delete(`/api/reference/salary-sources/${sourceId}`)
      .set("Authorization", `Bearer ${admin.token}`);

    expect(del.status).toBe(422);
    expect(del.body.details?.مناصب ?? del.body.details?.positions).toBeGreaterThanOrEqual(1);
  });
});
