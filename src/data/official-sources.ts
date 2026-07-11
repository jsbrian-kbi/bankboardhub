import type { ContentDomain } from "@/lib/content-domains";

export type OfficialSourceKind = "rss" | "law-api" | "html-list" | "fss-api";

export interface OfficialSource {
  id: string;
  name: string;
  kind: OfficialSourceKind;
  homepageUrl: string;
  region: "kr" | "intl";
  suggestedDomains: ContentDomain[];
  feedUrl?: string;
  listUrl?: string;
  requiresApiKey?: boolean;
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
    id: "fss-press",
    name: "금융감독원 보도자료",
    kind: "html-list",
    listUrl: "https://www.fss.or.kr/fss/bbs/B0000188/list.do?menuNo=200218",
    homepageUrl: "https://www.fss.or.kr/",
    region: "kr",
    suggestedDomains: ["news", "supervisory-case", "regulation"],
  },
  {
    id: "fsc-press",
    name: "금융위원회 보도자료",
    kind: "rss",
    feedUrl: "https://www.fsc.go.kr/about/fsc_bbs_rss/?fid=0111",
    homepageUrl: "https://www.fsc.go.kr/",
    region: "kr",
    suggestedDomains: ["news", "regulation"],
  },
  {
    id: "fsc-briefing",
    name: "금융위원회 보도설명",
    kind: "rss",
    feedUrl: "https://www.fsc.go.kr/about/fsc_bbs_rss/?fid=0112",
    homepageUrl: "https://www.fsc.go.kr/",
    region: "kr",
    suggestedDomains: ["news", "regulation", "supervisory-case"],
  },
  {
    id: "dart-disclosure",
    name: "금융감독원 DART (최근공시)",
    kind: "rss",
    feedUrl: "https://dart.fss.or.kr/api/todayRSS.xml",
    homepageUrl: "https://dart.fss.or.kr/",
    region: "kr",
    suggestedDomains: ["regulation", "news", "resources"],
  },
  {
    id: "fss-open-api",
    name: "금융감독원 보도자료 API",
    kind: "fss-api",
    homepageUrl: "https://www.fss.or.kr/",
    region: "kr",
    suggestedDomains: ["news", "supervisory-case", "regulation"],
    requiresApiKey: true,
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
