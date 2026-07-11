import type { ContentDomain } from "@/lib/content-domains";

export const DOMAIN_LABELS: Record<ContentDomain, string> = {
  news: "뉴스",
  regulation: "법규",
  precedent: "판례",
  "supervisory-case": "검사사례",
  move: "인사동정",
  "global-standard": "국제기준",
  resources: "자료실",
};

export interface ContentDraft {
  domain: ContentDomain;
  title: string;
  body: string;
  source_name: string | null;
  source_url: string | null;
  published_at: string | null;
}

export interface ContentAgentResult {
  draft: ContentDraft;
  confidence: "high" | "medium" | "low";
  reasoning: string;
  similarDocuments: Array<{ id: number; title: string; domain: string }>;
  mode: "llm" | "rules";
}
