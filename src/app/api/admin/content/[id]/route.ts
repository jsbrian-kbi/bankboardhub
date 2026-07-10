import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { requireAdminApi } from "@/lib/admin-auth";
import { contentUpdateSchema, formatZodError } from "@/lib/admin-content-schema";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;

  const { id } = await params;
  const json = await request.json();
  const parsed = contentUpdateSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }

  const supabase = createAdminClient();
  const payload = parsed.data;
  const updatePayload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (payload.title !== undefined) updatePayload.title = payload.title;
  if (payload.body !== undefined) updatePayload.body = payload.body;
  if (payload.source_name !== undefined) updatePayload.source_name = payload.source_name;
  if (payload.source_url !== undefined) updatePayload.source_url = payload.source_url;
  if (payload.published_at !== undefined) updatePayload.published_at = payload.published_at;
  if (payload.is_public !== undefined) updatePayload.is_public = payload.is_public;

  const { error } = await supabase.from("documents").update(updatePayload).eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "콘텐츠가 수정되었습니다." });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;

  const { id } = await params;
  const supabase = createAdminClient();
  const { error } = await supabase.from("documents").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "콘텐츠가 삭제되었습니다." });
}
