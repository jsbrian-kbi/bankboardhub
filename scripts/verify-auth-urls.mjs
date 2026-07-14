#!/usr/bin/env node
/**
 * Auth callback / Site URL 설정 안내와 프로덕션 콜백 라우트 스모크 체크.
 * Supabase Dashboard의 Redirect URL 목록은 API로 조회할 수 없으므로 수동 확인이 필요합니다.
 *
 * Usage: npm run verify:auth-urls -- https://bankboardhub.vercel.app
 */

const baseUrl = (process.argv[2] || "https://bankboardhub.vercel.app").replace(/\/$/, "");
const hostname = new URL(baseUrl).hostname;

const requiredRedirects = [
  `${baseUrl}/**`,
  `${baseUrl}/auth/callback`,
  "http://127.0.0.1:3000/**",
  "http://127.0.0.1:3000/auth/callback",
];

console.log(`Auth URL 점검 가이드: ${baseUrl}\n`);
console.log("Supabase Dashboard → Authentication → URL Configuration");
console.log("https://supabase.com/dashboard/project/jqihncwypxkxtmlipgtc/auth/url-configuration\n");
console.log("권장 Site URL:");
console.log(`  ${baseUrl}\n`);
console.log("권장 Redirect URLs:");
for (const url of requiredRedirects) {
  console.log(`  ${url}`);
}

console.log("\n라우트 스모크 테스트...");
try {
  const response = await fetch(`${baseUrl}/auth/callback`, { redirect: "manual" });
  const ok = response.status === 307 || response.status === 302;
  console.log(`${ok ? "✅" : "❌"} ${baseUrl}/auth/callback → ${response.status}`);
  if (!ok) process.exit(1);
} catch (error) {
  console.error(`❌ auth/callback 요청 실패: ${error instanceof Error ? error.message : error}`);
  process.exit(1);
}

console.log("\n수동으로 확인할 항목:");
console.log(`1. Site URL이 ${baseUrl} 인지`);
console.log("2. Redirect URLs에 위 4개 URL이 포함되는지");
console.log(`3. Vercel NEXT_PUBLIC_SITE_URL=${baseUrl}`);
console.log(`4. ${baseUrl}/login 에서 로그인 → /admin 진입`);
console.log(`\n참고: sitemap/robots 도메인은 ${hostname} 이어야 합니다.`);
