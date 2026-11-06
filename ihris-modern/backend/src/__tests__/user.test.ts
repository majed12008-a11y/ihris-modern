import request from "supertest";
import { createApp } from "../app";
import { prisma } from "../lib/prisma";
import { hashPassword } from "../lib/password";

/**
 * اختبار تكامل حقيقي لـ GAP-002 (تعديل مستخدم) وGAP-003 (حذف/استعادة).
 *
 * يتطلب قاعدة `ihris_test_gap001` مع الترحيل 002 مطبَّقاً.
 * لا توجد أي mocks — كل الطلبات تمر عبر HTTP وتُقرأ النتائج من PostgreSQL.
 */
const PREFIX = "gap2";
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
let target: SeededUser;

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
  const role = await prisma.role.findUnique({ where: { name: roleName } });
  if (!role) throw new Error(`role not found: ${roleName}`);

  const user = await prisma.user.create({
    data: {
      username,
      password: await hashPassword(PASSWORD),
      firstname: "Test",
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
  target = await createUser(`${PREFIX}target`, "hr_staff");
}, 30000);

afterAll(async () => {
  try {
    await cleanup();
  } finally {
    await prisma.$disconnect();
  }
});

describe("GAP-002 — تعديل مستخدم (سيناريوهات القبول)", () => {
  it("1) المستخدم يعدّل بياناته الشخصية → 200 + تحديث + audit", async () => {
    const before = await prisma.user.findUniqueOrThrow({ where: { id: normal.id } });

    const res = await request(app)
      .put(`/api/users/${normal.id}`)
      .set("Authorization", `Bearer ${normal.token}`)
      .send({ version: before.version, firstname: "اسم-معدّل", lastname: "ذاتي" });

    expect(res.status).toBe(200);
    expect(res.body.firstname).toBe("اسم-معدّل");
    expect(res.body.version).toBe(before.version + 1);

    const db = await prisma.user.findUniqueOrThrow({ where: { id: normal.id } });
    expect(db.firstname).toBe("اسم-معدّل");

    const audit = await prisma.userAuditLog.findFirst({
      where: { userId: normal.id, action: "update" },
      orderBy: { id: "desc" },
    });
    expect(audit).not.toBeNull();
    expect(audit!.changedBy).toBe(normal.id);
  });

  it("2) Admin يعدّل بيانات أي مستخدم → 200 + تحديث + audit", async () => {
    const before = await prisma.user.findUniqueOrThrow({ where: { id: target.id } });

    const res = await request(app)
      .put(`/api/users/${target.id}`)
      .set("Authorization", `Bearer ${admin.token}`)
      .send({ version: before.version, email: "edited.by.admin@test.local" });

    expect(res.status).toBe(200);
    expect(res.body.email).toBe("edited.by.admin@test.local");

    const audit = await prisma.userAuditLog.findFirst({
      where: { userId: target.id, action: "update" },
      orderBy: { id: "desc" },
    });
    expect(audit!.changedBy).toBe(admin.id);
  });

  it("3) مستخدم عادي يحاول تعديل آخر → 403 مرفوض", async () => {
    const before = await prisma.user.findUniqueOrThrow({ where: { id: target.id } });

    const res = await request(app)
      .put(`/api/users/${target.id}`)
      .set("Authorization", `Bearer ${normal.token}`)
      .send({ version: before.version, firstname: "اختراق" });

    expect(res.status).toBe(403);
    expect(res.body.error).toContain("حسابك");
  });

  it("4) تعديل ببريد غير صالح → 400 + رسالة واضحة", async () => {
    const before = await prisma.user.findUniqueOrThrow({ where: { id: target.id } });

    const res = await request(app)
      .put(`/api/users/${target.id}`)
      .set("Authorization", `Bearer ${admin.token}`)
      .send({ version: before.version, email: "not-an-email" });

    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body)).toMatch(/بريد|email/i);
  });

  it("5) تعديل بـ version خاطئ → 409 Conflict", async () => {
    const before = await prisma.user.findUniqueOrThrow({ where: { id: target.id } });

    const res = await request(app)
      .put(`/api/users/${target.id}`)
      .set("Authorization", `Bearer ${admin.token}`)
      .send({ version: before.version + 999, firstname: "لن يُكتب" });

    expect(res.status).toBe(409);
    const db = await prisma.user.findUniqueOrThrow({ where: { id: target.id } });
    expect(db.version).toBe(before.version);
    expect(db.firstname).not.toBe("لن يُكتب");
  });
});

describe("GAP-003 — حذف/استعادة مستخدم (سيناريوهات القبول)", () => {
  it("6) Admin يحذف مستخدماً بلا سجلات → 200 + soft delete + audit", async () => {
    const victim = await createUser(`${PREFIX}del1`, "hr_staff");

    const res = await request(app)
      .delete(`/api/users/${victim.id}`)
      .set("Authorization", `Bearer ${admin.token}`)
      .send({ version: 1, reason: "حساب تجريبي لم يعد مطلوباً" });

    expect(res.status).toBe(200);
    expect(res.body.deletedAt).toEqual(expect.any(String));
    expect(res.body.deletedBy).toBe(admin.id);
    expect(res.body.deletionReason).toBe("حساب تجريبي لم يعد مطلوباً");

    const db = await prisma.user.findUniqueOrThrow({ where: { id: victim.id } });
    expect(db.deletedAt).not.toBeNull();

    const audit = await prisma.userAuditLog.findFirst({
      where: { userId: victim.id, action: "delete" },
    });
    expect(audit).not.toBeNull();
    expect(audit!.reason).toBe("حساب تجريبي لم يعد مطلوباً");

    // القائمة العادية تستثنيه
    const list = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${admin.token}`);
    expect(list.status).toBe(200);
    expect(list.body.data.map((u: any) => u.id)).not.toContain(victim.id);
  });

  it("7) Admin يحذف مستخدماً له سجلات مرتبطة → 422 + رسالة واضحة", async () => {
    const related = await createUser(`${PREFIX}related`, "hr_staff");
    await prisma.reportDefinition.create({
      data: {
        name: "تعريف مرتبط بحذف المستخدم",
        definition: { table: "people", fields: ["id"] },
        createdBy: related.id,
      },
    });

    const res = await request(app)
      .delete(`/api/users/${related.id}`)
      .set("Authorization", `Bearer ${admin.token}`)
      .send({ version: 1, reason: "محاولة حذف" });

    expect(res.status).toBe(422);
    expect(res.body.error).toContain("سجل");
    expect(res.body.error).toContain("عطّل");

    const db = await prisma.user.findUniqueOrThrow({ where: { id: related.id } });
    expect(db.deletedAt).toBeNull();
  });

  it("8) المستخدم يحاول حذف نفسه → 403 مرفوض", async () => {
    const res = await request(app)
      .delete(`/api/users/${admin.id}`)
      .set("Authorization", `Bearer ${admin.token}`)
      .send({ version: 1, reason: "حذف ذاتي" });

    expect(res.status).toBe(403);
    expect(res.body.error).toContain("حسابك");
  });

  it("9) مستخدم عادي يحاول حذف آخر → 403 مرفوض", async () => {
    const res = await request(app)
      .delete(`/api/users/${target.id}`)
      .set("Authorization", `Bearer ${normal.token}`)
      .send({ version: 1, reason: "محاولة غير مصرح بها" });

    expect(res.status).toBe(403);
  });

  it("10) Admin يستعيد مستخدماً محذوفاً خلال 30 يوماً → 200 + restoredAt + audit", async () => {
    const victim = await createUser(`${PREFIX}del2`, "hr_staff");

    const del = await request(app)
      .delete(`/api/users/${victim.id}`)
      .set("Authorization", `Bearer ${admin.token}`)
      .send({ version: 1, reason: "حذف مؤقت" });
    expect(del.status).toBe(200);

    const res = await request(app)
      .post(`/api/users/${victim.id}/restore`)
      .set("Authorization", `Bearer ${admin.token}`)
      .send({ version: del.body.version });

    expect(res.status).toBe(200);
    expect(res.body.restoredAt).toEqual(expect.any(String));
    expect(res.body.deletedAt).toBeNull();

    const db = await prisma.user.findUniqueOrThrow({ where: { id: victim.id } });
    expect(db.deletedAt).toBeNull();
    expect(db.restoredAt).not.toBeNull();

    const audit = await prisma.userAuditLog.findFirst({
      where: { userId: victim.id, action: "restore" },
    });
    expect(audit).not.toBeNull();
  });

  it("11) Admin يستعيد مستخدماً بعد أكثر من 30 يوماً → 422", async () => {
    const oldUser = await createUser(`${PREFIX}old`, "hr_staff");
    const fortyDaysAgo = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000);

    const deleted = await prisma.user.update({
      where: { id: oldUser.id },
      data: {
        deletedAt: fortyDaysAgo,
        deletedBy: admin.id,
        deletionReason: "قديم",
        version: { increment: 1 },
      },
    });

    const res = await request(app)
      .post(`/api/users/${oldUser.id}/restore`)
      .set("Authorization", `Bearer ${admin.token}`)
      .send({ version: deleted.version });

    expect(res.status).toBe(422);
    expect(res.body.error).toContain("انتهت فترة الاستعادة");
  });

  it("12) المستخدم المحذوف لا يستطيع تسجيل الدخول → 401", async () => {
    const victim = await createUser(`${PREFIX}del3`, "hr_staff");

    await request(app)
      .delete(`/api/users/${victim.id}`)
      .set("Authorization", `Bearer ${admin.token}`)
      .send({ version: 1, reason: "حذف نهائي تجريبي" });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ username: victim.username, password: PASSWORD });

    expect(res.status).toBe(401);
  });
});
