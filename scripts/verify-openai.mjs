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
    if (!process.env[key]) process.env[key] = value;
  }
}

const apiKey = process.env.OPENAI_API_KEY?.trim();
const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";

if (!apiKey) {
  console.error("❌ OPENAI_API_KEY가 .env.local에 없습니다.");
  console.error("   OpenAI Dashboard에서 키를 발급한 뒤 .env.local에 추가하세요.");
  process.exit(1);
}

const response = await fetch("https://api.openai.com/v1/chat/completions", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model,
    temperature: 0,
    max_tokens: 32,
    messages: [
      { role: "user", content: "한국어로 '연결 성공'이라고만 답하세요." },
    ],
  }),
});

if (!response.ok) {
  const detail = await response.text();
  console.error("❌ OpenAI API 호출 실패");
  console.error(detail.slice(0, 500));
  process.exit(1);
}

const payload = await response.json();
const text = payload.choices?.[0]?.message?.content?.trim();
console.log("✅ OpenAI 연동 성공");
console.log(`- model: ${model}`);
console.log(`- test response: ${text ?? "(empty)"}`);
console.log("\nVercel에도 OPENAI_API_KEY, OPENAI_MODEL을 설정한 뒤 Redeploy 하세요.");
