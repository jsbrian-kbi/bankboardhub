import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase-admin";
import { requireAdminApi } from "@/lib/admin-auth";

const contentSchema = z.object({
  domain: z.string().min(1),
  title: z.string().min(1),
  body: z.string().min(1),
  source_name: z.string().optional(),
  source_url: z.string().url().optional().or(z.literal("")),
  published_at: z.string().optional(),
  is_public: z.boolean().optional(),
});

export async function GET(request: Request) {
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;

  const { searchParams } = new URL(request.url);
  const domain = searchParams.get("domain");

  if (!domain) {
    return NextResponse.json({ error: "domain 파라미터가 필요합니다." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("documents")
    .select("id, domain, title, body, source_name, source_url, published_at, created_at")
    .eq("domain", domain)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? [] });
}

export async function POST(request: Request) {
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;

  const json = await request.json();
  const parsed = contentSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "유효하지 않은 요청" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const payload = parsed.data;

  const { error } = await supabase.from("documents").insert({
    domain: payload.domain,
    title: payload.title,
    body: payload.body,
    source_name: payload.source_name || null,
    source_url: payload.source_url || null,
    published_at: payload.published_at || null,
    is_public: payload.is_public ?? true,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "콘텐츠가 저장되었습니다." });
}
