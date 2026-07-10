#!/usr/bin/env node

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const envPath = resolve(process.cwd(), ".env.local");
const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
];
const optional = ["OPENAI_API_KEY", "OPENAI_MODEL"];

if (!existsSync(envPath)) {
  console.error("❌ .env.local 파일이 없습니다. cp .env.example .env.local 후 값을 입력하세요.");
  process.exit(1);
}

const content = readFileSync(envPath, "utf8");
const values = Object.fromEntries(
  content
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .map((line) => {
      const index = line.indexOf("=");
      return [line.slice(0, index), line.slice(index + 1)];
    }),
);

let hasError = false;

for (const key of required) {
  if (!values[key]) {
    console.error(`❌ ${key} 가 비어 있습니다.`);
    hasError = true;
  } else {
    console.log(`✅ ${key}`);
  }
}

for (const key of optional) {
  if (!values[key]) {
    console.warn(`⚠️  ${key} (선택) 미설정`);
  } else {
    console.log(`✅ ${key}`);
  }
}

if (hasError) {
  process.exit(1);
}

console.log("\n환경변수 검증 완료. npm run build 후 배포할 수 있습니다.");
