import { createEmbeddings } from "@/lib/embeddings";
import { getRagSourceKind } from "@/lib/rag-source-kinds";
import { createAdminClient } from "@/lib/supabase-admin";

const TARGET_CHARS = 900;
const OVERLAP_CHARS = 120;

export type IndexableDocument = {
  id: number;
  domain: string;
  title: string;
  body: string;
  published_at?: string | null;
};

export function chunkDocumentText(title: string, body: string): string[] {
  const combined = `${title.trim()}\n\n${body.trim()}`.replace(/\r\n/g, "\n").trim();
  if (!combined) return [];

  const paragraphs = combined
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let buffer = "";

  const flush = () => {
    const text = buffer.trim();
    if (text) chunks.push(text);
    buffer = "";
  };

  for (const paragraph of paragraphs) {
    if (!buffer) {
      buffer = paragraph;
      continue;
    }
    if (`${buffer}\n\n${paragraph}`.length <= TARGET_CHARS) {
      buffer = `${buffer}\n\n${paragraph}`;
      continue;
    }
    flush();
    if (paragraph.length <= TARGET_CHARS) {
      buffer = paragraph;
      continue;
    }
    for (let i = 0; i < paragraph.length; i += TARGET_CHARS - OVERLAP_CHARS) {
      chunks.push(paragraph.slice(i, i + TARGET_CHARS).trim());
    }
  }
  flush();

  if (chunks.length === 0) {
    chunks.push(combined.slice(0, TARGET_CHARS));
  }

  return chunks.filter(Boolean);
}

export async function deleteDocumentChunks(documentId: number) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("document_chunks").delete().eq("document_id", documentId);
  if (error && !/could not find|does not exist|PGRST/i.test(error.message)) {
    throw new Error(error.message);
  }
}

export async function indexDocument(document: IndexableDocument) {
  const chunks = chunkDocumentText(document.title, document.body);
  if (chunks.length === 0) {
    await deleteDocumentChunks(document.id);
    return { chunkCount: 0 };
  }

  const embeddings = await createEmbeddings(chunks);
  const sourceKind = getRagSourceKind(document.domain);
  const rows = chunks.map((content, chunkIndex) => ({
    document_id: document.id,
    domain: document.domain,
    source_kind: sourceKind,
    chunk_index: chunkIndex,
    content,
    embedding: embeddings[chunkIndex],
    published_at: document.published_at || null,
  }));

  const supabase = createAdminClient();
  await deleteDocumentChunks(document.id);

  const { error } = await supabase.from("document_chunks").insert(rows);
  if (error) {
    throw new Error(error.message);
  }

  return { chunkCount: rows.length, sourceKind };
}

export async function indexDocumentById(documentId: number) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("documents")
    .select("id, domain, title, body, published_at")
    .eq("id", documentId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error(`문서 #${documentId}를 찾을 수 없습니다.`);

  return indexDocument(data as IndexableDocument);
}

/** Best-effort indexing after writes — never fails the parent request. */
export async function tryIndexDocumentById(documentId: number | null | undefined) {
  if (!documentId) return;
  try {
    await indexDocumentById(documentId);
  } catch (error) {
    console.error("[rag-index]", documentId, error instanceof Error ? error.message : error);
  }
}
