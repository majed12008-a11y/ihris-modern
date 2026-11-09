#!/usr/bin/env node
/** Sprint 5.5 — runs backend Jest with NODE_ENV=test explicitly. */
const path = require("path");
const { spawnSync } = require("child_process");

const backendDir = path.resolve(__dirname, "../backend");
const jestBin = path.join(backendDir, "node_modules", "jest", "bin", "jest.js");

const result = spawnSync(process.execPath, [jestBin, "--runInBand", ...process.argv.slice(2)], {
  cwd: backendDir,
  stdio: "inherit",
  env: { ...process.env, NODE_ENV: "test" },
});

process.exit(result.status === null ? 1 : result.status);
