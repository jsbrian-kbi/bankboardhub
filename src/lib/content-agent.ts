import { getOpenAiModel, isOpenAiConfigured } from "@/lib/openai-config";
import { normalizeWebsiteUrl } from "@/lib/admin-content-schema";
import { CONTENT_DOMAINS, type ContentDomain, isContentDomain } from "@/lib/content-domains";
import type { ContentAgentResult, ContentDraft } from "@/lib/content-agent-types";
import { fetchUrlMetadata } from "@/lib/url-metadata";
import { createAdminClient } from "@/lib/supabase-admin";
import { searchDocumentsWithFallback } from "@/lib/search-documents";

export type { ContentAgentResult, ContentDraft } from "@/lib/content-agent-types";

interface GenerateDraftInput {
  message: string;
  url?: string;
  domainHint?: ContentDomain;
}

function extractJsonObject(text: string) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1]?.trim() ?? text.trim();
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new Error("JSON 응답을 파싱하지 못했습니다.");
  }
  return JSON.parse(candidate.slice(start, end + 1)) as Record<string, unknown>;
}

function guessDomainFromText(message: string, hint?: ContentDomain): ContentDomain {
  if (hint) return hint;

  const text = message.toLowerCase();
  if (text.includes("판례") || text.includes("대법원") || text.includes("법원")) return "precedent";
  if (text.includes("검사") || text.includes("감독") || text.includes("금감원")) return "supervisory-case";
  if (text.includes("법규") || text.includes("법령") || text.includes("조문") || text.includes("규정")) {
    return "regulation";
  }
  if (text.includes("인사") || text.includes("선임") || text.includes("사임") || text.includes("재선임")) {
    return "move";
  }
  if (text.includes("oecd") || text.includes("bcbs") || text.includes("bis") || text.includes("국제")) {
    return "global-standard";
  }
  if (text.includes("뉴스") || text.includes("기사") || text.includes("보도")) return "news";
  if (text.includes("자료") || text.includes("보고서") || text.includes("pdf")) return "resources";
  return "resources";
}

function buildRulesDraft(
  message: string,
  domainHint: ContentDomain | undefined,
  urlMeta?: Awaited<ReturnType<typeof fetchUrlMetadata>>,
): ContentDraft {
  const domain = guessDomainFromText(message, domainHint);
  const title = (urlMeta?.title ?? message.slice(0, 80)) || "등록 예정 콘텐츠";
  const body = urlMeta?.description ?? `${title} 관련 자료입니다.`;

  return {
    domain,
    title,
    body,
    source_name: urlMeta?.siteName ?? null,
    source_url: urlMeta?.canonicalUrl ?? null,
    published_at: null,
  };
}

async function generateDraftWithLlm(
  message: string,
  domainHint: ContentDomain | undefined,
  urlMeta?: Awaited<ReturnType<typeof fetchUrlMetadata>>,
): Promise<{ draft: ContentDraft; confidence: "high" | "medium" | "low"; reasoning: string }> {
  const domainGuide = CONTENT_DOMAINS.map((domain) => `- ${domain}`).join("\n");

  const urlContext = urlMeta
    ? `\n\nURL 메타데이터:\n- title: ${urlMeta.title}\n- description: ${urlMeta.description}\n- site: ${urlMeta.siteName}\n- url: ${urlMeta.canonicalUrl}`
    : "";

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: getOpenAiModel(),
      temperature: 0.2,
      max_tokens: 900,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `당신은 Bank Board Governance Hub 관리자 콘텐츠 등록 도우미입니다.
관리자가 입력한 설명과 URL 정보를 바탕으로 등록 초안 JSON만 생성하세요.

허용 domain:
${domainGuide}

반드시 아래 JSON 형식만 반환:
{
  "domain": "news|regulation|precedent|supervisory-case|move|global-standard|resources",
  "title": "문서 제목",
  "body": "요약/본문 (3~6문장)",
  "source_name": "출처/기관명 또는 null",
  "source_url": "원문 URL 또는 null",
  "published_at": "YYYY-MM-DD 또는 null",
  "confidence": "high|medium|low",
  "reasoning": "domain과 필드를 이렇게 정한 이유 (한국어 1~2문장)"
}

규칙:
- 추측은 최소화하고 입력/URL 근거를 우선하세요.
- domainHint가 있으면 우선 반영하되 내용과 맞지 않으면 수정 가능.
- published_at은 확실할 때만 넣으세요.`,
        },
        {
          role: "user",
          content: `domainHint: ${domainHint ?? "없음"}\n관리자 요청: ${message}${urlContext}`,
        },
      ],
    }),
    signal: AbortSignal.timeout(45_000),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail.slice(0, 300));
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = payload.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("AI 초안을 생성하지 못했습니다.");
  }

  const parsed = extractJsonObject(content);
  const domain = String(parsed.domain ?? "");
  if (!isContentDomain(domain)) {
    throw new Error("AI가 유효하지 않은 domain을 반환했습니다.");
  }

  const confidence = parsed.confidence === "high" || parsed.confidence === "low" ? parsed.confidence : "medium";

  return {
    draft: {
      domain,
      title: String(parsed.title ?? urlMeta?.title ?? "등록 예정 콘텐츠").trim(),
      body: String(parsed.body ?? urlMeta?.description ?? "").trim() || "등록 예정 콘텐츠",
      source_name: parsed.source_name ? String(parsed.source_name).trim() : urlMeta?.siteName ?? null,
      source_url: parsed.source_url ? String(parsed.source_url).trim() : urlMeta?.canonicalUrl ?? null,
      published_at: parsed.published_at ? String(parsed.published_at).trim() : null,
    },
    confidence,
    reasoning: String(parsed.reasoning ?? "AI가 초안을 생성했습니다.").trim(),
  };
}

export async function generateContentDraft(input: GenerateDraftInput): Promise<ContentAgentResult> {
  const message = input.message.trim();
  if (!message) {
    throw new Error("등록 요청 내용을 입력해주세요.");
  }

  let urlMeta: Awaited<ReturnType<typeof fetchUrlMetadata>> | undefined;
  if (input.url?.trim()) {
    urlMeta = await fetchUrlMetadata(normalizeWebsiteUrl(input.url));
  }

  let draft: ContentDraft;
  let confidence: "high" | "medium" | "low" = "medium";
  let reasoning = "규칙 기반 초안을 생성했습니다.";
  let mode: "llm" | "rules" = "rules";

  if (isOpenAiConfigured()) {
    try {
      const llmResult = await generateDraftWithLlm(message, input.domainHint, urlMeta);
      draft = llmResult.draft;
      confidence = llmResult.confidence;
      reasoning = llmResult.reasoning;
      mode = "llm";
    } catch {
      draft = buildRulesDraft(message, input.domainHint, urlMeta);
      confidence = "low";
      reasoning = "AI 생성에 실패하여 URL/키워드 기반 초안을 제공합니다.";
    }
  } else {
    draft = buildRulesDraft(message, input.domainHint, urlMeta);
    confidence = urlMeta ? "medium" : "low";
    reasoning = "OpenAI 미설정 상태에서 URL/키워드 기반 초안을 생성했습니다.";
  }

  const supabase = createAdminClient();
  const searchKeyword = draft.title || message;
  const { data: similar } = await searchDocumentsWithFallback(supabase, searchKeyword, 3);

  return {
    draft,
    confidence,
    reasoning,
    similarDocuments: (similar ?? []).map((item) => ({
      id: item.id,
      title: item.title,
      domain: item.domain,
    })),
    mode,
  };
}
