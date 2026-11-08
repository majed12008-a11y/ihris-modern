import request from "supertest";
import { createApp } from "../app";
import { prisma } from "../lib/prisma";
import { hashPassword } from "../lib/password";

/**
 * Sprint 4 — اختبارات أمان الدول (4).
 * تغطي: 403 للأدوار، 401 بلا مصادقة، Mass assignment، رفع كائن/ملف في name.
 */
const PREFIX = "gap4cs";
const PASSWORD = "Passw0rd!";

let app: ReturnType<typeof createApp>;
let adminToken: string;
let staffToken: string;
let adminId: number;

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
  const countries = await prisma.country.findMany({
    where: { name: { startsWith: PREFIX } },
    select: { id: true },
  });
  const ids = countries.map((c) => c.id);
  if (ids.length) {
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
    ["hr_staff", "موظف موارد بشرية"],
  ]) {
    await prisma.role.upsert({ where: { name }, update: {}, create: { name, displayName } });
  }

  await cleanup();

  const admin = await createUser(`${PREFIX}admin`, "admin");
  adminToken = admin.token;
  adminId = admin.id;
  staffToken = (await createUser(`${PREFIX}staff`, "hr_staff")).token;
}, 60000);

afterAll(async () => {
  try {
    await cleanup();
  } finally {
    await prisma.$disconnect();
  }
});

describe("أمان الدول", () => {
  it("S1) hr_staff على endpoint إداري (POST) → 403", async () => {
    const res = await request(app)
      .post("/api/countries")
      .set("Authorization", `Bearer ${staffToken}`)
      .send({ name: `${PREFIX}-blocked` });

    expect(res.status).toBe(403);
    const count = await prisma.country.count({
      where: { name: `${PREFIX}-blocked` },
    });
    expect(count).toBe(0);
  });

  it("S2) حذف بلا مصادقة → 401", async () => {
    const created = await request(app)
      .post("/api/countries")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: `${PREFIX}-noauth` });
    expect(created.status).toBe(201);

    const res = await request(app).delete(`/api/countries/${created.body.id}`);
    expect(res.status).toBe(401);

    const stillThere = await prisma.country.findUnique({
      where: { id: created.body.id },
    });
    expect(stillThere).not.toBeNull();
    expect(stillThere!.createdAt).toBeDefined();
    expect(adminId).toBeGreaterThan(0);
  });

  it("S3) Mass assignment (id/version في الجسم) → 400", async () => {
    const res = await request(app)
      .post("/api/countries")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: `${PREFIX}-mass`, id: 999, version: 7 });

    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body)).toContain("حقل غير مسموح");
  });

  it("S4) كائن/ملف في name → 400", async () => {
    const res = await request(app)
      .post("/api/countries")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: { filename: "evil.txt", data: "x" }, code: "X" });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe("VALIDATION_ERROR");
  });
});
