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
  { path: "/resources", name: "Resources" },
  { path: "/regulation", name: "Regulation" },
  { path: "/ai-assistant", name: "AI Assistant" },
  { path: "/robots.txt", name: "Robots" },
  { path: "/sitemap.xml", name: "Sitemap" },
];

const protectedPaths = [
  { path: "/admin", name: "Admin (auth required)" },
  { path: "/admin/content-agent", name: "Admin Content Agent (auth required)" },
  { path: "/api/admin/content?domain=news", name: "Admin API (auth required)" },
];

let failed = false;

function pass(message) {
  console.log(`✅ ${message}`);
}

function warn(message) {
  console.log(`⚠️  ${message}`);
}

function fail(message) {
  console.log(`❌ ${message}`);
  failed = true;
}

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

    if (item.path === "/sitemap.xml" && ok) {
      const xml = await response.text();
      const hostname = new URL(baseUrl).hostname;
      if (xml.includes(hostname)) {
        console.log(`   sitemap domain: ${hostname}`);
      } else {
        warn(`sitemap이 ${hostname}이 아닌 URL을 사용 중입니다.`);
        failed = true;
      }
    }
  } catch (error) {
    fail(`${item.name} (${item.path}) → ${error instanceof Error ? error.message : "error"}`);
  }
}

console.log("");
for (const item of protectedPaths) {
  try {
    const response = await fetch(`${baseUrl}${item.path}`, { redirect: "manual" });
    const protectedOk = response.status === 307 || response.status === 401 || response.status === 403;
    console.log(`${protectedOk ? "✅" : "❌"} ${item.name} → ${response.status}`);
    if (!protectedOk) failed = true;
  } catch (error) {
    fail(`${item.name} → ${error instanceof Error ? error.message : "error"}`);
  }
}

try {
  const callback = await fetch(`${baseUrl}/auth/callback`, { redirect: "manual" });
  const callbackOk = callback.status === 307;
  console.log(`${callbackOk ? "✅" : "❌"} Auth callback route → ${callback.status}`);
  if (!callbackOk) failed = true;
} catch (error) {
  fail(`Auth callback route → ${error instanceof Error ? error.message : "error"}`);
}

try {
  const ragResponse = await fetch(`${baseUrl}/api/rag/search?q=${encodeURIComponent("사외이사")}`);
  if (ragResponse.ok) {
    const payload = await ragResponse.json();
    const mode = payload.mode ?? "unknown";
    const count = Array.isArray(payload.chunks) ? payload.chunks.length : 0;
    pass(`RAG Search API → mode: ${mode}, chunks: ${count}, intent: ${payload.intent ?? "-"}`);
    if (mode !== "vector") {
      warn("벡터 검색이 아닙니다. supabase/rag-vector.sql 적용 및 npm run index:rag 를 확인하세요.");
    }
  } else {
    fail(`RAG Search API → ${ragResponse.status}`);
  }
} catch (error) {
  fail(`RAG Search API → ${error instanceof Error ? error.message : "error"}`);
}

try {
  const aiResponse = await fetch(`${baseUrl}/api/ai-assistant`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question: "사외이사 독립성 관련 규정" }),
  });
  if (aiResponse.ok) {
    const payload = await aiResponse.json();
    pass(
      `AI Assistant API → mode: ${payload.mode}, retrieval: ${payload.retrievalCount ?? 0}, retrievalMode: ${payload.retrievalMode ?? "n/a"}`,
    );
    if (!payload.openaiConfigured) warn("OpenAI가 프로덕션에서 미설정입니다.");
    if (payload.retrievalMode && payload.retrievalMode !== "vector") {
      warn("AI Assistant가 FTS 폴백 중입니다. 벡터 색인 상태를 확인하세요.");
    }
  } else {
    fail(`AI Assistant API → ${aiResponse.status}`);
  }
} catch (error) {
  fail(`AI Assistant API → ${error instanceof Error ? error.message : "error"}`);
}

console.log("\n다음 수동 확인:");
console.log(`- ${baseUrl}/login 에서 관리자 로그인`);
console.log(`- ${baseUrl}/admin 접속`);
console.log("- Supabase Auth Redirect URL에 /auth/callback 등록 여부");
console.log(`  https://supabase.com/dashboard/project/jqihncwypxkxtmlipgtc/auth/url-configuration`);

if (failed) {
  process.exit(1);
}

console.log("\n기본 프로덕션 검증 통과.");
