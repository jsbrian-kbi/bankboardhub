import type { ContentDomain } from "@/lib/content-domains";

export type OfficialSourceKind = "rss" | "law-api";

export interface OfficialSource {
  id: string;
  name: string;
  kind: OfficialSourceKind;
  homepageUrl: string;
  region: "kr" | "intl";
  suggestedDomains: ContentDomain[];
  feedUrl?: string;
}

export const OFFICIAL_SOURCES: OfficialSource[] = [
  {
    id: "sec-press",
    name: "미국 SEC 보도자료",
    kind: "rss",
    feedUrl: "https://www.sec.gov/news/pressreleases.rss",
    homepageUrl: "https://www.sec.gov/",
    region: "intl",
    suggestedDomains: ["regulation", "global-standard", "news"],
  },
  {
    id: "fed-press",
    name: "미국 연준(FRB) 보도자료",
    kind: "rss",
    feedUrl: "https://www.federalreserve.gov/feeds/press_all.xml",
    homepageUrl: "https://www.federalreserve.gov/",
    region: "intl",
    suggestedDomains: ["regulation", "global-standard", "news"],
  },
  {
    id: "ecb-press",
    name: "유럽중앙은행(ECB) 보도자료",
    kind: "rss",
    feedUrl: "https://www.ecb.europa.eu/rss/press.html",
    homepageUrl: "https://www.ecb.europa.eu/",
    region: "intl",
    suggestedDomains: ["regulation", "global-standard", "news"],
  },
  {
    id: "hankyung-economy",
    name: "한국경제 (경제)",
    kind: "rss",
    feedUrl: "https://www.hankyung.com/feed/economy",
    homepageUrl: "https://www.hankyung.com/",
    region: "kr",
    suggestedDomains: ["news", "move"],
  },
  {
    id: "etnews-finance",
    name: "전자신문 (금융·증권)",
    kind: "rss",
    feedUrl: "https://rss.etnews.com/Section901.xml",
    homepageUrl: "https://www.etnews.com/",
    region: "kr",
    suggestedDomains: ["news", "supervisory-case"],
  },
  {
    id: "law-go-kr",
    name: "국가법령정보센터",
    kind: "law-api",
    homepageUrl: "https://www.law.go.kr/",
    region: "kr",
    suggestedDomains: ["regulation"],
  },
];

export const OFFICIAL_SOURCE_MAP = Object.fromEntries(
  OFFICIAL_SOURCES.map((source) => [source.id, source]),
) as Record<string, OfficialSource>;
