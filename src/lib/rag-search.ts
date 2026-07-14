import { createEmbedding } from "@/lib/embeddings";
import { isOpenAiConfigured } from "@/lib/openai-config";
import {
  inferRagQueryIntent,
  quotasForIntent,
  type RagQueryIntent,
  type RagSourceKind,
} from "@/lib/rag-source-kinds";
import { searchDocumentsWithFallback } from "@/lib/search-documents";

export type RagSearchHit = {
  id: number;
  domain: string;
  title: string;
  snippet: string;
  source_kind?: RagSourceKind;
  score?: number;
  retrieval?: "vector" | "fts";
};

type SupabaseLike = {
  rpc: (
    fn: string,
    args: Record<string, unknown>,
  ) => PromiseLike<{ data: unknown; error: { message: string } | null }>;
};

type MatchRow = {
  chunk_id: number;
  document_id: number;
  domain: string;
  source_kind: RagSourceKind;
  title: string;
  content: string;
  score: number;
};

async function matchBySourceKind(
  supabase: SupabaseLike,
  embedding: number[],
  sourceKind: RagSourceKind,
  matchCount: number,
) {
  if (matchCount <= 0) return [] as MatchRow[];

  const { data, error } = await supabase.rpc("match_document_chunks", {
    query_embedding: embedding,
    match_count: matchCount,
    filter_source_kind: sourceKind,
    filter_domains: null,
  });

  if (error) {
    // Table/RPC not applied yet — caller falls back to FTS.
    if (/could not find|does not exist|PGRST|function|match_document/i.test(error.message)) {
      return null;
    }
    throw new Error(error.message);
  }

  return (data ?? []) as MatchRow[];
}

function normalizeTitleKey(title: string) {
  return title.replace(/\s+/g, " ").trim().toLowerCase();
}

function dedupeByDocument(rows: MatchRow[], limit: number): RagSearchHit[] {
  const seenIds = new Set<number>();
  const seenTitles = new Set<string>();
  const hits: RagSearchHit[] = [];

  for (const row of rows) {
    if (seenIds.has(row.document_id)) continue;
    const titleKey = `${row.domain}::${normalizeTitleKey(row.title)}`;
    if (seenTitles.has(titleKey)) continue;
    seenIds.add(row.document_id);
    seenTitles.add(titleKey);
    hits.push({
      id: row.document_id,
      domain: row.domain,
      title: row.title,
      snippet: row.content.slice(0, 280),
      source_kind: row.source_kind,
      score: row.score,
      retrieval: "vector",
    });
    if (hits.length >= limit) break;
  }

  return hits;
}

function dedupeHits(hits: RagSearchHit[], limit: number): RagSearchHit[] {
  const seenTitles = new Set<string>();
  const out: RagSearchHit[] = [];
  for (const hit of hits) {
    const titleKey = `${hit.domain}::${normalizeTitleKey(hit.title)}`;
    if (seenTitles.has(titleKey)) continue;
    seenTitles.add(titleKey);
    out.push(hit);
    if (out.length >= limit) break;
  }
  return out;
}

export async function searchRagDocuments(
  supabase: SupabaseLike,
  question: string,
  matchCount = 6,
  intentOverride?: RagQueryIntent,
): Promise<{ data: RagSearchHit[]; error: { message: string } | null; mode: "vector" | "fts"; intent: RagQueryIntent }> {
  const intent = intentOverride ?? inferRagQueryIntent(question);

  if (isOpenAiConfigured()) {
    try {
      const embedding = await createEmbedding(question);
      const quotas = quotasForIntent(intent, matchCount);

      const staticRows = await matchBySourceKind(supabase, embedding, "static", Math.max(quotas.static * 3, quotas.static));
      if (staticRows === null) {
        // Schema not ready
      } else {
        const dynamicRows = await matchBySourceKind(
          supabase,
          embedding,
          "dynamic",
          Math.max(quotas.dynamic * 3, quotas.dynamic),
        );

        if (dynamicRows === null) {
          // schema missing for one call — use FTS
        } else {
          const staticHits = dedupeByDocument(staticRows, quotas.static * 2);
          const dynamicHits = dedupeByDocument(dynamicRows, quotas.dynamic * 2);
          const merged = dedupeHits(
            [...staticHits, ...dynamicHits].sort((a, b) => (b.score ?? 0) - (a.score ?? 0)),
            matchCount,
          );

          if (merged.length > 0) {
            return {
              data: merged,
              error: null,
              mode: "vector",
              intent,
            };
          }
        }
      }
    } catch (error) {
      console.error("[rag-search] vector failed, falling back to FTS", error);
    }
  }

  const fts = await searchDocumentsWithFallback(supabase, question, matchCount);
  return {
    data: (fts.data ?? []).map((row) => ({ ...row, retrieval: "fts" as const })),
    error: fts.error,
    mode: "fts",
    intent,
  };
}
