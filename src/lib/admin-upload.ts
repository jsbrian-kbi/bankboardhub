import { randomUUID } from "node:crypto";
import { isContentDomain, type ContentDomain } from "@/lib/content-domains";

/** 파일 1개당 최대 크기 (앱 + Storage 버킷 한도와 맞춤) */
export const MAX_UPLOAD_MB = 50;
export const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;

export const ACCEPTED_EXTENSIONS = [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".hwp", ".txt", ".zip"] as const;

export function getFileExtension(fileName: string) {
  const match = fileName.toLowerCase().match(/(\.[a-z0-9]+)$/i);
  return match?.[1] ?? "";
}

export function isAcceptedUploadExtension(fileName: string) {
  const extension = getFileExtension(fileName);
  return ACCEPTED_EXTENSIONS.includes(extension as (typeof ACCEPTED_EXTENSIONS)[number]);
}

export function buildStorageObjectPath(domain: ContentDomain, fileName: string) {
  const extension = getFileExtension(fileName) || ".bin";
  return `${domain}/${Date.now()}-${randomUUID()}${extension}`;
}

export function parseUploadDomain(value: unknown) {
  const domain = String(value ?? "resources").trim();
  if (!isContentDomain(domain)) {
    return null;
  }
  return domain;
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}
