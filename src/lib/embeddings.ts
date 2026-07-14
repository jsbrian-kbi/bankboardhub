import { isOpenAiConfigured } from "@/lib/openai-config";

export function getEmbeddingModel() {
  return process.env.OPENAI_EMBEDDING_MODEL?.trim() || "text-embedding-3-small";
}

export const EMBEDDING_DIMENSIONS = 1536;

export async function createEmbedding(input: string): Promise<number[]> {
  if (!isOpenAiConfigured()) {
    throw new Error("OPENAI_API_KEY가 필요합니다. 벡터 임베딩을 생성할 수 없습니다.");
  }

  const text = input.replace(/\s+/g, " ").trim();
  if (!text) {
    throw new Error("임베딩할 텍스트가 비어 있습니다.");
  }

  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: getEmbeddingModel(),
      input: text.slice(0, 8000),
    }),
    signal: AbortSignal.timeout(45_000),
  });

  if (!response.ok) {
    let detail = await response.text();
    try {
      const parsed = JSON.parse(detail) as { error?: { message?: string } };
      detail = parsed.error?.message ?? detail;
    } catch {
      // keep raw
    }
    throw new Error(`임베딩 실패: ${detail}`);
  }

  const payload = (await response.json()) as {
    data?: Array<{ embedding?: number[] }>;
  };

  const embedding = payload.data?.[0]?.embedding;
  if (!embedding || embedding.length !== EMBEDDING_DIMENSIONS) {
    throw new Error(`임베딩 차원이 올바르지 않습니다. (expected ${EMBEDDING_DIMENSIONS})`);
  }

  return embedding;
}

export async function createEmbeddings(inputs: string[]): Promise<number[][]> {
  if (inputs.length === 0) return [];
  if (!isOpenAiConfigured()) {
    throw new Error("OPENAI_API_KEY가 필요합니다. 벡터 임베딩을 생성할 수 없습니다.");
  }

  const cleaned = inputs.map((value) => value.replace(/\s+/g, " ").trim().slice(0, 8000));
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: getEmbeddingModel(),
      input: cleaned,
    }),
    signal: AbortSignal.timeout(90_000),
  });

  if (!response.ok) {
    let detail = await response.text();
    try {
      const parsed = JSON.parse(detail) as { error?: { message?: string } };
      detail = parsed.error?.message ?? detail;
    } catch {
      // keep raw
    }
    throw new Error(`임베딩 실패: ${detail}`);
  }

  const payload = (await response.json()) as {
    data?: Array<{ embedding?: number[]; index?: number }>;
  };

  const rows = [...(payload.data ?? [])].sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
  return rows.map((row, index) => {
    const embedding = row.embedding;
    if (!embedding || embedding.length !== EMBEDDING_DIMENSIONS) {
      throw new Error(`임베딩 #${index} 차원이 올바르지 않습니다.`);
    }
    return embedding;
  });
}
