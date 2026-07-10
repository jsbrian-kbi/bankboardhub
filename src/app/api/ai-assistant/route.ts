import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { generateGovernanceAnswer } from "@/lib/llm";
import { isOpenAiConfigured } from "@/lib/openai-config";
import { searchDocumentsWithFallback } from "@/lib/search-documents";

export async function POST(request: Request) {
  const body = (await request.json()) as { question?: string };
  const question = body.question?.trim();

  if (!question) {
    return NextResponse.json({ error: "question이 필요합니다." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await searchDocumentsWithFallback(supabase, question, 6);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const chunks = (data ?? []) as Array<{
    id: number;
    domain: string;
    title: string;
    snippet: string;
  }>;

  const sources = chunks.map((chunk) => ({
    id: chunk.id,
    title: chunk.title,
    domain: chunk.domain,
  }));

  let answer: string;
  let mode: "llm" | "retrieval" = "retrieval";
  const openaiConfigured = isOpenAiConfigured();

  try {
    const llmAnswer = await generateGovernanceAnswer(question, chunks);
    if (llmAnswer && openaiConfigured) {
      answer = llmAnswer;
      mode = "llm";
    } else if (chunks.length > 0) {
      answer = openaiConfigured
        ? llmAnswer ?? "AI 답변을 생성하지 못했습니다. 잠시 후 다시 시도해주세요."
        : `검색 결과를 기반으로 관련 문서는 ${chunks
            .map((chunk) => chunk.title)
            .slice(0, 3)
            .join(", ")} 입니다. OPENAI_API_KEY를 설정하면 근거 기반 AI 답변을 생성합니다.`;
    } else {
      answer =
        "관련 문서를 찾지 못했습니다. 키워드를 구체화하거나 법규·판례·검사사례 자료를 먼저 등록해주세요.";
    }
  } catch (llmError) {
    answer =
      chunks.length > 0
        ? `AI 생성 중 오류가 발생했습니다. 검색된 관련 문서: ${chunks
            .map((chunk) => chunk.title)
            .slice(0, 3)
            .join(", ")}`
        : "AI 생성 중 오류가 발생했습니다.";
    if (llmError instanceof Error) {
      answer += `\n\n오류: ${llmError.message}`;
    }
  }

  return NextResponse.json({
    question,
    answer,
    sources,
    mode,
    openaiConfigured,
    retrievalCount: chunks.length,
  });
}
