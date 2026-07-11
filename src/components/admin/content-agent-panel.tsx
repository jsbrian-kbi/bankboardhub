"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CONTENT_DOMAINS, type ContentDomain } from "@/lib/content-domains";
import { OFFICIAL_SOURCES } from "@/data/official-sources";
import { DOMAIN_LABELS, type ContentDraft } from "@/lib/content-agent-types";
import type { OfficialSearchResponse, OfficialSearchResult } from "@/lib/content-search-types";

const examplePrompts = [
  "금융감독원 내부통제 검사 지적 사례 URL을 검사사례 메뉴에 등록",
  "OECD Corporate Governance Principles 요약을 국제기준에 추가",
  "사외이사 주의의무 관련 최근 뉴스 기사 등록",
];

const adminPaths: Record<ContentDomain, string> = {
  news: "/admin/news",
  regulation: "/admin/regulation",
  precedent: "/admin/precedents",
  "supervisory-case": "/admin/supervisory-cases",
  move: "/admin/moves",
  "global-standard": "/admin/global-standards",
  resources: "/admin/documents",
};

interface AgentResponse {
  draft: ContentDraft;
  confidence: "high" | "medium" | "low";
  reasoning: string;
  similarDocuments: Array<{ id: number; title: string; domain: string }>;
  mode: "llm" | "rules";
}

export function ContentAgentPanel() {
  const [message, setMessage] = useState("");
  const [url, setUrl] = useState("");
  const [domainHint, setDomainHint] = useState<ContentDomain | "">("");
  const [draft, setDraft] = useState<ContentDraft | null>(null);
  const [meta, setMeta] = useState<Pick<AgentResponse, "confidence" | "reasoning" | "similarDocuments" | "mode"> | null>(
    null,
  );
  const [status, setStatus] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<OfficialSearchResult[]>([]);
  const [searchErrors, setSearchErrors] = useState<OfficialSearchResponse["feedErrors"]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const domainOptions = useMemo(
    () => CONTENT_DOMAINS.map((domain) => ({ value: domain, label: DOMAIN_LABELS[domain] })),
    [],
  );

  const searchOfficialSources = async () => {
    const query = searchQuery.trim();
    if (query.length < 2) {
      setStatus("공식 출처 검색어는 2자 이상 입력해주세요.");
      return;
    }

    setIsSearching(true);
    setStatus("");
    setSearchResults([]);
    setSearchErrors([]);

    const response = await fetch("/api/admin/content-search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });

    const result = (await response.json()) as OfficialSearchResponse & { error?: string };
    setIsSearching(false);

    if (!response.ok) {
      setStatus(result.error ?? "공식 출처 검색에 실패했습니다.");
      return;
    }

    setSearchResults(result.results);
    setSearchErrors(result.feedErrors);

    if (result.results.length === 0) {
      setStatus("검색 결과가 없습니다. 다른 키워드를 시도해주세요.");
      return;
    }

    setStatus(`${result.results.length}건의 공식 출처 결과를 찾았습니다. 항목을 선택해 초안을 만드세요.`);
  };

  const applySearchResult = (result: OfficialSearchResult) => {
    const suggestedDomain = result.suggestedDomains[0] ?? "";
    setUrl(result.url);
    setDomainHint(suggestedDomain);
    setMessage(`${result.title} — ${result.sourceName} 자료를 등록`);
    setSearchQuery(result.title);
    setStatus("선택한 결과로 등록 요청이 채워졌습니다. 초안 생성을 눌러주세요.");
  };

  const generateDraft = async (prompt?: string) => {
    const nextMessage = (prompt ?? message).trim();
    if (!nextMessage) {
      setStatus("등록할 내용을 설명해주세요.");
      return;
    }

    setMessage(nextMessage);
    setIsGenerating(true);
    setStatus("");

    const response = await fetch("/api/admin/content-agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: nextMessage,
        url: url.trim() || undefined,
        domain: domainHint || undefined,
      }),
    });

    const result = (await response.json()) as AgentResponse & { error?: string };
    setIsGenerating(false);

    if (!response.ok) {
      setStatus(result.error ?? "초안 생성에 실패했습니다.");
      return;
    }

    setDraft(result.draft);
    setMeta({
      confidence: result.confidence,
      reasoning: result.reasoning,
      similarDocuments: result.similarDocuments,
      mode: result.mode,
    });
    setStatus("초안이 생성되었습니다. 내용을 확인한 뒤 저장하세요.");
  };

  const updateDraftField = (field: keyof ContentDraft, value: string) => {
    if (!draft) return;
    setDraft({
      ...draft,
      [field]: value,
    });
  };

  const saveDraft = async () => {
    if (!draft) {
      setStatus("먼저 초안을 생성해주세요.");
      return;
    }

    if (!draft.title.trim()) {
      setStatus("제목을 입력해주세요.");
      return;
    }

    setIsSaving(true);
    setStatus("");

    const response = await fetch("/api/admin/content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        domain: draft.domain,
        title: draft.title.trim(),
        body: draft.body.trim() || draft.title.trim(),
        source_name: draft.source_name?.trim() || undefined,
        source_url: draft.source_url?.trim() || undefined,
        published_at: draft.published_at?.trim() || undefined,
      }),
    });

    const result = (await response.json()) as { error?: string; message?: string };
    setIsSaving(false);

    if (!response.ok) {
      setStatus(result.error ?? "저장에 실패했습니다.");
      return;
    }

    setStatus(result.message ?? "저장되었습니다.");
    setDraft(null);
    setMeta(null);
    setMessage("");
    setUrl("");
  };

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>공식 출처에서 찾기</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <p className="text-sm text-slate-600">
            SEC·연준·ECB RSS, 국가법령정보센터, 국내 금융 뉴스 RSS 등 화이트리스트 출처에서 무료로 검색합니다.
          </p>

          <label className="grid gap-1 text-sm text-slate-700">
            검색어
            <input
              className="h-10 rounded-md border border-slate-300 px-3"
              placeholder="예: 내부통제, bank, corporate governance"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void searchOfficialSources();
                }
              }}
            />
          </label>

          <div className="flex flex-wrap gap-2 text-xs text-slate-500">
            {OFFICIAL_SOURCES.map((source) => (
              <span key={source.id} className="rounded-full border border-slate-200 px-2 py-1">
                {source.name}
              </span>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => void searchOfficialSources()} disabled={isSearching || isGenerating || isSaving}>
              {isSearching ? "검색 중..." : "공식 출처 검색"}
            </Button>
          </div>

          {searchErrors.length > 0 ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              <p className="font-medium">일부 출처 검색에 실패했습니다.</p>
              <ul className="mt-2 list-disc pl-5">
                {searchErrors.map((item) => (
                  <li key={item.sourceId}>
                    {item.sourceName}: {item.error}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {searchResults.length > 0 ? (
            <div className="grid gap-2">
              {searchResults.map((result) => (
                <div key={result.id} className="rounded-md border border-slate-200 p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="grid gap-1">
                      <p className="font-medium text-slate-900">{result.title}</p>
                      <p className="text-xs text-slate-500">
                        {result.sourceName}
                        {result.publishedAt ? ` · ${result.publishedAt}` : ""}
                      </p>
                      {result.summary ? <p className="text-sm text-slate-600">{result.summary.slice(0, 180)}</p> : null}
                      <a href={result.url} target="_blank" rel="noreferrer" className="text-xs text-blue-700 hover:underline">
                        {result.url}
                      </a>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {result.alreadyRegistered ? <Badge className="border border-amber-200 bg-amber-50 text-amber-900">등록됨</Badge> : null}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => applySearchResult(result)}
                        disabled={isGenerating || isSaving}
                      >
                        선택
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>콘텐츠 등록 도우미</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <p className="text-sm text-slate-600">
            등록할 자료를 자연어로 설명하면 AI가 메뉴·제목·요약 초안을 만들어 줍니다. 저장 전에 반드시 확인하세요.
          </p>

          <label className="grid gap-1 text-sm text-slate-700">
            등록 요청
            <textarea
              className="min-h-28 rounded-md border border-slate-300 px-3 py-2"
              placeholder="예: 금융감독원 내부통제 검사 지적 사례를 검사사례 메뉴에 등록"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </label>

          <label className="grid gap-1 text-sm text-slate-700">
            원문 URL (선택)
            <input
              className="h-10 rounded-md border border-slate-300 px-3"
              placeholder="https://example.com/article"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </label>

          <label className="grid gap-1 text-sm text-slate-700">
            메뉴 힌트 (선택)
            <select
              className="h-10 rounded-md border border-slate-300 px-3"
              value={domainHint}
              onChange={(e) => setDomainHint(e.target.value as ContentDomain | "")}
            >
              <option value="">AI가 자동 선택</option>
              {domainOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => void generateDraft()} disabled={isGenerating || isSaving}>
              {isGenerating ? "초안 생성 중..." : "초안 생성"}
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {examplePrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:bg-slate-50"
                onClick={() => void generateDraft(prompt)}
                disabled={isGenerating || isSaving}
              >
                {prompt}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {draft && meta ? (
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle>등록 초안</CardTitle>
              <Badge>{meta.mode === "llm" ? "AI 생성" : "규칙 기반"}</Badge>
              <Badge className="border border-slate-200 bg-white">신뢰도: {meta.confidence}</Badge>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3">
            <p className="text-sm text-slate-600">{meta.reasoning}</p>

            <label className="grid gap-1 text-sm text-slate-700">
              메뉴
              <select
                className="h-10 rounded-md border border-slate-300 px-3"
                value={draft.domain}
                onChange={(e) => updateDraftField("domain", e.target.value)}
              >
                {domainOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-1 text-sm text-slate-700">
              제목
              <input
                className="h-10 rounded-md border border-slate-300 px-3"
                value={draft.title}
                onChange={(e) => updateDraftField("title", e.target.value)}
              />
            </label>

            <label className="grid gap-1 text-sm text-slate-700">
              요약/본문
              <textarea
                className="min-h-32 rounded-md border border-slate-300 px-3 py-2"
                value={draft.body}
                onChange={(e) => updateDraftField("body", e.target.value)}
              />
            </label>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="grid gap-1 text-sm text-slate-700">
                출처/기관
                <input
                  className="h-10 rounded-md border border-slate-300 px-3"
                  value={draft.source_name ?? ""}
                  onChange={(e) => updateDraftField("source_name", e.target.value)}
                />
              </label>
              <label className="grid gap-1 text-sm text-slate-700">
                발행일 (YYYY-MM-DD)
                <input
                  className="h-10 rounded-md border border-slate-300 px-3"
                  value={draft.published_at ?? ""}
                  onChange={(e) => updateDraftField("published_at", e.target.value)}
                />
              </label>
            </div>

            <label className="grid gap-1 text-sm text-slate-700">
              원문 링크
              <input
                className="h-10 rounded-md border border-slate-300 px-3"
                value={draft.source_url ?? ""}
                onChange={(e) => updateDraftField("source_url", e.target.value)}
              />
            </label>

            {meta.similarDocuments.length > 0 ? (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                <p className="font-medium">유사 문서가 있습니다. 중복 등록을 확인하세요.</p>
                <ul className="mt-2 list-disc pl-5">
                  {meta.similarDocuments.map((item) => (
                    <li key={item.id}>
                      [{DOMAIN_LABELS[item.domain as ContentDomain] ?? item.domain}] {item.title}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={() => void saveDraft()} disabled={isSaving || isGenerating}>
                {isSaving ? "저장 중..." : "확인 후 저장"}
              </Button>
              <Link href={adminPaths[draft.domain]}>
                <Button type="button" variant="outline">
                  {DOMAIN_LABELS[draft.domain]} 메뉴에서 수정
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {status ? <p className="text-sm text-slate-600">{status}</p> : null}
    </div>
  );
}
