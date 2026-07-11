#!/usr/bin/env node

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const email = process.argv[2]?.trim().toLowerCase();

if (!email || !email.includes("@")) {
  console.error("사용법: npm run promote:admin -- your-email@example.com");
  process.exit(1);
}

const envPath = resolve(process.cwd(), ".env.local");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const index = line.indexOf("=");
    const key = line.slice(0, index);
    const value = line.slice(index + 1);
    if (!process.env[key]) process.env[key] = value;
  }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("❌ .env.local에 NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY가 필요합니다.");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

const { data: authUser, error: authError } = await supabase.auth.admin.listUsers({
  page: 1,
  perPage: 1000,
});

if (authError) {
  console.error(`❌ auth.users 조회 실패: ${authError.message}`);
  process.exit(1);
}

const user = authUser.users.find((item) => item.email?.toLowerCase() === email);

if (!user) {
  console.error(`❌ ${email} 계정이 auth.users에 없습니다. 먼저 /login 에서 회원가입하세요.`);
  process.exit(1);
}

if (!user.email_confirmed_at) {
  console.error(`❌ ${email} 계정은 이메일 인증이 완료되지 않았습니다.`);
  process.exit(1);
}

const { error: profileError } = await supabase.from("profiles").upsert(
  {
    id: user.id,
    email,
    full_name: user.user_metadata?.full_name ?? email.split("@")[0],
    role: "admin",
  },
  { onConflict: "id" },
);

if (profileError) {
  console.error(`❌ profiles 업데이트 실패: ${profileError.message}`);
  process.exit(1);
}

const { data: profile, error: verifyError } = await supabase
  .from("profiles")
  .select("email, role")
  .eq("id", user.id)
  .maybeSingle();

if (verifyError || profile?.role !== "admin") {
  console.error("❌ admin 승격 확인에 실패했습니다.");
  process.exit(1);
}

console.log(`✅ ${email} 계정을 admin으로 승격했습니다.`);
console.log("다음 단계:");
console.log("- https://bankboardhub.vercel.app/login 에서 로그인");
console.log("- https://bankboardhub.vercel.app/admin/content-agent 접속");
