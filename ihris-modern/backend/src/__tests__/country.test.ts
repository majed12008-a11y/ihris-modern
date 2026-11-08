import request from "supertest";
import { createApp } from "../app";
import { prisma } from "../lib/prisma";
import { hashPassword } from "../lib/password";

/**
 * Sprint 4 — سيناريوهات قبول GAP-M-008/009/010 (6): إدارة الدول.
 * تكامل حقيقي على `ihris_test_gap001`، بلا mocks.
 */
const PREFIX = "gap4c";
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
      firstname: "Country",
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
    name: `${PREFIX}-${Math.random().toString(36).slice(2, 8)}`,
    code: `C${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    ...overrides,
  };
}

async function createCountry(token: string, overrides: Record<string, unknown> = {}) {
  return request(app)
    .post("/api/countries")
    .set("Authorization", `Bearer ${token}`)
    .send(payload(overrides));
}

async function cleanup() {
  const countries = await prisma.country.findMany({
    where: { name: { startsWith: PREFIX } },
    select: { id: true },
  });
  const ids = countries.map((c) => c.id);

  if (ids.length) {
    await prisma.person.deleteMany({ where: { countryId: { in: ids } } });
    await prisma.facility.deleteMany({ where: { countryId: { in: ids } } });
    await prisma.district.deleteMany({ where: { countryId: { in: ids } } });
    await prisma.countryAuditLog.deleteMany({ where: { countryId: { in: ids } } });
    await prisma.country.deleteMany({ where: { id: { in: ids } } });
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

  admin = await createUser(`${PREFIX}admin`, "admin");
  manager = await createUser(`${PREFIX}manager`, "hr_manager");
  staff = await createUser(`${PREFIX}staff`, "hr_staff");
}, 60000);

afterAll(async () => {
  try {
    await cleanup();
  } finally {
    await prisma.$disconnect();
  }
});

describe("GAP-M-008 — إضافة دولة", () => {
  it("1) admin ينشئ دولة → 201 + audit", async () => {
    const res = await createCountry(admin.token);

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.version).toBe(1);
    expect(res.body.name).toContain(PREFIX);

    const audit = await prisma.countryAuditLog.findFirst({
      where: { countryId: res.body.id, action: "create" },
    });
    expect(audit).not.toBeNull();
    expect(audit!.changedBy).toBe(admin.id);
  });

  it("2) hr_staff يحاول إنشاء دولة → 403", async () => {
    const res = await request(app)
      .post("/api/countries")
      .set("Authorization", `Bearer ${staff.token}`)
      .send(payload());

    expect(res.status).toBe(403);
  });

  it("3) دولة باسم مكرر → 409", async () => {
    const name = `${PREFIX}-duplicate`;
    const first = await createCountry(admin.token, { name, code: null });
    expect(first.status).toBe(201);

    const second = await createCountry(admin.token, { name, code: null });
    expect(second.status).toBe(409);
    expect(second.body.error).toContain("بنفس الاسم");
  });
});

describe("GAP-M-009 — تعديل دولة", () => {
  it("4) hr_manager يعدّل دولة → 200 + audit + version+1", async () => {
    const created = await createCountry(admin.token);
    expect(created.status).toBe(201);

    const newName = `${PREFIX}-renamed-${Math.random().toString(36).slice(2, 6)}`;
    const res = await request(app)
      .put(`/api/countries/${created.body.id}`)
      .set("Authorization", `Bearer ${manager.token}`)
      .send({ version: created.body.version, name: newName });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe(newName);
    expect(res.body.version).toBe(created.body.version + 1);

    const audit = await prisma.countryAuditLog.findFirst({
      where: { countryId: created.body.id, action: "update" },
    });
    expect(audit).not.toBeNull();
    expect(audit!.changedBy).toBe(manager.id);
  });
});

describe("GAP-M-010 — حذف دولة", () => {
  it("5) admin يحذف دولة بلا مراجع → 200", async () => {
    const created = await createCountry(admin.token);
    expect(created.status).toBe(201);

    const res = await request(app)
      .delete(`/api/countries/${created.body.id}`)
      .set("Authorization", `Bearer ${admin.token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const gone = await prisma.country.findUnique({ where: { id: created.body.id } });
    expect(gone).toBeNull();

    // سجل التدقيق يبقى بعد الحذف الفيزيائي (بلا FK)
    const audit = await prisma.countryAuditLog.findFirst({
      where: { countryId: created.body.id, action: "delete" },
    });
    expect(audit).not.toBeNull();
  });

  it("6) admin يحذف دولة مستخدمة (شخص/منشأة) → 422", async () => {
    const created = await createCountry(admin.token);
    expect(created.status).toBe(201);

    await prisma.person.create({
      data: {
        surname: `${PREFIX}-Person`,
        firstname: "Ref",
        countryId: created.body.id,
      },
    });

    const res = await request(app)
      .delete(`/api/countries/${created.body.id}`)
      .set("Authorization", `Bearer ${admin.token}`);

    expect(res.status).toBe(422);
    expect(res.body.error).toContain("لا يمكن حذف الدولة");
    expect(res.body.details?.peopleCountry).toBeGreaterThan(0);

    const stillThere = await prisma.country.findUnique({
      where: { id: created.body.id },
    });
    expect(stillThere).not.toBeNull();
  });
});
