#!/usr/bin/env node
/**
 * Backfill vector RAG chunks for all public documents.
 *
 * Prerequisites:
 * 1. Run supabase/rag-vector.sql in Supabase SQL Editor
 * 2. OPENAI_API_KEY (+ Supabase service role) in .env.local
 *
 * Usage:
 *   npm run index:rag
 *   npm run index:rag -- --source-kind=static
 *   npm run index:rag -- --source-kind=dynamic --limit=50
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  const text = readFileSync(path, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvLocal();

const STATIC = ["regulation", "precedent", "supervisory-case", "global-standard", "resources"];
const DYNAMIC = ["news", "move"];

function getSourceKind(domain) {
  return DYNAMIC.includes(domain) ? "dynamic" : "static";
}

function chunkText(title, body) {
  const TARGET = 900;
  const OVERLAP = 120;
  const combined = `${title.trim()}\n\n${body.trim()}`.replace(/\r\n/g, "\n").trim();
  if (!combined) return [];

  const paragraphs = combined
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
  const chunks = [];
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
    if (`${buffer}\n\n${paragraph}`.length <= TARGET) {
      buffer = `${buffer}\n\n${paragraph}`;
      continue;
    }
    flush();
    if (paragraph.length <= TARGET) {
      buffer = paragraph;
      continue;
    }
    for (let i = 0; i < paragraph.length; i += TARGET - OVERLAP) {
      chunks.push(paragraph.slice(i, i + TARGET).trim());
    }
  }
  flush();
  if (chunks.length === 0) chunks.push(combined.slice(0, TARGET));
  return chunks.filter(Boolean);
}

async function createEmbeddings(inputs, apiKey, model) {
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: inputs.map((v) => v.replace(/\s+/g, " ").trim().slice(0, 8000)),
    }),
  });
  if (!response.ok) {
    throw new Error(await response.text());
  }
  const payload = await response.json();
  return [...(payload.data ?? [])]
    .sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
    .map((row) => row.embedding);
}

function parseArgs(argv) {
  const out = { sourceKind: "all", limit: 500 };
  for (const arg of argv) {
    if (arg.startsWith("--source-kind=")) out.sourceKind = arg.split("=")[1];
    if (arg.startsWith("--limit=")) out.limit = Number(arg.split("=")[1]) || 500;
  }
  return out;
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small";

  if (!url || !serviceKey) {
    console.error("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 필요");
    process.exit(1);
  }
  if (!apiKey) {
    console.error("OPENAI_API_KEY 필요");
    process.exit(1);
  }

  const { sourceKind, limit } = parseArgs(process.argv.slice(2));
  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let query = supabase
    .from("documents")
    .select("id, domain, title, body, published_at")
    .eq("is_public", true)
    .order("id", { ascending: true })
    .limit(limit);

  if (sourceKind === "static") query = query.in("domain", STATIC);
  if (sourceKind === "dynamic") query = query.in("domain", DYNAMIC);

  const { data, error } = await query;
  if (error) {
    console.error("문서 조회 실패:", error.message);
    console.error("힌트: supabase/rag-vector.sql 을 먼저 실행했는지 확인하세요.");
    process.exit(1);
  }

  const docs = data ?? [];
  console.log(`색인 대상: ${docs.length}건 (source_kind=${sourceKind})`);

  let ok = 0;
  let fail = 0;
  let chunksTotal = 0;

  for (const doc of docs) {
    try {
      const chunks = chunkText(doc.title, doc.body);
      await supabase.from("document_chunks").delete().eq("document_id", doc.id);

      if (chunks.length === 0) {
        console.log(`#${doc.id} empty — skipped`);
        ok += 1;
        continue;
      }

      const embeddings = await createEmbeddings(chunks, apiKey, model);
      const sk = getSourceKind(doc.domain);
      const rows = chunks.map((content, chunk_index) => ({
        document_id: doc.id,
        domain: doc.domain,
        source_kind: sk,
        chunk_index,
        content,
        embedding: embeddings[chunk_index],
        published_at: doc.published_at || null,
      }));

      const { error: insertError } = await supabase.from("document_chunks").insert(rows);
      if (insertError) throw new Error(insertError.message);

      ok += 1;
      chunksTotal += rows.length;
      console.log(`#${doc.id} [${sk}/${doc.domain}] ${rows.length} chunks`);
    } catch (err) {
      fail += 1;
      console.error(`#${doc.id} FAILED:`, err instanceof Error ? err.message : err);
    }
  }

  console.log(`완료: success=${ok} fail=${fail} chunks=${chunksTotal}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
