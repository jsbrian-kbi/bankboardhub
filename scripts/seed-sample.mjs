#!/usr/bin/env node

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

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

const documents = [
  {
    domain: "news",
    title: "금융위, 지배구조 가이드라인 개정 추진",
    body: "금융회사 지배구조 관련 공시 의무가 강화될 예정입니다.",
    source_name: "금융위원회",
    published_at: "2026-07-01",
  },
  {
    domain: "regulation",
    title: "금융회사지배구조법 제16조 (이사회 구성)",
    body: "은행의 이사회는 사외이사를 포함하여 구성하여야 한다.",
    source_name: "금융회사지배구조법",
    published_at: "2024-01-01",
  },
  {
    domain: "precedent",
    title: "사외이사 주의의무 위반 관련 주요 쟁점",
    body: "사외이사의 주의의무 범위와 내부통제 관련 책임이 쟁점이 되었습니다.",
    source_name: "대법원",
    published_at: "2025-03-12",
  },
  {
    domain: "supervisory-case",
    title: "내부통제 미흡에 대한 검사 지적 사례",
    body: "이사회 보고체계 및 리스크 모니터링 절차 미비가 지적되었습니다.",
    source_name: "금융감독원",
    published_at: "2025-11-20",
  },
  {
    domain: "move",
    title: "○○은행 사외이사 신규 선임",
    body: "전문가 출신 사외이사 1인이 신규 선임되었습니다.",
    source_name: "KB금융",
    published_at: "2026-06-15",
  },
  {
    domain: "global-standard",
    title: "OECD Corporate Governance Principles",
    body: "이사회의 독립성·책임성·투명성 강화를 핵심 원칙으로 제시합니다.",
    source_name: "OECD",
    published_at: null,
  },
  {
    domain: "resources",
    title: "이사회 운영 모범규준 요약본",
    body: "이사회 의장·사외이사 역할, 위원회 운영, 정보 제공 체계를 정리한 자료입니다.",
    source_name: "내부통제위원회",
    published_at: "2026-01-10",
  },
];

const banks = [
  { name: "KB금융", board_size: 11, outside_director_count: 6, female_ratio: 27.3, term_status: "정기" },
  { name: "신한금융지주", board_size: 10, outside_director_count: 5, female_ratio: 30.0, term_status: "정기" },
  { name: "하나금융지주", board_size: 9, outside_director_count: 5, female_ratio: 22.2, term_status: "정기" },
];

const educationPrograms = [
  {
    title: "사외이사 핵심교육 2026",
    track: "사외이사 교육",
    starts_at: "2026-09-01T09:00:00+09:00",
    capacity: 30,
    description: "지배구조·내부통제·리스크관리 통합 과정",
  },
  {
    title: "감사위원회 실무 워크숍",
    track: "위원회 교육",
    starts_at: "2026-10-15T14:00:00+09:00",
    capacity: 20,
    description: "감사위원회 운영 및 내부통제 점검 실무",
  },
];

let insertedDocuments = 0;
let skippedDocuments = 0;

for (const doc of documents) {
  const { data: existing } = await supabase
    .from("documents")
    .select("id")
    .eq("domain", doc.domain)
    .eq("title", doc.title)
    .maybeSingle();

  if (existing) {
    skippedDocuments += 1;
    continue;
  }

  const { error } = await supabase.from("documents").insert({ ...doc, is_public: true });
  if (error) {
    console.error(`❌ 문서 삽입 실패 (${doc.title}): ${error.message}`);
    process.exit(1);
  }
  insertedDocuments += 1;
}

const { error: bankError } = await supabase.from("banks").upsert(banks, { onConflict: "name" });
if (bankError) {
  console.error(`❌ 은행 데이터 실패: ${bankError.message}`);
  process.exit(1);
}

let insertedEducation = 0;
for (const program of educationPrograms) {
  const { data: existing } = await supabase
    .from("education_programs")
    .select("id")
    .eq("title", program.title)
    .maybeSingle();

  if (existing) continue;

  const { error } = await supabase.from("education_programs").insert(program);
  if (error) {
    console.error(`❌ 교육 과정 실패 (${program.title}): ${error.message}`);
    process.exit(1);
  }
  insertedEducation += 1;
}

const { count: documentCount } = await supabase.from("documents").select("id", { count: "exact", head: true });
const { count: bankCount } = await supabase.from("banks").select("id", { count: "exact", head: true });
const { count: educationCount } = await supabase.from("education_programs").select("id", { count: "exact", head: true });

console.log("✅ 샘플 데이터 적용 완료");
console.log(`- documents: +${insertedDocuments} (skip ${skippedDocuments}), total ${documentCount ?? 0}`);
console.log(`- banks: upsert ${banks.length}, total ${bankCount ?? 0}`);
console.log(`- education: +${insertedEducation}, total ${educationCount ?? 0}`);
