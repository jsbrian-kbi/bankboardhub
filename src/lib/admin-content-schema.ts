import { z } from "zod";

export function normalizeWebsiteUrl(input: string) {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error("URL을 입력해주세요.");
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

export function formatZodError(error: z.ZodError) {
  const issue = error.issues[0];
  if (!issue) return "유효하지 않은 요청입니다.";

  const field = issue.path[0];
  const fieldLabels: Record<string, string> = {
    domain: "메뉴",
    title: "제목",
    body: "요약",
    url: "URL",
    source_url: "원문 링크",
  };

  const label = fieldLabels[String(field)] ?? String(field);
  if (issue.code === "too_small") {
    return `${label}을(를) 입력해주세요.`;
  }
  if (issue.code === "invalid_format") {
    return `${label} 형식이 올바르지 않습니다.`;
  }

  return issue.message;
}

const optionalText = z.preprocess((value) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}, z.string().optional());

const optionalUrl = z.preprocess((value) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}, z.string().url().optional());

export const contentCreateSchema = z
  .object({
    domain: z.string().trim().min(1),
    title: z.string().trim().min(1),
    body: optionalText,
    source_name: optionalText,
    source_url: optionalUrl,
    published_at: optionalText,
    is_public: z.boolean().optional(),
  })
  .transform((data) => ({
    ...data,
    body: data.body ?? data.title,
    source_name: data.source_name ?? null,
    source_url: data.source_url ?? null,
    published_at: data.published_at ?? null,
  }));

export const contentUpdateSchema = z
  .object({
    title: z.preprocess((value) => {
      if (typeof value !== "string") return value;
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    }, z.string().optional()),
    body: optionalText,
    source_name: optionalText,
    source_url: optionalUrl,
    published_at: optionalText,
    is_public: z.boolean().optional(),
  })
  .transform((data) => {
    const next = {
      ...data,
      source_name: data.source_name ?? null,
      source_url: data.source_url ?? null,
      published_at: data.published_at ?? null,
    };

    if (data.body === undefined && data.title) {
      return next;
    }

    return {
      ...next,
      body: data.body ?? data.title,
    };
  });

export const websiteImportSchema = z.object({
  domain: z.string().trim().min(1),
  url: z.string().trim().min(1),
  title: optionalText,
  body: optionalText,
  source_name: optionalText,
  preview: z.boolean().optional(),
});
