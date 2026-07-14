import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin-auth";
import { DYNAMIC_RAG_DOMAINS, STATIC_RAG_DOMAINS, type RagSourceKind } from "@/lib/rag-source-kinds";
import { indexDocument, type IndexableDocument } from "@/lib/rag-index";
import { isOpenAiConfigured } from "@/lib/openai-config";
import { createAdminClient } from "@/lib/supabase-admin";

const schema = z.object({
  source_kind: z.enum(["static", "dynamic", "all"]).default("all"),
  limit: z.number().int().min(1).max(500).optional(),
  document_id: z.number().int().positive().optional(),
});

export async function POST(request: Request) {
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;

  if (!isOpenAiConfigured()) {
    return NextResponse.json({ error: "OPENAI_API_KEY가 필요합니다." }, { status: 400 });
  }

  const json = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "유효하지 않은 요청" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { source_kind, limit = 100, document_id } = parsed.data;

  let query = supabase
    .from("documents")
    .select("id, domain, title, body, published_at")
    .eq("is_public", true)
    .order("id", { ascending: true })
    .limit(limit);

  if (document_id) {
    query = query.eq("id", document_id);
  } else if (source_kind === "static") {
    query = query.in("domain", [...STATIC_RAG_DOMAINS]);
  } else if (source_kind === "dynamic") {
    query = query.in("domain", [...DYNAMIC_RAG_DOMAINS]);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const docs = (data ?? []) as IndexableDocument[];
  const results: Array<{ id: number; chunks: number; source_kind: RagSourceKind; error?: string }> = [];

  for (const doc of docs) {
    try {
      const indexed = await indexDocument(doc);
      results.push({
        id: doc.id,
        chunks: indexed.chunkCount,
        source_kind: (indexed.sourceKind ?? "static") as RagSourceKind,
      });
    } catch (err) {
      results.push({
        id: doc.id,
        chunks: 0,
        source_kind: "static",
        error: err instanceof Error ? err.message : "index failed",
      });
    }
  }

  const indexed = results.filter((row) => !row.error).length;
  const failed = results.filter((row) => row.error).length;
  const chunkTotal = results.reduce((sum, row) => sum + row.chunks, 0);

  return NextResponse.json({
    message: `RAG 색인 완료: ${indexed}건 성공, ${failed}건 실패, chunk ${chunkTotal}개`,
    source_kind,
    indexed,
    failed,
    chunkTotal,
    results,
  });
}

export async function GET() {
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;

  const supabase = createAdminClient();
  const { count: chunkCount, error: chunkError } = await supabase
    .from("document_chunks")
    .select("id", { count: "exact", head: true });

  if (chunkError) {
    return NextResponse.json(
      {
        ready: false,
        error: chunkError.message,
        hint: "Supabase SQL Editor에서 supabase/rag-vector.sql 을 실행하세요.",
      },
      { status: 200 },
    );
  }

  const { count: staticCount } = await supabase
    .from("document_chunks")
    .select("id", { count: "exact", head: true })
    .eq("source_kind", "static");
  const { count: dynamicCount } = await supabase
    .from("document_chunks")
    .select("id", { count: "exact", head: true })
    .eq("source_kind", "dynamic");

  return NextResponse.json({
    ready: true,
    chunkCount: chunkCount ?? 0,
    bySourceKind: { static: staticCount ?? 0, dynamic: dynamicCount ?? 0 },
    staticDomains: STATIC_RAG_DOMAINS,
    dynamicDomains: DYNAMIC_RAG_DOMAINS,
  });
}
