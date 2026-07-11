import type { ContentDomain } from "@/lib/content-domains";

export interface OfficialSearchResult {
  id: string;
  title: string;
  url: string;
  summary: string;
  publishedAt: string | null;
  sourceId: string;
  sourceName: string;
  suggestedDomains: ContentDomain[];
  alreadyRegistered: boolean;
  score: number;
}

export interface OfficialSearchFeedError {
  sourceId: string;
  sourceName: string;
  error: string;
}

export interface OfficialSearchResponse {
  results: OfficialSearchResult[];
  feedErrors: OfficialSearchFeedError[];
  query: string;
}
