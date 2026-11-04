import request from "supertest";
import { createApp } from "../app";
import { prisma } from "../lib/prisma";
import { hashPassword } from "../lib/password";

let app: ReturnType<typeof createApp>;

beforeAll(async () => {
  app = createApp();
  // Create a test user
  await prisma.user.upsert({
    where: { username: "testuser" },
    update: {},
    create: {
      username: "testuser",
      password: await hashPassword("testpass123"),
      firstname: "Test",
      lastname: "User",
      email: "test@example.com",
      creatorId: 1,
    },
  });
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { username: "testuser" } });
  await prisma.$disconnect();
});

describe("Auth API", () => {
  it("should login with valid credentials", async () => {
    const res = await request(app).post("/api/auth/login").send({
      username: "testuser",
      password: "testpass123",
    });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.username).toBe("testuser");
  });

  it("should reject invalid credentials", async () => {
    const res = await request(app).post("/api/auth/login").send({
      username: "testuser",
      password: "wrongpassword",
    });
    expect(res.status).toBe(401);
  });

  it("should get current user with valid token", async () => {
    const loginRes = await request(app).post("/api/auth/login").send({
      username: "testuser",
      password: "testpass123",
    });
    const token = loginRes.body.token;

    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.username).toBe("testuser");
  });

  it("should reject me endpoint without token", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });
});
