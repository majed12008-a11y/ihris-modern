/**
 * Sprint 5.5 — حارس أمان الاختبارات (6 حواجز متتالية).
 *
 * يكفي أن يفشل حاجز واحد لإيقاف تشغيل الاختبارات. الهدف: منع تكرار حادثة
 * تشغيل اختبارات التكامل على قاعدة الإنتاج (deleteMany في afterAll).
 */
const path = require("path");
const dotenv = require("dotenv");

module.exports = async () => {
  // تحميل .env.test إن لم تكن المتغيرات مضبوطة مسبقاً في الصدفة.
  dotenv.config({ path: path.resolve(__dirname, ".env.test") });

  // Guard 1: NODE_ENV
  if (process.env.NODE_ENV !== "test") {
    throw new Error(`Guard 1 FAILED: NODE_ENV must be 'test', got '${process.env.NODE_ENV}'`);
  }

  // Guard 2: DATABASE_URL format
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error("Guard 2 FAILED: DATABASE_URL is not set");
  }

  // Guard 3: _test_ marker
  if (!dbUrl.includes("_test_")) {
    throw new Error("Guard 3 FAILED: DATABASE_URL must contain '_test_'");
  }

  // Guard 4: no production markers
  const forbidden = ["ihris_manage", "ihris_prod", "ihris_production"];
  for (const marker of forbidden) {
    if (dbUrl.includes(marker)) {
      throw new Error(`Guard 4 FAILED: DATABASE_URL contains forbidden marker '${marker}'`);
    }
  }

  // Guard 5: test user only
  if (!dbUrl.includes("ihris_test_user")) {
    throw new Error("Guard 5 FAILED: DATABASE_URL must use ihris_test_user");
  }

  // Guard 6: actual DB verification
  const { PrismaClient } = require("@prisma/client");
  const prisma = new PrismaClient();
  try {
    const result = await prisma.$queryRaw`SELECT current_database() AS db`;
    const currentDb = result[0].db;
    if (currentDb !== "ihris_test_gap001") {
      throw new Error(`Guard 6 FAILED: Connected to '${currentDb}', expected 'ihris_test_gap001'`);
    }
  } finally {
    await prisma.$disconnect();
  }

  console.log("All 6 guards passed. Running tests on ihris_test_gap001.");
};
