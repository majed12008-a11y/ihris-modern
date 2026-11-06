import request from "supertest";
import { createApp } from "../app";
import { prisma } from "../lib/prisma";
import { hashPassword } from "../lib/password";

/**
 * Sprint 2.5 — اختبارات تكامل حقيقية (BLK-008 + ADR-005).
 *
 * 6 اختبارات لآلية التعطيل/التفعيل + 5 اختبارات لإبطال JWT عبر tokenVersion.
 * كل الطلبات عبر HTTP على `ihris_test_gap001`؛ لا mocks.
 */
const PREFIX = "gap25";
const PASSWORD = "Passw0rd!";

let app: ReturnType<typeof createApp>;

interface SeededUser {
  id: number;
  username: string;
  token: string;
}

let admin: SeededUser;

async function login(username: string): Promise<string> {
  const res = await request(app)
    .post("/api/auth/login")
    .send({ username, password: PASSWORD });
  if (res.status !== 200) {
    throw new Error(`login failed for ${username}: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body.token;
}

async function createUser(username: string, roleName: string): Promise<SeededUser> {
  const role = await prisma.role.findUniqueOrThrow({ where: { name: roleName } });
  const user = await prisma.user.create({
    data: {
      username,
      password: await hashPassword(PASSWORD),
      firstname: "Sprint25",
      lastname: username,
      email: `${username}@test.local`,
      creatorId: 1,
      access: { create: { roleId: role.id } },
    },
  });
  return { id: user.id, username, token: await login(username) };
}

async function cleanup() {
  const users = await prisma.user.findMany({
    where: { username: { startsWith: PREFIX } },
    select: { id: true },
  });
  const ids = users.map((u) => u.id);
  if (ids.length) {
    await prisma.reportExecution.deleteMany({ where: { executedBy: { in: ids } } });
    await prisma.reportDefinition.deleteMany({ where: { createdBy: { in: ids } } });
    await prisma.userAuditLog.deleteMany({ where: { userId: { in: ids } } });
    await prisma.user.deleteMany({ where: { id: { in: ids } } });
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
}, 30000);

afterAll(async () => {
  try {
    await cleanup();
  } finally {
    await prisma.$disconnect();
  }
});

describe("BLK-008 — تعطيل/تفعيل الحساب (6)", () => {
  it("1) Admin يعطّل مستخدماً → 200 + isActive=false + audit + tokenVersion++", async () => {
    const victim = await createUser(`${PREFIX}d1`, "hr_staff");
    const before = await prisma.user.findUniqueOrThrow({ where: { id: victim.id } });

    const res = await request(app)
      .put(`/api/users/${victim.id}/deactivate`)
      .set("Authorization", `Bearer ${admin.token}`)
      .send({ version: before.version, reason: "إجازة طويلة" });

    expect(res.status).toBe(200);
    expect(res.body.isActive).toBe(false);
    expect(res.body.version).toBe(before.version + 1);

    const db = await prisma.user.findUniqueOrThrow({ where: { id: victim.id } });
    expect(db.isActive).toBe(false);
    expect(db.tokenVersion).toBe(before.tokenVersion + 1);

    const audit = await prisma.userAuditLog.findFirst({
      where: { userId: victim.id, action: "deactivate" },
      orderBy: { id: "desc" },
    });
    expect(audit).not.toBeNull();
    expect(audit!.changedBy).toBe(admin.id);
    expect(audit!.reason).toBe("إجازة طويلة");
  });

  it("2) Admin يعيد تفعيل مستخدم → 200 + isActive=true + audit", async () => {
    const victim = await createUser(`${PREFIX}d2`, "hr_staff");
    const deact = await request(app)
      .put(`/api/users/${victim.id}/deactivate`)
      .set("Authorization", `Bearer ${admin.token}`)
      .send({ version: 1 });

    expect(deact.status).toBe(200);

    const res = await request(app)
      .put(`/api/users/${victim.id}/activate`)
      .set("Authorization", `Bearer ${admin.token}`)
      .send({ version: deact.body.version });

    expect(res.status).toBe(200);
    expect(res.body.isActive).toBe(true);

    const audit = await prisma.userAuditLog.findFirst({
      where: { userId: victim.id, action: "activate" },
      orderBy: { id: "desc" },
    });
    expect(audit).not.toBeNull();
  });

  it("3) المستخدم المعطّل يحاول تسجيل الدخول → 401 برسالة معطّل", async () => {
    const victim = await createUser(`${PREFIX}d3`, "hr_staff");
    await request(app)
      .put(`/api/users/${victim.id}/deactivate`)
      .set("Authorization", `Bearer ${admin.token}`)
      .send({ version: 1 });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ username: victim.username, password: PASSWORD });

    expect(res.status).toBe(401);
    expect(res.body.error).toContain("معطّل");
  });

  it("4) مستخدم عادي يحاول تعطيل آخر → 403", async () => {
    const normal = await createUser(`${PREFIX}d4a`, "hr_staff");
    const other = await createUser(`${PREFIX}d4b`, "hr_staff");

    const res = await request(app)
      .put(`/api/users/${other.id}/deactivate`)
      .set("Authorization", `Bearer ${normal.token}`)
      .send({ version: 1 });

    expect(res.status).toBe(403);
    const db = await prisma.user.findUniqueOrThrow({ where: { id: other.id } });
    expect(db.isActive).toBe(true);
  });

  it("5) تعطيل مستخدم له سجلات مرتبطة → 200 (مسموح، بخلاف الحذف)", async () => {
    const owner = await createUser(`${PREFIX}d5`, "hr_staff");
    await prisma.reportDefinition.create({
      data: {
        name: "تعريف مرتبط بالتعطيل",
        definition: { table: "people", fields: ["id"] },
        createdBy: owner.id,
      },
    });

    const res = await request(app)
      .put(`/api/users/${owner.id}/deactivate`)
      .set("Authorization", `Bearer ${admin.token}`)
      .send({ version: 1, reason: "سجلات مرتبطة" });

    expect(res.status).toBe(200);
    expect(res.body.isActive).toBe(false);
  });

  it("6) المستخدم المعطّل يظهر في قائمة المستخدمين مع isActive=false", async () => {
    const victim = await createUser(`${PREFIX}d6`, "hr_staff");
    await request(app)
      .put(`/api/users/${victim.id}/deactivate`)
      .set("Authorization", `Bearer ${admin.token}`)
      .send({ version: 1 });

    const all = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${admin.token}`);
    expect(all.status).toBe(200);
    const row = all.body.data.find((u: any) => u.id === victim.id);
    expect(row).toBeDefined();
    expect(row.isActive).toBe(false);

    const inactive = await request(app)
      .get("/api/users?status=inactive")
      .set("Authorization", `Bearer ${admin.token}`);
    expect(inactive.body.data.map((u: any) => u.id)).toContain(victim.id);

    const active = await request(app)
      .get("/api/users?status=active")
      .set("Authorization", `Bearer ${admin.token}`);
    expect(active.body.data.map((u: any) => u.id)).not.toContain(victim.id);
  });
});

describe("ADR-005 — إبطال JWT عبر tokenVersion (5)", () => {
  it("1) تغيير الدور → الرمز القديم يُرفض", async () => {
    const user = await createUser(`${PREFIX}j1`, "hr_staff");
    const before = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });

    const change = await request(app)
      .put(`/api/users/${user.id}`)
      .set("Authorization", `Bearer ${admin.token}`)
      .send({ version: before.version, role: "hr_manager" });
    expect(change.status).toBe(200);

    const res = await request(app)
      .get(`/api/users/${user.id}`)
      .set("Authorization", `Bearer ${user.token}`);
    expect(res.status).toBe(401);
  });

  it("2) الحذف المنطقي → الرمز القديم يُرفض", async () => {
    const victim = await createUser(`${PREFIX}j2`, "hr_staff");

    const del = await request(app)
      .delete(`/api/users/${victim.id}`)
      .set("Authorization", `Bearer ${admin.token}`)
      .send({ version: 1, reason: "اختبار إبطال الرمز" });
    expect(del.status).toBe(200);

    const res = await request(app)
      .get(`/api/users/${victim.id}`)
      .set("Authorization", `Bearer ${victim.token}`);
    expect(res.status).toBe(401);
  });

  it("3) التعطيل → الرمز القديم يُرفض", async () => {
    const victim = await createUser(`${PREFIX}j3`, "hr_staff");

    const deact = await request(app)
      .put(`/api/users/${victim.id}/deactivate`)
      .set("Authorization", `Bearer ${admin.token}`)
      .send({ version: 1 });
    expect(deact.status).toBe(200);

    const res = await request(app)
      .get(`/api/users/${victim.id}`)
      .set("Authorization", `Bearer ${victim.token}`);
    expect(res.status).toBe(401);
  });

  it("4) الاستعادة → رمز جديد يعمل والقديم يُرفض", async () => {
    const victim = await createUser(`${PREFIX}j4`, "hr_staff");

    const del = await request(app)
      .delete(`/api/users/${victim.id}`)
      .set("Authorization", `Bearer ${admin.token}`)
      .send({ version: 1, reason: "حذف ثم استعادة" });
    expect(del.status).toBe(200);

    const restore = await request(app)
      .post(`/api/users/${victim.id}/restore`)
      .set("Authorization", `Bearer ${admin.token}`)
      .send({ version: del.body.version });
    expect(restore.status).toBe(200);

    const oldTokenRes = await request(app)
      .get(`/api/users/${victim.id}`)
      .set("Authorization", `Bearer ${victim.token}`);
    expect(oldTokenRes.status).toBe(401);

    const newToken = await login(victim.username);
    const newTokenRes = await request(app)
      .get(`/api/users/${victim.id}`)
      .set("Authorization", `Bearer ${newToken}`);
    expect(newTokenRes.status).toBe(200);
  });

  it("5) الرمز الحالي (لم يتغير شيء) يعمل", async () => {
    const user = await createUser(`${PREFIX}j5`, "hr_staff");

    const res = await request(app)
      .get(`/api/users/${user.id}`)
      .set("Authorization", `Bearer ${user.token}`);
    expect(res.status).toBe(200);
  });
});
