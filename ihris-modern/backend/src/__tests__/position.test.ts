import request from "supertest";
import { createApp } from "../app";
import { prisma } from "../lib/prisma";

let app: ReturnType<typeof createApp>;
let authToken: string;
let facilityId: number;

beforeAll(async () => {
  app = createApp();

  await prisma.role.upsert({
    where: { name: "admin" },
    update: {},
    create: {
      name: "admin",
      displayName: "مسؤول",
      description: "مسؤول النظام",
    },
  });

  const adminRole = await prisma.role.findUniqueOrThrow({ where: { name: "admin" } });

  const user = await prisma.user.upsert({
    where: { username: "admintest2" },
    update: {},
    create: {
      username: "admintest2",
      password: await (require("../lib/password").hashPassword)("admin123"),
      firstname: "Admin",
      lastname: "Test2",
      email: "admin2@test.com",
      creatorId: 1,
    },
  });

  await prisma.userAccess.upsert({
    where: { userId_roleId: { userId: user.id, roleId: adminRole.id } },
    update: {},
    create: { userId: user.id, roleId: adminRole.id },
  });

  const loginRes = await request(app).post("/api/auth/login").send({
    username: "admintest2",
    password: "admin123",
  });
  authToken = loginRes.body.token;

  // لا نفترض وجود منشأة بالمعرف 1 — ننشئ منشأة اختبار مخصصة
  const facility = await prisma.facility.create({
    data: { name: "منشأة اختبار المواقع" },
  });
  facilityId = facility.id;
});

afterAll(async () => {
  await prisma.position.deleteMany({});
  await prisma.facility.deleteMany({ where: { id: facilityId } });
  await prisma.userAccess.deleteMany({ where: { user: { username: "admintest2" } } });
  await prisma.user.deleteMany({ where: { username: "admintest2" } });
  await prisma.role.deleteMany({ where: { name: "admin" } });
  await prisma.$disconnect();
});

describe("Position API", () => {
  it("should create a new position", async () => {
    const res = await request(app)
      .post("/api/positions")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        code: "POS001",
        title: "طبيب عام",
        description: "طبيب عيادة عامة",
        facilityId,
      });
    expect(res.status).toBe(201);
    expect(res.body.code).toBe("POS001");
    expect(res.body.title).toBe("طبيب عام");
  });

  it("should list positions", async () => {
    const res = await request(app)
      .get("/api/positions")
      .set("Authorization", `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
