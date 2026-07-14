import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { searchRagDocuments } from "@/lib/rag-search";
import type { RagQueryIntent } from "@/lib/rag-source-kinds";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  if (!q) {
    return NextResponse.json({ error: "q 파라미터가 필요합니다." }, { status: 400 });
  }

  const intentParam = searchParams.get("intent")?.trim() as RagQueryIntent | undefined;
  const intent =
    intentParam === "static" || intentParam === "dynamic" || intentParam === "hybrid"
      ? intentParam
      : undefined;

  const matchCount = Math.min(Number(searchParams.get("limit") ?? 8) || 8, 20);
  const supabase = createAdminClient();
  const result = await searchRagDocuments(supabase, q, matchCount, intent);

  if (result.error) {
    return NextResponse.json({ error: result.error.message }, { status: 500 });
  }

  return NextResponse.json({
    query: q,
    intent: result.intent,
    mode: result.mode,
    chunks: result.data,
    next_step: "이 결과를 LLM prompt context로 주입하여 답변을 생성하세요.",
  });
}
