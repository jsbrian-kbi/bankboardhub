import type { ContentDomain } from "@/lib/content-domains";

export type RagSourceKind = "static" | "dynamic";

/** Long-lived reference material — reindex when content changes. */
export const STATIC_RAG_DOMAINS = [
  "regulation",
  "precedent",
  "supervisory-case",
  "global-standard",
  "resources",
] as const satisfies readonly ContentDomain[];

/** Time-sensitive material — freshness-weighted at query time. */
export const DYNAMIC_RAG_DOMAINS = ["news", "move"] as const satisfies readonly ContentDomain[];

export function getRagSourceKind(domain: string): RagSourceKind {
  if ((DYNAMIC_RAG_DOMAINS as readonly string[]).includes(domain)) return "dynamic";
  return "static";
}

export type RagQueryIntent = "static" | "dynamic" | "hybrid";

const DYNAMIC_QUERY_HINTS =
  /뉴스|속보|동향|인사|선임|취임|사임|최근|금주|이번|발표|이슈|브리핑|보도/i;
const STATIC_QUERY_HINTS =
  /법규|규정|판례|판결|검사|제재|모범관행|기준|가이드|체크|의무|요건|법령|감독/i;

/**
 * Infer whether the question should lean on static refs, dynamic news/moves, or both.
 */
export function inferRagQueryIntent(question: string): RagQueryIntent {
  const wantsDynamic = DYNAMIC_QUERY_HINTS.test(question);
  const wantsStatic = STATIC_QUERY_HINTS.test(question);

  if (wantsDynamic && !wantsStatic) return "dynamic";
  if (wantsStatic && !wantsDynamic) return "static";
  return "hybrid";
}

export function quotasForIntent(intent: RagQueryIntent, total: number) {
  if (intent === "static") {
    return { static: total, dynamic: 0 };
  }
  if (intent === "dynamic") {
    return { static: Math.max(1, Math.floor(total * 0.25)), dynamic: Math.max(1, total - 1) };
  }
  // Prefer durable governance sources, still surface recent context.
  const dynamic = Math.max(1, Math.floor(total * 0.35));
  return { static: total - dynamic, dynamic };
}
