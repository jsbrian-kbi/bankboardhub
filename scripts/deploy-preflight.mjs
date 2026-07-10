#!/usr/bin/env node

import { existsSync } from "node:fs";
import { execSync } from "node:child_process";
import { resolve } from "node:path";

const root = process.cwd();
const requiredFiles = [
  ".env.local",
  "supabase/schema.sql",
  "supabase/rls.sql",
  "supabase/auth-profile-trigger.sql",
  "supabase/storage.sql",
  "docs/deployment-guide.md",
];

let hasError = false;

console.log("배포 사전 점검\n");

for (const file of requiredFiles) {
  if (existsSync(resolve(root, file))) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} 없음`);
    hasError = true;
  }
}

try {
  execSync("npm run verify:env", { stdio: "inherit", cwd: root });
} catch {
  hasError = true;
}

try {
  execSync("npm run build", { stdio: "inherit", cwd: root });
} catch {
  hasError = true;
}

if (hasError) {
  console.error("\n배포 준비가 완료되지 않았습니다.");
  process.exit(1);
}

console.log("\n배포 준비 완료.");
console.log("다음 단계:");
console.log("1) git add . && git commit -m \"Prepare production deployment\"");
console.log("2) GitHub 저장소 생성 후 git push");
console.log("3) Vercel에서 Import → 환경변수 설정 → Deploy");
console.log("4) Supabase Auth Redirect URL에 /auth/callback 추가");
