"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Source {
  id: number;
  title: string;
  domain: string;
  source_kind?: "static" | "dynamic";
  retrieval?: "vector" | "fts";
}

interface AssistantChatProps {
  initialOpenAiConfigured: boolean;
  initialModel: string;
}

const exampleQuestions = [
  "사외이사의 법적 책임은?",
  "감사위원회 핵심 점검사항은?",
  "최근 검사 지적 내부통제 이슈는?",
  "이사회의 AI 리스크 감독 포인트는?",
];

export function AssistantChat({ initialOpenAiConfigured, initialModel }: AssistantChatProps) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState<Source[]>([]);
  const [mode, setMode] = useState<"llm" | "retrieval" | null>(null);
  const [retrievalMode, setRetrievalMode] = useState<"vector" | "fts" | null>(null);
  const [intent, setIntent] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [openAiConfigured, setOpenAiConfigured] = useState(initialOpenAiConfigured);
  const [model, setModel] = useState(initialModel);

  useEffect(() => {
    void fetch("/api/ai-assistant/status")
      .then((response) => response.json())
      .then((payload: { openai?: string; model?: string }) => {
        setOpenAiConfigured(payload.openai === "configured");
        if (payload.model) setModel(payload.model);
      })
      .catch(() => {
        // 서버에서 전달한 초기값 유지
      });
  }, []);

  const ask = async (value?: string) => {
    const q = (value ?? question).trim();
    if (!q) {
      setMessage("질문을 입력해주세요.");
      return;
    }

    setQuestion(q);
    setIsLoading(true);
    setMessage("");

    const response = await fetch("/api/ai-assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: q }),
    });

    const result = (await response.json()) as {
      error?: string;
      answer?: string;
      sources?: Source[];
      mode?: "llm" | "retrieval";
      retrievalMode?: "vector" | "fts";
      intent?: string;
      openaiConfigured?: boolean;
    };

    setIsLoading(false);

    if (!response.ok) {
      setMessage(result.error ?? "질의에 실패했습니다.");
      return;
    }

    setAnswer(result.answer ?? "");
    setSources(result.sources ?? []);
    setMode(result.mode ?? null);
    setRetrievalMode(result.retrievalMode ?? null);
    setIntent(result.intent ?? null);
    if (typeof result.openaiConfigured === "boolean") {
      setOpenAiConfigured(result.openaiConfigured);
    }
  };

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle>AI Assistant 상태</CardTitle>
            {openAiConfigured ? (
              <Badge>OpenAI 연동됨 ({model})</Badge>
            ) : (
              <Badge className="border border-slate-300 bg-white">검색 기반 모드</Badge>
            )}
          </div>
        </CardHeader>
        {!openAiConfigured ? (
          <CardContent className="text-sm text-slate-600">
            `OPENAI_API_KEY`를 설정하면 근거 문서 기반 AI 답변을 사용할 수 있습니다. 설정 가이드:{" "}
            <code className="rounded bg-slate-100 px-1">docs/openai-setup.md</code>
          </CardContent>
        ) : (
          <CardContent className="text-sm text-slate-600">
            법규·판례·기준(정적)과 뉴스·동향(동적)을 구분해 검색합니다. 벡터 색인이 있으면 의미 검색을 우선하고, 없으면 키워드 검색으로 전환합니다.
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>질문하기</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          <textarea
            className="min-h-28 rounded-md border border-slate-300 px-3 py-2 text-sm"
            placeholder="이사회·사외이사·규제 관련 질문을 입력하세요."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            {exampleQuestions.map((item) => (
              <Button key={item} type="button" variant="outline" size="sm" onClick={() => ask(item)}>
                {item}
              </Button>
            ))}
          </div>
          <Button type="button" onClick={() => ask()} disabled={isLoading} className="w-fit">
            {isLoading ? "분석 중..." : "질문하기"}
          </Button>
          {message ? <p className="text-sm text-slate-600">{message}</p> : null}
        </CardContent>
      </Card>

      {answer ? (
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle>답변</CardTitle>
              {mode === "llm" ? <Badge>AI 생성</Badge> : <Badge>검색 기반</Badge>}
              {retrievalMode === "vector" ? (
                <Badge className="border border-emerald-200 bg-emerald-50 text-emerald-800">벡터 검색</Badge>
              ) : retrievalMode === "fts" ? (
                <Badge className="border border-amber-200 bg-amber-50 text-amber-900">키워드 검색</Badge>
              ) : null}
              {intent ? (
                <Badge className="border border-slate-200 bg-slate-50 text-slate-700">
                  {intent === "static" ? "정적 중심" : intent === "dynamic" ? "동적 중심" : "정적+동적"}
                </Badge>
              ) : null}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{answer}</p>
            {sources.length > 0 ? (
              <div>
                <p className="mb-2 text-sm font-medium text-slate-900">출처</p>
                <ul className="grid gap-1 text-sm text-slate-600">
                  {sources.map((source) => (
                    <li key={source.id}>
                      [{source.domain}
                      {source.source_kind === "dynamic" ? "/동적" : source.source_kind === "static" ? "/정적" : ""}
                      ] {source.title}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
