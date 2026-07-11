import { OFFICIAL_SOURCE_MAP, OFFICIAL_SOURCES, type OfficialSource } from "@/data/official-sources";
import type { OfficialSearchFeedError, OfficialSearchResult } from "@/lib/content-search-types";

const FETCH_TIMEOUT_MS = 10_000;
const MAX_ITEMS_PER_SOURCE = 40;
const DEFAULT_RESULT_LIMIT = 20;
const BROWSER_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const BROWSER_FETCH_HEADERS = {
  "User-Agent": BROWSER_USER_AGENT,
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
};

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

function getSearchableText(item: ParsedFeedItem) {
  return `${item.title} ${item.summary}`.trim();
}

function matchesToken(haystack: string, token: string) {
  const normalizedHaystack = haystack.toLocaleLowerCase("ko-KR");
  const normalizedToken = token.toLocaleLowerCase("ko-KR");
  return normalizedHaystack.includes(normalizedToken);
}

function matchesAllQueryTokens(item: ParsedFeedItem, tokens: string[]) {
  if (tokens.length === 0) return false;
  const searchable = getSearchableText(item);
  return tokens.every((token) => matchesToken(searchable, token));
}

function scoreItem(query: string, item: ParsedFeedItem) {
  const tokens = tokenizeQuery(query);
  if (tokens.length === 0) return 0;
  if (!matchesAllQueryTokens(item, tokens)) return 0;

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
  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        ...BROWSER_FETCH_HEADERS,
        Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, */*",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
  } catch (error) {
    throw new Error(
      error instanceof Error ? `피드 연결에 실패했습니다. (${error.message})` : "피드 연결에 실패했습니다.",
    );
  }

  if (!response.ok) {
    throw new Error(`피드를 가져오지 못했습니다. (${response.status})`);
  }

  const text = await response.text();
  if (!text || text.length < 50) {
    throw new Error("피드 응답이 비어 있습니다.");
  }

  if (text.includes("<html") || text.includes("<!DOCTYPE html")) {
    throw new Error("피드 대신 HTML 페이지가 반환되었습니다.");
  }

  if (/<Response>[\s\S]*?검증에 실패/i.test(text) || /<result>사용자 정보 검증에 실패/i.test(text)) {
    throw new Error("API 인증/IP 등록이 필요합니다.");
  }

  if (!text.includes("<")) {
    throw new Error("유효한 RSS/XML 응답이 아닙니다.");
  }

  return text;
}

async function fetchHtml(url: string) {
  let response: Response;
  try {
    response = await fetch(url, {
      headers: BROWSER_FETCH_HEADERS,
      redirect: "follow",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
  } catch (error) {
    throw new Error(
      error instanceof Error ? `페이지 연결에 실패했습니다. (${error.message})` : "페이지 연결에 실패했습니다.",
    );
  }

  if (!response.ok) {
    throw new Error(`페이지를 가져오지 못했습니다. (${response.status})`);
  }

  const text = await response.text();
  if (!text || text.length < 100) {
    throw new Error("페이지 응답이 비어 있습니다.");
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

function parseFssPressListHtml(html: string, baseUrl: string): ParsedFeedItem[] {
  const items: ParsedFeedItem[] = [];
  const rowPattern =
    /<td class="title"><a href="([^"]+)">([\s\S]*?)<\/a><\/td>[\s\S]*?<td>([^<]*)<\/td>\s*<td>\s*(\d{4}-\d{2}-\d{2})\s*<\/td>/gi;

  for (const match of html.matchAll(rowPattern)) {
    const href = decodeHtmlEntities(match[1]);
    const title = decodeHtmlEntities(match[2]);
    const department = decodeHtmlEntities(match[3]);
    const publishedAt = match[4];
    const url = href.startsWith("http") ? href : new URL(href, baseUrl).toString();

    if (!title || !url) continue;
    items.push({
      title,
      url,
      summary: department ? `금융감독원 · ${department}` : "금융감독원 보도자료",
      publishedAt,
    });
  }

  return items;
}

function parseFssApiXml(xml: string): ParsedFeedItem[] {
  const items: ParsedFeedItem[] = [];
  const rowBlocks = xml.match(/<list>[\s\S]*?<\/list>/gi) ?? xml.match(/<row>[\s\S]*?<\/row>/gi) ?? [];

  for (const block of rowBlocks) {
    const title =
      extractTagValue(block, "title") ||
      extractTagValue(block, "bodoTitle") ||
      extractTagValue(block, "subject");
    const url =
      extractTagValue(block, "url") ||
      extractTagValue(block, "link") ||
      extractTagValue(block, "bodoUrl");
    const summary =
      extractTagValue(block, "summary") ||
      extractTagValue(block, "content") ||
      extractTagValue(block, "bodoCn") ||
      "금융감독원 보도자료";
    const publishedAt =
      extractTagValue(block, "regDate") ||
      extractTagValue(block, "pubDate") ||
      extractTagValue(block, "bodoDate") ||
      null;

    if (!title) continue;
    items.push({
      title,
      url: url || "https://www.fss.or.kr/fss/bbs/B0000188/list.do?menuNo=200218",
      summary,
      publishedAt,
    });
  }

  return items;
}

function parseFssApiJson(payload: unknown): ParsedFeedItem[] {
  if (!payload || typeof payload !== "object") return [];

  const root = payload as Record<string, unknown>;
  const list =
    (Array.isArray(root.list) && root.list) ||
    (Array.isArray(root.result) && root.result) ||
    (Array.isArray(root.data) && root.data) ||
    (Array.isArray(root.items) && root.items) ||
    [];

  return list
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const row = entry as Record<string, unknown>;
      const title = String(row.title ?? row.bodoTitle ?? row.subject ?? "").trim();
      const url = String(row.url ?? row.link ?? row.bodoUrl ?? "").trim();
      const summary = String(row.summary ?? row.content ?? row.bodoCn ?? "금융감독원 보도자료").trim();
      const publishedAt = String(row.regDate ?? row.pubDate ?? row.bodoDate ?? "").trim() || null;

      if (!title) return null;
      return {
        title,
        url: url || "https://www.fss.or.kr/fss/bbs/B0000188/list.do?menuNo=200218",
        summary,
        publishedAt,
      } satisfies ParsedFeedItem;
    })
    .filter((item): item is ParsedFeedItem => Boolean(item));
}

function getFssOpenApiKey() {
  return process.env.FSS_OPEN_API_KEY?.trim() || process.env.FSS_AUTH_KEY?.trim() || "";
}

function getRecentDateRange(days = 90) {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - days);

  const format = (date: Date) => date.toISOString().slice(0, 10);
  return { startDate: format(start), endDate: format(end) };
}

async function searchRssSource(source: OfficialSource, query: string) {
  if (!source.feedUrl) {
    throw new Error("RSS 피드 URL이 없습니다.");
  }

  const xml = await fetchXml(source.feedUrl);
  const items = parseRssItems(xml);

  return items
    .map((item) => ({ item, score: scoreItem(query, item) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_ITEMS_PER_SOURCE)
    .map(({ item, score }) => ({ item, score }));
}

async function searchHtmlListSource(source: OfficialSource, query: string) {
  if (!source.listUrl) {
    throw new Error("목록 페이지 URL이 없습니다.");
  }

  const baseUrl = new URL(source.listUrl).origin;
  const pages = [1, 2];
  const items: ParsedFeedItem[] = [];

  for (const pageIndex of pages) {
    const pageUrl = new URL(source.listUrl);
    pageUrl.searchParams.set("pageIndex", String(pageIndex));
    const html = await fetchHtml(pageUrl.toString());
    items.push(...parseFssPressListHtml(html, baseUrl));
  }

  if (items.length === 0) {
    throw new Error("보도자료 목록을 읽지 못했습니다. 사이트 구조가 변경되었을 수 있습니다.");
  }

  const unique = new Map<string, ParsedFeedItem>();
  for (const item of items) {
    unique.set(normalizeUrl(item.url), item);
  }

  return Array.from(unique.values())
    .slice(0, MAX_ITEMS_PER_SOURCE)
    .map((item) => ({ item, score: scoreItem(query, item) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ item, score }) => ({ item, score }));
}

async function searchFssApiSource(source: OfficialSource, query: string) {
  const authKey = getFssOpenApiKey();
  if (!authKey) {
    throw new Error("FSS_OPEN_API_KEY 환경 변수가 설정되지 않았습니다.");
  }

  const { startDate, endDate } = getRecentDateRange();
  const url = new URL("https://www.fss.or.kr/fss/kr/openApi/api/bodoInfo.jsp");
  url.searchParams.set("apiType", "json");
  url.searchParams.set("startDate", startDate);
  url.searchParams.set("endDate", endDate);
  url.searchParams.set("authKey", authKey);

  const response = await fetch(url.toString(), {
    headers: {
      ...BROWSER_FETCH_HEADERS,
      Accept: "application/json, application/xml, text/xml, */*",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`금융감독원 API 호출에 실패했습니다. (${response.status})`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  let items: ParsedFeedItem[] = [];

  if (contentType.includes("json")) {
    items = parseFssApiJson(await response.json());
  } else {
    items = parseFssApiXml(await response.text());
  }

  return items
    .slice(0, MAX_ITEMS_PER_SOURCE)
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

  return items
    .map((item) => ({ item, score: scoreItem(query, item) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ item, score }) => ({ item, score }));
}

async function searchSource(source: OfficialSource, query: string) {
  if (source.kind === "fss-api") {
    return searchFssApiSource(source, query);
  }
  if (source.kind === "law-api") {
    return searchLawSource(source, query);
  }
  if (source.kind === "html-list") {
    return searchHtmlListSource(source, query);
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
      if (source.requiresApiKey && !getFssOpenApiKey()) {
        return;
      }

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
