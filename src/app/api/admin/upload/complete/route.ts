import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin-auth";
import { parseUploadDomain } from "@/lib/admin-upload";
import { tryIndexDocumentById } from "@/lib/rag-index";
import { createAdminClient } from "@/lib/supabase-admin";

const requestSchema = z.object({
  path: z.string().trim().min(1),
  domain: z.string().trim().min(1),
  title: z.string().trim().min(1),
  source_name: z.string().trim().nullable().optional(),
  body: z.string().trim().optional(),
  publicUrl: z.string().url().optional(),
});

export async function POST(request: Request) {
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;

  const json = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: "업로드 완료 정보가 올바르지 않습니다." }, { status: 400 });
  }

  const domain = parseUploadDomain(parsed.data.domain);
  if (!domain) {
    return NextResponse.json({ error: "지원하지 않는 콘텐츠 도메인입니다." }, { status: 400 });
  }

  if (!parsed.data.path.startsWith(`${domain}/`)) {
    return NextResponse.json({ error: "업로드 경로가 올바르지 않습니다." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: publicUrlData } = supabase.storage.from("resources").getPublicUrl(parsed.data.path);
  const sourceUrl = parsed.data.publicUrl || publicUrlData.publicUrl;

  const { data: exists, error: existsError } = await supabase.storage.from("resources").exists(parsed.data.path);
  if (existsError || !exists) {
    return NextResponse.json(
      {
        error: `업로드 파일 확인 실패: ${existsError?.message ?? "Storage에 파일이 없습니다. 다시 업로드해주세요."}`,
      },
      { status: 400 },
    );
  }

  const { data: inserted, error: insertError } = await supabase
    .from("documents")
    .insert({
      domain,
      title: parsed.data.title,
      body: parsed.data.body || `${parsed.data.title} 파일 업로드`,
      source_name: parsed.data.source_name || null,
      source_url: sourceUrl,
      is_public: true,
    })
    .select("id")
    .single();

  if (insertError) {
    await supabase.storage.from("resources").remove([parsed.data.path]);
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  await tryIndexDocumentById(inserted?.id);

  return NextResponse.json({
    message: "파일이 업로드되어 등록되었습니다.",
    url: sourceUrl,
    id: inserted?.id,
  });
}
