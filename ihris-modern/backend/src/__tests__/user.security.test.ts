import request from "supertest";
import { createApp } from "../app";
import { prisma } from "../lib/prisma";
import { hashPassword } from "../lib/password";

/**
 * اختبارات أمان GAP-002/GAP-003 — API حقيقي على `ihris_test_gap001`.
 * تغطي: تجاوز الصلاحيات، Mass Assignment، IDOR، SQL injection، غياب المصادقة.
 */
const PREFIX = "gap2sec";
const PASSWORD = "Passw0rd!";

let app: ReturnType<typeof createApp>;

interface SeededUser {
  id: number;
  username: string;
  token: string;
}

let admin: SeededUser;
let normal: SeededUser;
let other: SeededUser;

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
    ["hr_staff", "موظف موارد بشرية"],
  ]) {
    await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name, displayName },
    });
  }

  await cleanup();
  admin = await createUser(`${PREFIX}admin`, "admin");
  normal = await createUser(`${PREFIX}user`, "hr_staff");
  other = await createUser(`${PREFIX}other`, "hr_staff");
}, 30000);

afterAll(async () => {
  try {
    await cleanup();
  } finally {
    await prisma.$disconnect();
  }
});

describe("اختبارات الأمان (8 حالات إلزامية + إضافيتان)", () => {
  it("S1) JWT مستخدم عادي على endpoint إداري → 403", async () => {
    const listDeleted = await request(app)
      .get("/api/users/deleted")
      .set("Authorization", `Bearer ${normal.token}`);
    expect(listDeleted.status).toBe(403);

    const del = await request(app)
      .delete(`/api/users/${other.id}`)
      .set("Authorization", `Bearer ${normal.token}`)
      .send({ version: 1, reason: "محاولة" });
    expect(del.status).toBe(403);

    const restore = await request(app)
      .post(`/api/users/${other.id}/restore`)
      .set("Authorization", `Bearer ${normal.token}`)
      .send({ version: 1 });
    expect(restore.status).toBe(403);
  });

  it("S2) محاولة تعديل deletedAt مباشرة من الـ API → 400 مرفوض", async () => {
    const me = await prisma.user.findUniqueOrThrow({ where: { id: normal.id } });

    const res = await request(app)
      .put(`/api/users/${normal.id}`)
      .set("Authorization", `Bearer ${normal.token}`)
      .send({ version: me.version, deletedAt: new Date().toISOString() });

    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body)).toContain("deletedAt");

    const db = await prisma.user.findUniqueOrThrow({ where: { id: normal.id } });
    expect(db.deletedAt).toBeNull();
  });

  it("S3) محاولة تعديل version من الـ API → 409 ولا تُكتب القيمة", async () => {
    const me = await prisma.user.findUniqueOrThrow({ where: { id: normal.id } });

    const res = await request(app)
      .put(`/api/users/${normal.id}`)
      .set("Authorization", `Bearer ${normal.token}`)
      .send({ version: 999, firstname: "اختراق-نسخة" });

    expect(res.status).toBe(409);

    const db = await prisma.user.findUniqueOrThrow({ where: { id: normal.id } });
    expect(db.version).toBe(me.version);
    expect(db.firstname).not.toBe("اختراق-نسخة");
  });

  it("S4) حذف مستخدم بلا auth → 401", async () => {
    const res = await request(app)
      .delete(`/api/users/${other.id}`)
      .send({ version: 1, reason: "بلا مصادقة" });
    expect(res.status).toBe(401);
  });

  it("S5) استعادة بلا auth → 401", async () => {
    const res = await request(app)
      .post(`/api/users/${other.id}/restore`)
      .send({ version: 1 });
    expect(res.status).toBe(401);
  });

  it("S6) SQL injection في deletion_reason → يُخزَّن كنص آمن ولا يدمر الجداول", async () => {
    const victim = await createUser(`${PREFIX}inj`, "hr_staff");
    const payload = `x'; DROP TABLE "users"; --`;

    const res = await request(app)
      .delete(`/api/users/${victim.id}`)
      .set("Authorization", `Bearer ${admin.token}`)
      .send({ version: 1, reason: payload });

    expect(res.status).toBe(200);
    expect(res.body.deletionReason).toBe(payload);

    // الجدول ما زال موجوداً، والقيمة محفوظة حرفياً (parameterized query)
    const db = await prisma.user.findUniqueOrThrow({ where: { id: victim.id } });
    expect(db.deletionReason).toBe(payload);
    expect(await prisma.user.count()).toBeGreaterThan(0);

    const audit = await prisma.userAuditLog.findFirst({
      where: { userId: victim.id, action: "delete" },
    });
    expect(audit!.reason).toBe(payload);
  });

  it("S7) Mass assignment (حقول إضافية) → 400 مرفوض", async () => {
    const me = await prisma.user.findUniqueOrThrow({ where: { id: normal.id } });

    const res = await request(app)
      .put(`/api/users/${normal.id}`)
      .set("Authorization", `Bearer ${normal.token}`)
      .send({
        version: me.version,
        firstname: "مسموح",
        creatorId: admin.id,
        id: 1,
        deletedBy: admin.id,
      });

    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body)).toContain("غير مسموح");

    const db = await prisma.user.findUniqueOrThrow({ where: { id: normal.id } });
    expect(db.creatorId).not.toBe(admin.id);
  });

  it("S8) IDOR: الوصول لمستخدم آخر بصلاحيات عادية → 403", async () => {
    const get = await request(app)
      .get(`/api/users/${other.id}`)
      .set("Authorization", `Bearer ${normal.token}`);
    expect(get.status).toBe(403);

    const me = await prisma.user.findUniqueOrThrow({ where: { id: other.id } });
    const put = await request(app)
      .put(`/api/users/${other.id}`)
      .set("Authorization", `Bearer ${normal.token}`)
      .send({ version: me.version, firstname: "IDOR" });
    expect(put.status).toBe(403);
  });

  it("S9) تصعيد الصلاحيات: مستخدم عادي يرفع دوره إلى admin → 403", async () => {
    const me = await prisma.user.findUniqueOrThrow({ where: { id: normal.id } });

    const res = await request(app)
      .put(`/api/users/${normal.id}`)
      .set("Authorization", `Bearer ${normal.token}`)
      .send({ version: me.version, role: "admin" });

    expect(res.status).toBe(403);
  });

  it("S10) Audit لا يحتوي كلمة المرور أو hashها", async () => {
    const me = await prisma.user.findUniqueOrThrow({ where: { id: normal.id } });

    const res = await request(app)
      .put(`/api/users/${normal.id}`)
      .set("Authorization", `Bearer ${normal.token}`)
      .send({ version: me.version, lastname: "تدقيق" });
    expect(res.status).toBe(200);

    const audits = await prisma.userAuditLog.findMany({
      where: { userId: normal.id, action: "update" },
    });
    const serialized = JSON.stringify(audits);
    expect(serialized).not.toMatch(/password/i);
    expect(serialized).not.toContain("$2a$");
    expect(serialized).not.toContain("$2b$");
  });
});
