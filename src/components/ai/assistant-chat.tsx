"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Source {
  id: number;
  title: string;
  domain: string;
}

const exampleQuestions = [
  "사외이사의 법적 책임은?",
  "감사위원회 핵심 점검사항은?",
  "최근 검사 지적 내부통제 이슈는?",
  "이사회의 AI 리스크 감독 포인트는?",
];

export function AssistantChat() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState<Source[]>([]);
  const [mode, setMode] = useState<"llm" | "retrieval" | null>(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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
    };

    setIsLoading(false);

    if (!response.ok) {
      setMessage(result.error ?? "질의에 실패했습니다.");
      return;
    }

    setAnswer(result.answer ?? "");
    setSources(result.sources ?? []);
    setMode(result.mode ?? null);
  };

  return (
    <div className="grid gap-4">
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
            <div className="flex items-center gap-2">
              <CardTitle>답변</CardTitle>
              {mode === "llm" ? <Badge>AI 생성</Badge> : <Badge>검색 기반</Badge>}
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
                      [{source.domain}] {source.title}
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
