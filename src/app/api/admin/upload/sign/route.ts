import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin-auth";
import {
  ACCEPTED_EXTENSIONS,
  buildStorageObjectPath,
  isAcceptedUploadExtension,
  MAX_UPLOAD_BYTES,
  parseUploadDomain,
} from "@/lib/admin-upload";
import { createAdminClient } from "@/lib/supabase-admin";

const requestSchema = z.object({
  domain: z.string().trim().optional(),
  title: z.string().trim().min(1),
  fileName: z.string().trim().min(1),
  contentType: z.string().trim().optional(),
  fileSize: z.number().int().positive().optional(),
  source_name: z.string().trim().optional(),
  body: z.string().trim().optional(),
});

export async function POST(request: Request) {
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;

  const json = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: "문서명과 파일 정보가 필요합니다." }, { status: 400 });
  }

  const domain = parseUploadDomain(parsed.data.domain ?? "resources");
  if (!domain) {
    return NextResponse.json({ error: "지원하지 않는 콘텐츠 도메인입니다." }, { status: 400 });
  }

  if (!isAcceptedUploadExtension(parsed.data.fileName)) {
    return NextResponse.json(
      { error: `지원 확장자: ${ACCEPTED_EXTENSIONS.join(", ")}` },
      { status: 400 },
    );
  }

  if (parsed.data.fileSize && parsed.data.fileSize > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { error: `파일 크기는 ${Math.round(MAX_UPLOAD_BYTES / (1024 * 1024))}MB 이하여야 합니다.` },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();
  const path = buildStorageObjectPath(domain, parsed.data.fileName);
  const { data, error } = await supabase.storage.from("resources").createSignedUploadUrl(path);

  if (error || !data) {
    return NextResponse.json(
      {
        error: `${error?.message ?? "서명 URL 생성 실패"}. Supabase Storage에 'resources' 버킷이 있는지 supabase/storage.sql을 실행했는지 확인하세요.`,
      },
      { status: 500 },
    );
  }

  const { data: publicUrlData } = supabase.storage.from("resources").getPublicUrl(path);

  return NextResponse.json({
    path: data.path,
    token: data.token,
    signedUrl: data.signedUrl,
    publicUrl: publicUrlData.publicUrl,
    domain,
    title: parsed.data.title,
    source_name: parsed.data.source_name || null,
    body: parsed.data.body || `${parsed.data.fileName} 파일 업로드`,
    contentType: parsed.data.contentType || "application/octet-stream",
  });
}
