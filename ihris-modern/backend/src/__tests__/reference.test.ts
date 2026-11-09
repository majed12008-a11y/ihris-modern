import request from "supertest";
import { createApp } from "../app";
import { prisma } from "../lib/prisma";
import { hashPassword } from "../lib/password";

/**
 * Sprint 5 — سيناريوهات قبول GAP-FE-010/011/012 + GAP-M-012..015 (20 CRUD)
 * + سيناريوهان End-to-End/Seed (21، 22).
 * تكامل حقيقي على `ihris_test_gap001` مع بيانات الـseed الفعلية.
 */
const PREFIX = "gap5r";
const PASSWORD = "Passw0rd!";

let app: ReturnType<typeof createApp>;
let adminToken: string;
let managerToken: string;
let staffToken: string;

type EntityType =
  | "salary_grade"
  | "cadre"
  | "classification"
  | "position_type"
  | "salary_source";

interface EntityCase {
  slug: string;
  entityType: EntityType;
  label: string;
  extra?: Record<string, unknown>;
}

const ENTITIES: EntityCase[] = [
  { slug: "salary-grades", entityType: "salary_grade", label: "درجة راتب", extra: { notes: "ملاحظة" } },
  { slug: "cadres", entityType: "cadre", label: "فئة" },
  { slug: "classifications", entityType: "classification", label: "تصنيف" },
  { slug: "position-types", entityType: "position_type", label: "نوع وظيفة" },
  { slug: "salary-sources", entityType: "salary_source", label: "مصدر راتب" },
];

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
      firstname: "Ref",
      lastname: username,
      email: `${username}@test.local`,
      creatorId: 1,
      access: { create: { roleId: role.id } },
    },
  });
  return { id: user.id, token: await login(username) };
}

async function cleanup() {
  const jobs = await prisma.job.findMany({
    where: { title: { startsWith: PREFIX } },
    select: { id: true },
  });
  const jobIds = jobs.map((j) => j.id);
  if (jobIds.length) {
    await prisma.position.deleteMany({ where: { jobId: { in: jobIds } } });
    await prisma.jobAuditLog.deleteMany({ where: { jobId: { in: jobIds } } });
    await prisma.job.deleteMany({ where: { id: { in: jobIds } } });
  }

  const seededPrefixRows = {
    salaryGrade: await prisma.salaryGrade.findMany({
      where: { name: { startsWith: PREFIX } },
      select: { id: true },
    }),
    cadre: await prisma.cadre.findMany({
      where: { name: { startsWith: PREFIX } },
      select: { id: true },
    }),
    classification: await prisma.classification.findMany({
      where: { name: { startsWith: PREFIX } },
      select: { id: true },
    }),
    positionType: await prisma.jobType.findMany({
      where: { name: { startsWith: PREFIX } },
      select: { id: true },
    }),
    salarySource: await prisma.salarySource.findMany({
      where: { name: { startsWith: PREFIX } },
      select: { id: true },
    }),
  };

  const entityIds = [
    ...seededPrefixRows.salaryGrade.map((r) => ({ entityType: "salary_grade", entityId: r.id })),
    ...seededPrefixRows.cadre.map((r) => ({ entityType: "cadre", entityId: r.id })),
    ...seededPrefixRows.classification.map((r) => ({ entityType: "classification", entityId: r.id })),
    ...seededPrefixRows.positionType.map((r) => ({ entityType: "position_type", entityId: r.id })),
    ...seededPrefixRows.salarySource.map((r) => ({ entityType: "salary_source", entityId: r.id })),
  ];

  if (entityIds.length) {
    await prisma.referenceDataAuditLog.deleteMany({ where: { OR: entityIds } });
  }

  await prisma.salaryGrade.deleteMany({ where: { name: { startsWith: PREFIX } } });
  await prisma.cadre.deleteMany({ where: { name: { startsWith: PREFIX } } });
  await prisma.classification.deleteMany({ where: { name: { startsWith: PREFIX } } });
  await prisma.jobType.deleteMany({ where: { name: { startsWith: PREFIX } } });
  await prisma.salarySource.deleteMany({ where: { name: { startsWith: PREFIX } } });

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

function uniqueName(entity: EntityCase) {
  return `${PREFIX}-${entity.entityType}-${Math.random().toString(36).slice(2, 8)}`;
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

  adminToken = (await createUser(`${PREFIX}admin`, "admin")).token;
  managerToken = (await createUser(`${PREFIX}manager`, "hr_manager")).token;
  staffToken = (await createUser(`${PREFIX}staff`, "hr_staff")).token;
});

afterAll(async () => {
  await cleanup();
});

describe("Sprint 5 — CRUD للبيانات المرجعية (20 سيناريو)", () => {
  for (const entity of ENTITIES) {
    describe(`${entity.label} (${entity.slug})`, () => {
      let id: number;
      let code: string;
      let name: string;

      // Sprint 5.5: كل اختبار داخل معاملة مستقلة، لذا نُنشئ سجلاً خاصاً به.
      async function createEntity() {
        const createdName = uniqueName(entity);
        const createdCode = `${PREFIX.toUpperCase()}-${Math.random()
          .toString(36)
          .slice(2, 6)
          .toUpperCase()}`;
        const res = await request(app)
          .post(`/api/reference/${entity.slug}`)
          .set("Authorization", `Bearer ${managerToken}`)
          .send({
            name: createdName,
            code: createdCode,
            description: "وصف اختباري",
            ...entity.extra,
          });
        expect(res.status).toBe(201);
        return { id: res.body.id as number, name: createdName, code: createdCode };
      }

      it(`ينشئ ${entity.label} بإصدار 1 — 201`, async () => {
        name = uniqueName(entity);
        code = `${PREFIX.toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

        const res = await request(app)
          .post(`/api/reference/${entity.slug}`)
          .set("Authorization", `Bearer ${managerToken}`)
          .send({ name, code, description: "وصف اختباري", ...entity.extra });

        expect(res.status).toBe(201);
        expect(res.body.id).toBeGreaterThan(0);
        expect(res.body.name).toBe(name);
        expect(res.body.code).toBe(code);
        expect(res.body.version).toBe(1);
        id = res.body.id;
      });

      it(`يقرأ ${entity.label} في القائمة وبالمعرّف — 200`, async () => {
        const created = await createEntity();
        const list = await request(app)
          .get(`/api/reference/${entity.slug}?search=${encodeURIComponent(created.name)}`)
          .set("Authorization", `Bearer ${staffToken}`);
        expect(list.status).toBe(200);
        expect(list.body.total).toBe(1);
        expect(list.body.data[0].id).toBe(created.id);

        const byId = await request(app)
          .get(`/api/reference/${entity.slug}/${created.id}`)
          .set("Authorization", `Bearer ${staffToken}`);
        expect(byId.status).toBe(200);
        expect(byId.body.code).toBe(created.code);
      });

      it(`يعدّل ${entity.label} ويرفع الإصدار إلى 2 — 200`, async () => {
        const created = await createEntity();
        const newName = `${created.name}-معدل`;
        const res = await request(app)
          .put(`/api/reference/${entity.slug}/${created.id}`)
          .set("Authorization", `Bearer ${managerToken}`)
          .send({ name: newName, version: 1 });

        expect(res.status).toBe(200);
        expect(res.body.name).toBe(newName);
        expect(res.body.version).toBe(2);
        expect(res.body.code).toBe(created.code);
      });

      it(`يحذف ${entity.label} حذفاً فيزيائياً — 200 ثم 404`, async () => {
        const created = await createEntity();
        const del = await request(app)
          .delete(`/api/reference/${entity.slug}/${created.id}`)
          .set("Authorization", `Bearer ${adminToken}`);
        expect(del.status).toBe(200);
        expect(del.body.success).toBe(true);

        const after = await request(app)
          .get(`/api/reference/${entity.slug}/${created.id}`)
          .set("Authorization", `Bearer ${staffToken}`);
        expect(after.status).toBe(404);
      });
    });
  }
});

describe("Sprint 5 — End-to-End والـSeed", () => {
  it("21) بعد seed — إنشاء job يستخدم salary_grade + cadre + classification → 201", async () => {
    // يستخدم الصفوف الفعلية المدرجة في 010_seed_reference_data.sql.
    const salaryGrade = await prisma.salaryGrade.findFirstOrThrow({ where: { code: "SG-01" } });
    const cadre = await prisma.cadre.findFirstOrThrow({ where: { code: "CAD-MD" } });
    const classification = await prisma.classification.findFirstOrThrow({ where: { code: "222" } });

    const res = await request(app)
      .post("/api/jobs")
      .set("Authorization", `Bearer ${managerToken}`)
      .send({
        title: `${PREFIX}-Seed-Job-${Math.random().toString(36).slice(2, 7)}`,
        code: `S${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
        salaryGradeId: salaryGrade.id,
        cadreId: cadre.id,
        classificationId: classification.id,
      });

    expect(res.status).toBe(201);
    expect(res.body.salaryGrade).toEqual({ id: salaryGrade.id, name: salaryGrade.name });
    expect(res.body.cadre).toEqual({ id: cadre.id, name: cadre.name });
    expect(res.body.classification).toEqual({
      id: classification.id,
      name: classification.name,
    });
  });

  it("22) حذف درجة راتب مستخدمة في job → 422", async () => {
    const salaryGrade = await prisma.salaryGrade.create({
      data: { name: `${PREFIX}-Used-SG`, code: `${PREFIX.toUpperCase()}-USED` },
    });

    const job = await request(app)
      .post("/api/jobs")
      .set("Authorization", `Bearer ${managerToken}`)
      .send({
        title: `${PREFIX}-Used-Job-${Math.random().toString(36).slice(2, 7)}`,
        salaryGradeId: salaryGrade.id,
      });
    expect(job.status).toBe(201);

    const del = await request(app)
      .delete(`/api/reference/salary-grades/${salaryGrade.id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(del.status).toBe(422);
    expect(del.body.code).toBe("UNPROCESSABLE_ENTITY");
    expect(del.body.details).toMatchObject({ "وظائف": 1 });
  });
});
