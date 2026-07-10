const MAX_HTML_BYTES = 512_000;

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function extractMetaContent(html: string, key: string) {
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name)=["']${key}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${key}["']`, "i"),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      return decodeHtmlEntities(match[1]);
    }
  }

  return "";
}

function extractTitle(html: string) {
  const ogTitle = extractMetaContent(html, "og:title");
  if (ogTitle) return ogTitle;

  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return titleMatch?.[1] ? decodeHtmlEntities(titleMatch[1]) : "";
}

function extractDescription(html: string) {
  const candidates = ["og:description", "description", "twitter:description"];
  for (const key of candidates) {
    const value = extractMetaContent(html, key);
    if (value) return value;
  }
  return "";
}

function extractSiteName(html: string, fallback: string) {
  const siteName = extractMetaContent(html, "og:site_name");
  if (siteName) return siteName;

  try {
    return new URL(fallback).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export async function fetchUrlMetadata(url: string) {
  const parsed = new URL(url);
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("http 또는 https URL만 지원합니다.");
  }

  const response = await fetch(parsed.toString(), {
    headers: {
      "User-Agent": "BankBoardHubBot/1.0",
      Accept: "text/html,application/xhtml+xml",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(12_000),
  });

  if (!response.ok) {
    throw new Error(`웹페이지를 가져오지 못했습니다. (${response.status})`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
    throw new Error("HTML 웹페이지 URL만 등록할 수 있습니다.");
  }

  const html = (await response.text()).slice(0, MAX_HTML_BYTES);
  const title = extractTitle(html);
  const description = extractDescription(html);
  const siteName = extractSiteName(html, parsed.toString());

  if (!title && !description) {
    throw new Error("페이지 제목이나 설명을 찾지 못했습니다. 직접 입력해주세요.");
  }

  return {
    title: title || parsed.hostname,
    description: description || `${title || parsed.hostname} 웹페이지`,
    siteName,
    canonicalUrl: parsed.toString(),
  };
}
