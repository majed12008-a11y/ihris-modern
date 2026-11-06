import request from "supertest";
import { createApp } from "../app";
import { prisma } from "../lib/prisma";
import { hashPassword } from "../lib/password";

/**
 * Sprint 3 — سيناريوهات قبول GAP-004/005/006 (10).
 * تكامل حقيقي على `ihris_test_gap001`، بلا mocks.
 */
const PREFIX = "gap3";
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

let countryA: { id: number; name: string };
let countryB: { id: number; name: string };
let districtA: { id: number; name: string };
let districtB: { id: number; name: string };
let countyA: { id: number; name: string };
let region: { id: number; name: string };
let facilityType: { id: number; name: string };

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
      firstname: "Facility",
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
    name: `${PREFIX}-facility-${Math.random().toString(36).slice(2, 8)}`,
    facilityTypeId: facilityType.id,
    countryId: countryA.id,
    districtId: districtA.id,
    countyId: countyA.id,
    regionId: region.id,
    ...overrides,
  };
}

async function createFacility(token: string, overrides: Record<string, unknown> = {}) {
  const res = await request(app)
    .post("/api/facilities")
    .set("Authorization", `Bearer ${token}`)
    .send(payload(overrides));
  if (res.status === 201) createdFacilityIds.push(res.body.id);
  return res;
}

async function cleanup() {
  const byName = await prisma.facility.findMany({
    where: { name: { startsWith: PREFIX } },
    select: { id: true },
  });
  const ids = Array.from(
    new Set([...createdFacilityIds, ...byName.map((f) => f.id)])
  );

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
    ["hr_manager", "مدير الموارد البشرية"],
    ["hr_staff", "موظف موارد بشرية"],
  ]) {
    await prisma.role.upsert({ where: { name }, update: {}, create: { name, displayName } });
  }

  await cleanup();

  admin = await createUser(`${PREFIX}admin`, "admin");
  manager = await createUser(`${PREFIX}manager`, "hr_manager");
  staff = await createUser(`${PREFIX}staff`, "hr_staff");

  countryA = await prisma.country.create({
    data: { name: `${PREFIX}-CountryA`, code: "G3A" },
  });
  countryB = await prisma.country.create({
    data: { name: `${PREFIX}-CountryB`, code: "G3B" },
  });
  districtA = await prisma.district.create({
    data: { name: `${PREFIX}-DistrictA`, countryId: countryA.id },
  });
  districtB = await prisma.district.create({
    data: { name: `${PREFIX}-DistrictB`, countryId: countryB.id },
  });
  countyA = await prisma.county.create({
    data: { name: `${PREFIX}-CountyA`, districtId: districtA.id },
  });
  region = await prisma.region.create({ data: { name: `${PREFIX}-Region` } });
  facilityType = await prisma.facilityType.create({
    data: { name: `${PREFIX}-Type` },
  });
}, 60000);

afterAll(async () => {
  try {
    await cleanup();
  } finally {
    await prisma.$disconnect();
  }
});

describe("GAP-004 — إضافة منشأة", () => {
  it("1) admin ينشئ منشأة كاملة → 201 + audit", async () => {
    const res = await createFacility(admin.token);

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.version).toBe(1);
    expect(res.body.facilityType.name).toBe(facilityType.name);
    expect(res.body.country.name).toBe(countryA.name);

    const audit = await prisma.facilityAuditLog.findFirst({
      where: { facilityId: res.body.id, action: "create" },
    });
    expect(audit).not.toBeNull();
    expect(audit!.changedBy).toBe(admin.id);
  });

  it("2) hr_staff يحاول إنشاء منشأة → 403", async () => {
    const res = await request(app)
      .post("/api/facilities")
      .set("Authorization", `Bearer ${staff.token}`)
      .send(payload());

    expect(res.status).toBe(403);
  });

  it("3) منشأة باسم مكرر → 409", async () => {
    const name = `${PREFIX}-duplicate`;
    const first = await createFacility(admin.token, { name });
    expect(first.status).toBe(201);

    const second = await createFacility(admin.token, { name });
    expect(second.status).toBe(409);
    expect(second.body.error).toContain("بنفس الاسم");
  });

  it("4) country → district → county cascade يعمل", async () => {
    const districts = await request(app)
      .get(`/api/facilities/meta/districts?countryId=${countryA.id}`)
      .set("Authorization", `Bearer ${staff.token}`);
    expect(districts.status).toBe(200);
    expect(districts.body.map((d: any) => d.id)).toContain(districtA.id);
    expect(districts.body.map((d: any) => d.id)).not.toContain(districtB.id);

    const counties = await request(app)
      .get(`/api/facilities/meta/counties?districtId=${districtA.id}`)
      .set("Authorization", `Bearer ${staff.token}`);
    expect(counties.status).toBe(200);
    expect(counties.body.map((c: any) => c.id)).toContain(countyA.id);

    // اتساق التسلسل: محافظة من دولة أخرى تُرفض
    const mismatch = await createFacility(admin.token, {
      countryId: countryA.id,
      districtId: districtB.id,
      countyId: countyA.id,
    });
    expect(mismatch.status).toBe(400);
    expect(mismatch.body.error).toContain("لا تنتمي");
  });
});

describe("GAP-005 — تعديل منشأة", () => {
  it("5) hr_manager يعدّل منشأة → 200 + audit", async () => {
    const created = await createFacility(admin.token);
    expect(created.status).toBe(201);

    const res = await request(app)
      .put(`/api/facilities/${created.body.id}`)
      .set("Authorization", `Bearer ${manager.token}`)
      .send({ version: created.body.version, name: `${PREFIX}-edited-by-manager` });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe(`${PREFIX}-edited-by-manager`);
    expect(res.body.version).toBe(created.body.version + 1);

    const audits = await prisma.facilityAuditLog.findMany({
      where: { facilityId: created.body.id, action: "update" },
    });
    expect(audits.length).toBeGreaterThan(0);
    expect(audits[0].changedBy).toBe(manager.id);
  });

  it("6) تعديل بـ version خاطئ → 409", async () => {
    const created = await createFacility(admin.token);
    expect(created.status).toBe(201);

    const res = await request(app)
      .put(`/api/facilities/${created.body.id}`)
      .set("Authorization", `Bearer ${admin.token}`)
      .send({ version: created.body.version + 99, name: `${PREFIX}-should-not-write` });

    expect(res.status).toBe(409);

    const db = await prisma.facility.findUniqueOrThrow({ where: { id: created.body.id } });
    expect(db.name).not.toBe(`${PREFIX}-should-not-write`);
  });
});

describe("حذف المنشأة (منطق GAP-003 المكافئ)", () => {
  it("7) admin يحذف منشأة بلا positions → 200", async () => {
    const created = await createFacility(admin.token);
    expect(created.status).toBe(201);

    const res = await request(app)
      .delete(`/api/facilities/${created.body.id}`)
      .set("Authorization", `Bearer ${admin.token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const db = await prisma.facility.findUnique({ where: { id: created.body.id } });
    expect(db).toBeNull();

    const audit = await prisma.facilityAuditLog.findFirst({
      where: { facilityId: created.body.id, action: "delete" },
    });
    expect(audit).not.toBeNull();
  });

  it("8) admin يحذف منشأة لها positions → 422", async () => {
    const created = await createFacility(admin.token);
    expect(created.status).toBe(201);

    await prisma.position.create({
      data: { facilityId: created.body.id, title: `${PREFIX}-position` },
    });

    const res = await request(app)
      .delete(`/api/facilities/${created.body.id}`)
      .set("Authorization", `Bearer ${admin.token}`);

    expect(res.status).toBe(422);
    expect(res.body.error).toContain("وظيفة");

    const db = await prisma.facility.findUnique({ where: { id: created.body.id } });
    expect(db).not.toBeNull();
  });
});

describe("GAP-006 — عرض تفاصيل منشأة", () => {
  it("9) عرض تفاصيل منشأة → 200 + كل الحقول + positions", async () => {
    const created = await createFacility(admin.token);
    expect(created.status).toBe(201);

    const res = await request(app)
      .get(`/api/facilities/${created.body.id}`)
      .set("Authorization", `Bearer ${staff.token}`);

    expect(res.status).toBe(200);
    expect(res.body.name).toBe(created.body.name);
    expect(res.body.country.id).toBe(countryA.id);
    expect(res.body.district.id).toBe(districtA.id);
    expect(res.body.county.id).toBe(countyA.id);
    expect(res.body.region.id).toBe(region.id);
    expect(Array.isArray(res.body.positions)).toBe(true);
  });

  it("10) IDOR: hr_staff يقرأ منشأة → 200 (قراءة عامة)", async () => {
    const created = await createFacility(admin.token);
    expect(created.status).toBe(201);

    const detail = await request(app)
      .get(`/api/facilities/${created.body.id}`)
      .set("Authorization", `Bearer ${staff.token}`);
    expect(detail.status).toBe(200);

    const list = await request(app)
      .get("/api/facilities")
      .set("Authorization", `Bearer ${staff.token}`);
    expect(list.status).toBe(200);
    expect(list.body.data.map((f: any) => f.id)).toContain(created.body.id);
  });
});
