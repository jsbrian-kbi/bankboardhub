#!/usr/bin/env node

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const envPath = resolve(process.cwd(), ".env.local");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const index = line.indexOf("=");
    const key = line.slice(0, index);
    const value = line.slice(index + 1);
    process.env[key] = value;
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const siteUrl = (process.argv[2] ?? process.env.NEXT_PUBLIC_SITE_URL ?? "https://bankboardhub.vercel.app").replace(/\/$/, "");

const expectedRedirects = [
  `${siteUrl}/**`,
  `${siteUrl}/auth/callback`,
  "http://127.0.0.1:3000/**",
  "http://127.0.0.1:3000/auth/callback",
];

if (!supabaseUrl || !anonKey) {
  console.error("❌ NEXT_PUBLIC_SUPABASE_URL / ANON_KEY가 필요합니다.");
  process.exit(1);
}

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

console.log(`Supabase Auth 설정 점검\n- Project: ${supabaseUrl}\n- Site URL (기대값): ${siteUrl}\n`);

try {
  const settingsResponse = await fetch(`${supabaseUrl}/auth/v1/settings`, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
    },
  });

  if (!settingsResponse.ok) {
    fail(`Auth settings 조회 실패 (${settingsResponse.status})`);
  } else {
    const settings = await settingsResponse.json();
    if (settings.external?.email) {
      pass("이메일 로그인(Email provider) 활성화됨");
    } else {
      fail("이메일 로그인(Email provider) 비활성화됨");
    }

    if (settings.disable_signup) {
      warn("회원가입(signup)이 비활성화되어 있습니다.");
    } else {
      pass("회원가입(signup) 허용됨");
    }

    if (settings.mailer_autoconfirm) {
      warn("mailer_autoconfirm=true (이메일 인증 없이 가입 가능)");
    } else {
      pass("이메일 인증 필요(mailer_autoconfirm=false)");
    }
  }
} catch (error) {
  fail(`Auth settings 조회 오류: ${error instanceof Error ? error.message : "error"}`);
}

async function checkRedirect(label, redirectTo) {
  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/recover`, {
      method: "POST",
      headers: {
        apikey: anonKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "auth.redirect.check@gmail.com",
        redirect_to: redirectTo,
      }),
    });

    const text = await response.text();
    let payload = {};
    try {
      payload = text ? JSON.parse(text) : {};
    } catch {
      payload = { raw: text };
    }

    const message = JSON.stringify(payload).toLowerCase();
    if (message.includes("redirect") && (message.includes("not allowed") || message.includes("invalid"))) {
      return { ok: false, detail: payload.msg ?? payload.error_description ?? text };
    }

    return { ok: true, status: response.status, detail: payload.msg ?? payload.error_code ?? "accepted" };
  } catch (error) {
    return { ok: false, detail: error instanceof Error ? error.message : "error" };
  }
}

console.log("\nRedirect URL 허용 여부 (recover API 기준):");

for (const redirect of [`${siteUrl}/auth/callback`, "http://127.0.0.1:3000/auth/callback"]) {
  const result = await checkRedirect(redirect, redirect);
  if (result.ok) {
    pass(`${redirect} → ${result.detail}`);
  } else {
    fail(`${redirect} → ${result.detail}`);
  }
}

const blocked = await checkRedirect("invalid", "https://not-allowed.example.com/auth/callback");
if (!blocked.ok) {
  pass("허용되지 않은 redirect URL은 거부됨 (정상)");
} else {
  warn("허용되지 않은 redirect URL도 accept 응답 — Dashboard Redirect URLs 직접 확인 필요");
}

console.log("\n앱(Auth route) 점검:");
for (const path of [`${siteUrl}/login`, `${siteUrl}/auth/callback`]) {
  try {
    const response = await fetch(path, { redirect: "manual" });
    if (response.status >= 200 && response.status < 400 || response.status === 307) {
      pass(`${path} → ${response.status}`);
    } else {
      fail(`${path} → ${response.status}`);
    }
  } catch (error) {
    fail(`${path} → ${error instanceof Error ? error.message : "error"}`);
  }
}

console.log("\nDashboard에서 확인할 값:");
console.log(`Site URL: ${siteUrl}`);
for (const redirect of expectedRedirects) {
  console.log(`Redirect URL: ${redirect}`);
}
console.log(
  "\nDashboard: https://supabase.com/dashboard/project/jqihncwypxkxtmlipgtc/auth/url-configuration",
);

console.log("\n참고:");
console.log("- 이메일/비밀번호 로그인(/api/auth/login)은 Redirect URL 없이도 동작할 수 있습니다.");
console.log("- Redirect URL은 이메일 인증·비밀번호 재설정·OAuth callback에 필요합니다.");
console.log("- Dashboard Redirect URLs 목록은 공개 API로 직접 조회할 수 없습니다.");

if (failed) {
  process.exit(1);
}

console.log("\nSupabase Auth 기본 점검 통과 (Dashboard Redirect URLs는 수동 확인 권장).");
