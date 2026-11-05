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
  // Prisma/supertest يتركان handles مفتوحة، ما يمنع Jest من الخروج بعد انتهاء الاختبارات
  forceExit: true,
  testTimeout: 30000,
};
