import request from "supertest";
import { createApp } from "../app";
import { prisma } from "../lib/prisma";

let app: ReturnType<typeof createApp>;
let authToken: string;

beforeAll(async () => {
  app = createApp();

  // Create admin user and login
  await prisma.role.upsert({
    where: { name: "admin" },
    update: {},
    create: {
      name: "admin",
      displayName: "مسؤول",
      description: "مسؤول النظام",
    },
  });

  await prisma.user.upsert({
    where: { username: "admintest" },
    update: {},
    create: {
      username: "admintest",
      password: await (require("../lib/password").hashPassword)("admin123"),
      firstname: "Admin",
      lastname: "Test",
      email: "admin@test.com",
      creatorId: 1,
    },
  });

  const loginRes = await request(app).post("/api/auth/login").send({
    username: "admintest",
    password: "admin123",
  });
  authToken = loginRes.body.token;
});

afterAll(async () => {
  await prisma.person.deleteMany({});
  await prisma.user.deleteMany({ where: { username: "admintest" } });
  await prisma.role.deleteMany({ where: { name: "admin" } });
  await prisma.$disconnect();
});

describe("Person API", () => {
  it("should create a new person", async () => {
    const res = await request(app)
      .post("/api/persons")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        surname: "الأحمدي",
        firstname: "محمد",
        othername: "علي",
        countryId: 1,
      });
    expect(res.status).toBe(201);
    expect(res.body.surname).toBe("الأحمدي");
    expect(res.body.firstname).toBe("محمد");
  });

  it("should list persons", async () => {
    const res = await request(app)
      .get("/api/persons")
      .set("Authorization", `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.total).toBeGreaterThan(0);
  });

  it("should get person by id", async () => {
    const listRes = await request(app)
      .get("/api/persons")
      .set("Authorization", `Bearer ${authToken}`);
    const personId = listRes.body.data[0].id;

    const res = await request(app)
      .get(`/api/persons/${personId}`)
      .set("Authorization", `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(personId);
  });

  it("should update a person", async () => {
    const listRes = await request(app)
      .get("/api/persons")
      .set("Authorization", `Bearer ${authToken}`);
    const personId = listRes.body.data[0].id;

    const res = await request(app)
      .put(`/api/persons/${personId}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({ firstname: "أحمد" });
    expect(res.status).toBe(200);
    expect(res.body.firstname).toBe("أحمد");
  });

  it("should search persons", async () => {
    const res = await request(app)
      .get("/api/persons?search=الأحمدي")
      .set("Authorization", `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(res.body.total).toBeGreaterThan(0);
  });
});
