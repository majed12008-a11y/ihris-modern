#!/usr/bin/env node
/**
 * Sprint 5.5 — Test preflight (cross-platform Node implementation).
 *
 * Verifies the same 6 safety conditions as jest.globalSetup.js BEFORE Jest
 * starts, and proves that the test user cannot connect to ihris_manage.
 */
const fs = require("fs");
const path = require("path");

const backendDir = path.resolve(__dirname, "../backend");
const envPath = path.join(backendDir, ".env.test");

function parseEnvFile(file) {
  const out = {};
  if (!fs.existsSync(file)) return out;
  for (const raw of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

function fail(message) {
  console.error(`Preflight FAILED: ${message}`);
  process.exit(1);
}

(async () => {
  console.log("=== Test Preflight ===");

  const fileEnv = parseEnvFile(envPath);
  const env = { ...fileEnv, ...process.env }; // الصدفة لها الأولوية

  // Guard 1
  if ((env.NODE_ENV || "test") !== "test") fail(`Guard 1: NODE_ENV must be 'test'`);

  // Guard 2
  const url = env.DATABASE_URL;
  if (!url) fail("Guard 2: DATABASE_URL is not set");

  // Guard 3
  if (!url.includes("_test_")) fail("Guard 3: DATABASE_URL must contain '_test_'");

  // Guard 4
  for (const marker of ["ihris_manage", "ihris_prod", "ihris_production"]) {
    if (url.includes(marker)) fail(`Guard 4: DATABASE_URL contains '${marker}'`);
  }

  // Guard 5
  if (!url.includes("ihris_test_user")) fail("Guard 5: DATABASE_URL must use ihris_test_user");

  // Guard 6: actual connection
  const { Client } = require(path.join(backendDir, "node_modules", "pg"));
  const client = new Client({ connectionString: url });
  try {
    await client.connect();
    const res = await client.query("SELECT current_database() AS db");
    const db = res.rows[0].db;
    if (db !== "ihris_test_gap001") {
      fail(`Guard 6: connected to '${db}', expected 'ihris_test_gap001'`);
    }
  } catch (error) {
    fail(`Guard 6: connection failed (${error.message})`);
  } finally {
    await client.end().catch(() => {});
  }

  // Isolation proof: test user must NOT connect to production.
  const prodUrl = new URL(url);
  prodUrl.pathname = "/ihris_manage";
  const probe = new Client({ connectionString: prodUrl.toString() });
  try {
    await probe.connect();
    console.error("Isolation FAILED: ihris_test_user connected to ihris_manage");
    process.exit(1);
  } catch (error) {
    const message = String(error.message || "");
    if (!/permission denied|does not have CONNECT|no pg_hba/i.test(message)) {
      console.error(`Isolation check inconclusive: ${message}`);
      process.exit(1);
    }
  }

  console.log("Preflight passed: 6 guards + production isolation verified.");
})().catch((error) => {
  console.error(`Preflight crashed: ${error.message}`);
  process.exit(1);
});
