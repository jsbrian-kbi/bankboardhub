import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase-admin";
import { requireAdminApi } from "@/lib/admin-auth";
import { tryIndexDocumentById } from "@/lib/rag-index";

const schema = z.object({
  title: z.string().min(1),
  category: z.string().min(1),
  source_name: z.string().optional(),
  source_url: z.string().url().optional().or(z.literal("")),
  body: z.string().optional(),
});

export async function POST(request: Request) {
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;

  const body = await request.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "유효하지 않은 요청" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("documents")
    .insert({
      domain: "resources",
      title: parsed.data.title,
      body: parsed.data.body ?? `${parsed.data.category} 자료 업로드`,
      source_name: parsed.data.source_name || null,
      source_url: parsed.data.source_url || null,
      is_public: true,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await tryIndexDocumentById(data?.id);
  return NextResponse.json({ message: "문서 메타데이터가 저장되었습니다.", id: data?.id });
}
