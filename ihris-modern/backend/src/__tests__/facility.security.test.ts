import request from "supertest";
import { createApp } from "../app";
import { prisma } from "../lib/prisma";
import { hashPassword } from "../lib/password";

/**
 * Sprint 3 — اختبارات أمان GAP-004/005/006 (8).
 * تغطي: Mass Assignment، RBAC، غياب المصادقة، SQL injection، مدخلات غير صالحة.
 */
const PREFIX = "gap3sec";
const PASSWORD = "Passw0rd!";

let app: ReturnType<typeof createApp>;

interface SeededUser {
  id: number;
  username: string;
  token: string;
}

let admin: SeededUser;
let staff: SeededUser;

let country: { id: number };
let district: { id: number };
let county: { id: number };
let region: { id: number };
let type: { id: number };
let facilityId: number;

const createdFacilityIds: number[] = [];

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
  const byName = await prisma.facility.findMany({
    where: { name: { startsWith: PREFIX } },
    select: { id: true },
  });
  const ids = Array.from(new Set([...createdFacilityIds, ...byName.map((f) => f.id)]));
  if (ids.length) {
    await prisma.position.deleteMany({ where: { facilityId: { in: ids } } });
    await prisma.facilityAuditLog.deleteMany({ where: { facilityId: { in: ids } } });
    await prisma.facility.deleteMany({ where: { id: { in: ids } } });
  }
  await prisma.county.deleteMany({ where: { name: { startsWith: PREFIX } } });
  await prisma.district.deleteMany({ where: { name: { startsWith: PREFIX } } });
  await prisma.facilityType.deleteMany({ where: { name: { startsWith: PREFIX } } });
  await prisma.country.deleteMany({ where: { name: { startsWith: PREFIX } } });
  await prisma.region.deleteMany({ where: { name: { startsWith: PREFIX } } });

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
  createdFacilityIds.length = 0;

  for (const [name, displayName] of [
    ["admin", "مسؤول النظام"],
    ["hr_staff", "موظف موارد بشرية"],
  ]) {
    await prisma.role.upsert({ where: { name }, update: {}, create: { name, displayName } });
  }

  await cleanup();

  admin = await createUser(`${PREFIX}admin`, "admin");
  staff = await createUser(`${PREFIX}staff`, "hr_staff");

  country = await prisma.country.create({
    data: { name: `${PREFIX}-Country`, code: "G3S" },
  });
  district = await prisma.district.create({
    data: { name: `${PREFIX}-District`, countryId: country.id },
  });
  county = await prisma.county.create({
    data: { name: `${PREFIX}-County`, districtId: district.id },
  });
  region = await prisma.region.create({ data: { name: `${PREFIX}-Region` } });
  type = await prisma.facilityType.create({ data: { name: `${PREFIX}-Type` } });

  const created = await request(app)
    .post("/api/facilities")
    .set("Authorization", `Bearer ${admin.token}`)
    .send({
      name: `${PREFIX}-base`,
      facilityTypeId: type.id,
      countryId: country.id,
      districtId: district.id,
      countyId: county.id,
      regionId: region.id,
    });
  if (created.status !== 201) {
    throw new Error(`seed facility failed: ${created.status} ${JSON.stringify(created.body)}`);
  }
  facilityId = created.body.id;
  createdFacilityIds.push(facilityId);
}, 60000);

afterAll(async () => {
  try {
    await cleanup();
  } finally {
    await prisma.$disconnect();
  }
});

function basePayload() {
  return {
    name: `${PREFIX}-new`,
    facilityTypeId: type.id,
    countryId: country.id,
    districtId: district.id,
    countyId: county.id,
    regionId: region.id,
  };
}

describe("أمان إدارة المنشآت", () => {
  it("S1) hr_staff يحاول الإنشاء → 403", async () => {
    const res = await request(app)
      .post("/api/facilities")
      .set("Authorization", `Bearer ${staff.token}`)
      .send(basePayload());
    expect(res.status).toBe(403);
  });

  it("S2) hr_staff يحاول التعديل → 403", async () => {
    const res = await request(app)
      .put(`/api/facilities/${facilityId}`)
      .set("Authorization", `Bearer ${staff.token}`)
      .send({ version: 1, name: `${PREFIX}-hijack` });
    expect(res.status).toBe(403);

    const db = await prisma.facility.findUniqueOrThrow({ where: { id: facilityId } });
    expect(db.name).not.toBe(`${PREFIX}-hijack`);
  });

  it("S3) hr_staff يحاول الحذف → 403", async () => {
    const res = await request(app)
      .delete(`/api/facilities/${facilityId}`)
      .set("Authorization", `Bearer ${staff.token}`);
    expect(res.status).toBe(403);

    const db = await prisma.facility.findUnique({ where: { id: facilityId } });
    expect(db).not.toBeNull();
  });

  it("S4) حذف بلا مصادقة → 401", async () => {
    const res = await request(app).delete(`/api/facilities/${facilityId}`);
    expect(res.status).toBe(401);
  });

  it("S5) Mass assignment عند الإنشاء → 400", async () => {
    const res = await request(app)
      .post("/api/facilities")
      .set("Authorization", `Bearer ${admin.token}`)
      .send({ ...basePayload(), id: 9999, version: 42, createdAt: new Date().toISOString() });

    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body)).toContain("غير مسموح");
  });

  it("S6) مرجع جغرافي غير موجود → 400", async () => {
    const res = await request(app)
      .post("/api/facilities")
      .set("Authorization", `Bearer ${admin.token}`)
      .send({ ...basePayload(), countryId: 987654 });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("غير موجودة");
  });

  it("S7) معرّف غير رقمي → 400", async () => {
    const res = await request(app)
      .get("/api/facilities/not-a-number")
      .set("Authorization", `Bearer ${staff.token}`);
    expect(res.status).toBe(400);
  });

  it("S8) SQL injection في البحث → آمن والجدول سليم", async () => {
    const injection = `x'; DROP TABLE "facilities"; --`;
    const res = await request(app)
      .get(`/api/facilities?search=${encodeURIComponent(injection)}`)
      .set("Authorization", `Bearer ${staff.token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(await prisma.facility.count()).toBeGreaterThan(0);
  });
});
