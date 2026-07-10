#!/usr/bin/env node

const baseUrl = process.argv[2]?.replace(/\/$/, "");

if (!baseUrl) {
  console.error("사용법: node scripts/verify-production.mjs https://your-app.vercel.app");
  process.exit(1);
}

const paths = [
  { path: "/api/health", name: "Health Check" },
  { path: "/", name: "Home" },
  { path: "/login", name: "Login" },
  { path: "/news", name: "News" },
  { path: "/search", name: "Search" },
  { path: "/robots.txt", name: "Robots" },
  { path: "/sitemap.xml", name: "Sitemap" },
];

let failed = false;

console.log(`프로덕션 검증: ${baseUrl}\n`);

for (const item of paths) {
  try {
    const response = await fetch(`${baseUrl}${item.path}`, { redirect: "manual" });
    const ok = response.status >= 200 && response.status < 400;
    console.log(`${ok ? "✅" : "❌"} ${item.name} (${item.path}) → ${response.status}`);
    if (!ok) failed = true;

    if (item.path === "/api/health" && ok) {
      const payload = await response.json();
      console.log(`   supabase: ${payload.supabase}, openai: ${payload.openai}`);
      if (payload.supabase !== "configured") failed = true;
    }
  } catch (error) {
    console.log(`❌ ${item.name} (${item.path}) → ${error instanceof Error ? error.message : "error"}`);
    failed = true;
  }
}

console.log("\n다음 수동 확인:");
console.log(`- ${baseUrl}/login 에서 관리자 로그인`);
console.log(`- ${baseUrl}/admin 접속`);
console.log("- Supabase Auth Redirect URL에 /auth/callback 등록 여부");

if (failed) {
  process.exit(1);
}

console.log("\n기본 프로덕션 검증 통과.");
