/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/__tests__/**/*.test.ts"],
  moduleFileExtensions: ["ts", "js", "json"],
  transform: {
    "^.+\\.ts$": ["ts-jest", { tsconfig: "<rootDir>/tsconfig.json" }],
  },
  testPathIgnorePatterns: ["/node_modules/"],
  // حارس أمان: يرفض التشغيل إذا لم يكن DATABASE_URL قاعدة اختبار صريحة.
  globalSetup: "<rootDir>/jest.globalSetup.js",
  // Sprint 5.5: كل اختبار داخل معاملة تُلغى بعد الانتهاء.
  setupFilesAfterEnv: ["<rootDir>/src/__tests__/setup.ts"],
  // Prisma/supertest يتركان handles مفتوحة، ما يمنع Jest من الخروج بعد انتهاء الاختبارات
  forceExit: true,
  testTimeout: 30000,
  // قاعدة الاختبار واحدة مشتركة: منع التوازي لتجنّب تداخل deleteMany بين suites
  maxWorkers: 1,
};
