interface RetrievalChunk {
  id: number;
  title: string;
  domain: string;
  snippet: string;
}

export async function generateGovernanceAnswer(question: string, chunks: RetrievalChunk[]) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }

  if (chunks.length === 0) {
    return "등록된 문서에서 관련 근거를 찾지 못했습니다. 질문을 더 구체화하거나 관리자에게 자료 등록을 요청해주세요.";
  }

  const context = chunks
    .map((chunk, index) => `[${index + 1}] (${chunk.domain}) ${chunk.title}\n${chunk.snippet}`)
    .join("\n\n");

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "당신은 한국 은행·금융지주 이사회 및 사외이사 거버넌스 전문가입니다. 제공된 컨텍스트에 근거해서만 한국어로 답변하세요. 근거가 부족하면 추측하지 말고 부족함을 명시하세요. 답변 마지막에 참고한 문서 번호를 간단히 표시하세요.",
        },
        {
          role: "user",
          content: `질문: ${question}\n\n컨텍스트:\n${context}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LLM 호출 실패: ${errorText}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  return payload.choices?.[0]?.message?.content?.trim() ?? null;
}
