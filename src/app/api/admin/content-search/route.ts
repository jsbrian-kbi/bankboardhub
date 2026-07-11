import { NextResponse } from "next/server";
import { z } from "zod";
import { OFFICIAL_SOURCE_MAP } from "@/data/official-sources";
import { requireAdminApi } from "@/lib/admin-auth";
import { markRegisteredResults, normalizeUrl, searchOfficialSources } from "@/lib/rss-search";
import { createAdminClient } from "@/lib/supabase-admin";

const requestSchema = z.object({
  query: z.string().trim().min(2),
  sources: z.array(z.string().trim()).optional(),
  limit: z.number().int().min(1).max(50).optional(),
});

async function getRegisteredUrlSet(urls: string[]) {
  if (urls.length === 0) return new Set<string>();

  const admin = createAdminClient();
  const normalized = urls.map((url) => normalizeUrl(url));
  const { data, error } = await admin.from("documents").select("source_url").in("source_url", normalized);

  if (error) {
    throw new Error("기존 등록 URL 확인에 실패했습니다.");
  }

  return new Set((data ?? []).map((row) => (row.source_url ? normalizeUrl(row.source_url) : "")).filter(Boolean));
}

export async function POST(request: Request) {
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;

  const json = await request.json();
  const parsed = requestSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: "검색어는 2자 이상 입력해주세요." }, { status: 400 });
  }

  const sourceIds = parsed.data.sources?.filter((id) => Boolean(OFFICIAL_SOURCE_MAP[id]));
  if (parsed.data.sources?.length && !sourceIds?.length) {
    return NextResponse.json({ error: "선택한 공식 출처를 찾지 못했습니다." }, { status: 400 });
  }

  try {
    const searchResult = await searchOfficialSources({
      query: parsed.data.query,
      sourceIds,
      limit: parsed.data.limit,
    });

    const registeredUrls = await getRegisteredUrlSet(searchResult.results.map((item) => item.url));
    const results = markRegisteredResults(searchResult.results, registeredUrls);

    return NextResponse.json({
      ...searchResult,
      results,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "공식 출처 검색에 실패했습니다." },
      { status: 400 },
    );
  }
}
