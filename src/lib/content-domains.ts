export const CONTENT_DOMAINS = [
  "news",
  "regulation",
  "precedent",
  "supervisory-case",
  "move",
  "global-standard",
  "resources",
] as const;

export type ContentDomain = (typeof CONTENT_DOMAINS)[number];

export function isContentDomain(value: string): value is ContentDomain {
  return CONTENT_DOMAINS.includes(value as ContentDomain);
}

export function isStorageFileUrl(url: string) {
  return /\/storage\/v1\/object\/public\/resources\//i.test(url) || /\.(pdf|docx?|xlsx?|pptx?|hwp|zip)$/i.test(url);
}

export function getSourceTypeLabel(sourceUrl: string) {
  if (!sourceUrl) return "메타만";
  return isStorageFileUrl(sourceUrl) ? "파일" : "웹사이트";
}
