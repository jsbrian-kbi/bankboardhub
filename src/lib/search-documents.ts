const SEARCH_STOP_WORDS = new Set([
  "관련",
  "핵심",
  "포인트",
  "요약",
  "알려",
  "해줘",
  "해주",
  "설명",
  "무엇",
  "어떻게",
  "대해",
  "대한",
  "하는",
  "있는",
  "없는",
  "가지",
  "것을",
  "것은",
  "것이",
  "있나요",
  "인가요",
  "해주세요",
  "주세요",
  "부탁",
]);

export function buildSearchKeywordAttempts(question: string) {
  const normalized = question.replace(/[?？!.。,，、]/g, " ").trim();
  const attempts = new Set<string>();

  if (normalized) attempts.add(normalized);

  const tokens = normalized
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2 && !SEARCH_STOP_WORDS.has(token));

  for (const token of tokens) attempts.add(token);
  if (tokens.length >= 2) attempts.add(tokens.slice(0, 2).join(" "));

  return [...attempts];
}

export async function searchDocumentsWithFallback(
  supabase: { rpc: (fn: string, args: Record<string, unknown>) => PromiseLike<{ data: unknown; error: { message: string } | null }> },
  question: string,
  matchCount = 6,
) {
  const attempts = buildSearchKeywordAttempts(question);

  for (const keyword of attempts) {
    const { data, error } = await supabase.rpc("search_documents", {
      keyword,
      match_count: matchCount,
    });

    if (error) {
      return { data: null, error };
    }

    const chunks = (data ?? []) as Array<{
      id: number;
      domain: string;
      title: string;
      snippet: string;
    }>;

    if (chunks.length > 0) {
      return { data: chunks, error: null };
    }
  }

  return { data: [] as Array<{ id: number; domain: string; title: string; snippet: string }>, error: null };
}
