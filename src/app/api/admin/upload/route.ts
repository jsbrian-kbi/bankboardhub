import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { requireAdminApi } from "@/lib/admin-auth";
import { isContentDomain } from "@/lib/content-domains";

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
export async function POST(request: Request) {
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;

  const formData = await request.formData();
  const file = formData.get("file");
  const domain = String(formData.get("domain") ?? "resources").trim();
  const title = String(formData.get("title") ?? "").trim();
  const sourceName = String(formData.get("source_name") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "업로드할 파일이 필요합니다." }, { status: 400 });
  }

  if (!title) {
    return NextResponse.json({ error: "문서명이 필요합니다." }, { status: 400 });
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "파일 크기는 20MB 이하여야 합니다." }, { status: 400 });
  }

  if (!isContentDomain(domain)) {
    return NextResponse.json({ error: "지원하지 않는 콘텐츠 도메인입니다." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${domain}/${Date.now()}-${safeName}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage.from("resources").upload(path, buffer, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });

  if (uploadError) {
    return NextResponse.json(
      {
        error: `${uploadError.message}. Supabase Storage에 'resources' 버킷이 있는지 supabase/storage.sql을 실행했는지 확인하세요.`,
      },
      { status: 500 },
    );
  }

  const { data: publicUrlData } = supabase.storage.from("resources").getPublicUrl(path);

  const { error: insertError } = await supabase.from("documents").insert({
    domain,
    title,
    body: body || `${file.name} 파일 업로드`,
    source_name: sourceName || null,
    source_url: publicUrlData.publicUrl,
    is_public: true,
  });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({
    message: "파일이 업로드되어 등록되었습니다.",
    url: publicUrlData.publicUrl,
  });
}
