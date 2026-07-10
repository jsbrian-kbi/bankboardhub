#!/usr/bin/env node

import { execSync, spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const port = process.env.PORT ?? "3000";
const host = process.env.HOST ?? "127.0.0.1";
const root = process.cwd();

function run(command) {
  execSync(command, { stdio: "inherit", cwd: root });
}

try {
  run(`lsof -nP -iTCP:${port} -sTCP:LISTEN -t | xargs kill 2>/dev/null || true`);
} catch {
  // No process on the port.
}

if (!existsSync(resolve(root, ".env.local"))) {
  console.error("❌ .env.local 파일이 없습니다.");
  process.exit(1);
}

console.log("🔨 Building...");
run("npm run build");

console.log(`🚀 Starting server on http://${host}:${port}`);
const child = spawn("npm", ["run", "start", "--", "--hostname", host, "--port", port], {
  cwd: root,
  stdio: "inherit",
  shell: true,
});

child.on("exit", (code) => process.exit(code ?? 0));
