import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase-admin";
import { requireAdminApi } from "@/lib/admin-auth";

const schema = z.object({
  title: z.string().min(1).optional(),
  track: z.string().min(1).optional(),
  starts_at: z.string().optional(),
  ends_at: z.string().optional(),
  application_deadline: z.string().optional(),
  capacity: z.coerce.number().optional(),
  description: z.string().optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;

  const { id } = await params;
  const body = await request.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "유효하지 않은 요청" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("education_programs").update(parsed.data).eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "교육 과정이 수정되었습니다." });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;

  const { id } = await params;
  const supabase = createAdminClient();
  const { error } = await supabase.from("education_programs").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "교육 과정이 삭제되었습니다." });
}
