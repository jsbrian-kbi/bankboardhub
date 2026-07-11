import { OFFICIAL_SOURCE_MAP, OFFICIAL_SOURCES, type OfficialSource } from "@/data/official-sources";
import type { OfficialSearchFeedError, OfficialSearchResult } from "@/lib/content-search-types";

const FETCH_TIMEOUT_MS = 10_000;
const MAX_ITEMS_PER_SOURCE = 40;
const DEFAULT_RESULT_LIMIT = 20;

export interface SearchOfficialSourcesInput {
  query: string;
  sourceIds?: string[];
  limit?: number;
}

interface ParsedFeedItem {
  title: string;
  url: string;
  summary: string;
  publishedAt: string | null;
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTagValue(block: string, tag: string) {
  const pattern = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i");
  const match = block.match(pattern);
  if (!match?.[1]) return "";
  return decodeHtmlEntities(match[1]);
}

function extractLinkValue(block: string) {
  const cdataLink = block.match(/<link[^>]*>\s*<!\[CDATA\[([^\]]+)\]\]>\s*<\/link>/i);
  if (cdataLink?.[1]) return decodeHtmlEntities(cdataLink[1]);

  const hrefLink =
    block.match(/<link[^>]+href=["']([^"']+)["'][^>]*\/?>/i) ??
    block.match(/<link[^>]*>\s*([^<\s]+)\s*<\/link>/i);
  if (hrefLink?.[1]) return decodeHtmlEntities(hrefLink[1]);

  return "";
}

function parseRssItems(xml: string): ParsedFeedItem[] {
  const items: ParsedFeedItem[] = [];
  const itemBlocks = xml.match(/<item[\s\S]*?<\/item>/gi) ?? [];

  for (const block of itemBlocks) {
    const title = extractTagValue(block, "title");
    const url = extractLinkValue(block);
    const summary = extractTagValue(block, "description") || extractTagValue(block, "summary");
    const publishedAt = extractTagValue(block, "pubDate") || extractTagValue(block, "updated") || null;

    if (!title || !url) continue;
    items.push({ title, url, summary, publishedAt });
  }

  if (items.length > 0) return items;

  const entryBlocks = xml.match(/<entry[\s\S]*?<\/entry>/gi) ?? [];
  for (const block of entryBlocks) {
    const title = extractTagValue(block, "title");
    const url = extractLinkValue(block);
    const summary = extractTagValue(block, "summary") || extractTagValue(block, "content");
    const publishedAt = extractTagValue(block, "updated") || extractTagValue(block, "published") || null;

    if (!title || !url) continue;
    items.push({ title, url, summary, publishedAt });
  }

  return items;
}

function tokenizeQuery(query: string) {
  return query
    .trim()
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2);
}

function matchesToken(haystack: string, token: string) {
  const normalizedHaystack = haystack.toLocaleLowerCase("ko-KR");
  const normalizedToken = token.toLocaleLowerCase("ko-KR");
  return normalizedHaystack.includes(normalizedToken);
}

function scoreItem(query: string, item: ParsedFeedItem) {
  const tokens = tokenizeQuery(query);
  if (tokens.length === 0) return 0;

  const title = item.title;
  const summary = item.summary;
  let score = 0;

  for (const token of tokens) {
    if (matchesToken(title, token)) {
      score += 3;
    } else if (matchesToken(summary, token)) {
      score += 1;
    }
  }

  return score;
}

function normalizeUrl(url: string) {
  try {
    const parsed = new URL(url);
    parsed.hash = "";
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return url.trim();
  }
}

function buildResultId(sourceId: string, url: string) {
  return `${sourceId}:${normalizeUrl(url)}`;
}

async function fetchXml(url: string) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "BankBoardHubBot/1.0 (+https://bankboardhub.vercel.app)",
      Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, */*",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`피드를 가져오지 못했습니다. (${response.status})`);
  }

  const text = await response.text();
  if (!text.includes("<") || text.includes("<html")) {
    throw new Error("유효한 RSS/XML 응답이 아닙니다.");
  }

  return text;
}

function getLawGoKrOc() {
  return process.env.LAW_GO_KR_OC?.trim() || "bankboardhub";
}

function parseLawSearchXml(xml: string): ParsedFeedItem[] {
  const items: ParsedFeedItem[] = [];
  const lawBlocks = xml.match(/<law[\s\S]*?<\/law>/gi) ?? [];

  for (const block of lawBlocks) {
    const title = extractTagValue(block, "법령명한글");
    const detailPath = extractTagValue(block, "법령상세링크");
    const agency = extractTagValue(block, "소관부처명");
    const lawType = extractTagValue(block, "법령구분명");
    const effectiveDate = extractTagValue(block, "시행일자");
    const publishedDate = extractTagValue(block, "공포일자");

    if (!title || !detailPath) continue;

    const url = detailPath.startsWith("http") ? detailPath : `https://www.law.go.kr${detailPath}`;
    const summary = [agency, lawType].filter(Boolean).join(" · ") || "국가법령정보센터 법령";
    const publishedAt = formatLawDate(publishedDate || effectiveDate);

    items.push({ title, url, summary, publishedAt });
  }

  return items;
}

function formatLawDate(value: string | null) {
  if (!value || value.length !== 8) return value;
  return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
}

async function searchRssSource(source: OfficialSource, query: string) {
  if (!source.feedUrl) {
    throw new Error("RSS 피드 URL이 없습니다.");
  }

  const xml = await fetchXml(source.feedUrl);
  const items = parseRssItems(xml).slice(0, MAX_ITEMS_PER_SOURCE);

  return items
    .map((item) => ({ item, score: scoreItem(query, item) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ item, score }) => ({ item, score }));
}

async function searchLawSource(source: OfficialSource, query: string) {
  const oc = getLawGoKrOc();
  const url = new URL("https://www.law.go.kr/DRF/lawSearch.do");
  url.searchParams.set("OC", oc);
  url.searchParams.set("target", "law");
  url.searchParams.set("type", "XML");
  url.searchParams.set("query", query);
  url.searchParams.set("display", String(MAX_ITEMS_PER_SOURCE));

  const xml = await fetchXml(url.toString());
  const items = parseLawSearchXml(xml);

  return items.map((item) => ({
    item,
    score: scoreItem(query, item) || 1,
  }));
}

async function searchSource(source: OfficialSource, query: string) {
  if (source.kind === "law-api") {
    return searchLawSource(source, query);
  }
  return searchRssSource(source, query);
}

export async function searchOfficialSources(input: SearchOfficialSourcesInput) {
  const query = input.query.trim();
  const limit = input.limit ?? DEFAULT_RESULT_LIMIT;

  if (!query) {
    throw new Error("검색어를 입력해주세요.");
  }

  const selectedSources = (input.sourceIds?.length
    ? input.sourceIds.map((id) => OFFICIAL_SOURCE_MAP[id]).filter(Boolean)
    : OFFICIAL_SOURCES) as OfficialSource[];

  if (selectedSources.length === 0) {
    throw new Error("검색할 공식 출처를 찾지 못했습니다.");
  }

  const feedErrors: OfficialSearchFeedError[] = [];
  const matched: Array<{ source: OfficialSource; item: ParsedFeedItem; score: number }> = [];

  await Promise.all(
    selectedSources.map(async (source) => {
      try {
        const results = await searchSource(source, query);
        for (const result of results) {
          matched.push({ source, item: result.item, score: result.score });
        }
      } catch (error) {
        feedErrors.push({
          sourceId: source.id,
          sourceName: source.name,
          error: error instanceof Error ? error.message : "검색에 실패했습니다.",
        });
      }
    }),
  );

  matched.sort((a, b) => b.score - a.score);

  const deduped = new Map<string, { source: OfficialSource; item: ParsedFeedItem; score: number }>();
  for (const entry of matched) {
    const key = normalizeUrl(entry.item.url);
    const existing = deduped.get(key);
    if (!existing || entry.score > existing.score) {
      deduped.set(key, entry);
    }
  }

  const topResults = Array.from(deduped.values()).slice(0, limit);

  const results: OfficialSearchResult[] = topResults.map(({ source, item, score }) => ({
    id: buildResultId(source.id, item.url),
    title: item.title,
    url: normalizeUrl(item.url),
    summary: item.summary,
    publishedAt: item.publishedAt,
    sourceId: source.id,
    sourceName: source.name,
    suggestedDomains: source.suggestedDomains,
    alreadyRegistered: false,
    score,
  }));

  return {
    results,
    feedErrors,
    query,
  };
}

export function markRegisteredResults(
  results: OfficialSearchResult[],
  registeredUrls: Set<string>,
): OfficialSearchResult[] {
  return results.map((result) => ({
    ...result,
    alreadyRegistered: registeredUrls.has(normalizeUrl(result.url)),
  }));
}

export { normalizeUrl };
