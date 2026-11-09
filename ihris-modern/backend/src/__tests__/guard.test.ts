import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";

/**
 * Sprint 5.5 — Guard self-tests (3/3).
 * اختبار 2 يمرّ على الحواجز 2..6 واحداً واحداً، واختبار 3 يثبت نجاح الستة.
 */
const backendRoot = path.resolve(__dirname, "../..");

const RUNNER =
  "require('./jest.globalSetup.js')().then(() => process.exit(0)).catch((e) => { console.error(e.message); process.exit(1); })";

function runGuard(envOverrides: Record<string, string | undefined>) {
  const env: Record<string, string | undefined> = { ...process.env, ...envOverrides };
  if (envOverrides.DATABASE_URL === undefined) delete env.DATABASE_URL;

  return spawnSync(process.execPath, ["-e", RUNNER], {
    cwd: backendRoot,
    env: env as NodeJS.ProcessEnv,
    encoding: "utf8",
    timeout: 30000,
  });
}

function expectGuardFailure(overrides: Record<string, string | undefined>, guard: string) {
  const result = runGuard(overrides);
  expect(result.status).not.toBe(0);
  expect(`${result.stdout}${result.stderr}`).toContain(`Guard ${guard}`);
}

function testPassword(): string {
  const contents = fs.readFileSync(path.join(backendRoot, ".env.test"), "utf8");
  const line = contents.split(/\r?\n/).find((l) => l.trim().startsWith("DATABASE_URL="));
  if (!line) throw new Error(".env.test is missing DATABASE_URL");
  const raw = line.slice(line.indexOf("=") + 1).trim().replace(/^"|"$/g, "");
  return decodeURIComponent(new URL(raw).password);
}

describe("Security Guards (Sprint 5.5)", () => {
  it("1) يرفض NODE_ENV غير test — Guard 1", () => {
    expectGuardFailure({ NODE_ENV: "production" }, "1");
  });

  it("2) يرفض كل حاجز من 2 إلى 6 عند انتهاكه منفرداً", () => {
    const password = encodeURIComponent(testPassword());

    expectGuardFailure({ NODE_ENV: "test", DATABASE_URL: "" }, "2");
    expectGuardFailure(
      { NODE_ENV: "test", DATABASE_URL: "postgresql://nobody@localhost:5432/ihris_manage" },
      "3"
    );
    expectGuardFailure(
      {
        NODE_ENV: "test",
        DATABASE_URL: "postgresql://ihris_test_user:x@localhost:5432/ihris_manage_test",
      },
      "4"
    );
    expectGuardFailure(
      {
        NODE_ENV: "test",
        DATABASE_URL: "postgresql://other_user@localhost:5432/ihris_test_gap001",
      },
      "5"
    );
    expectGuardFailure(
      {
        NODE_ENV: "test",
        DATABASE_URL: `postgresql://ihris_test_user:${password}@localhost:5432/postgres?application_name=_test_`,
      },
      "6"
    );
  });

  it("3) يقبل الإعداد الحالي بعد اجتياز الحواجز الستة", () => {
    const result = runGuard({ NODE_ENV: "test" });
    expect(result.status).toBe(0);
    expect(`${result.stdout}${result.stderr}`).toContain("All 6 guards passed");
  });
});
