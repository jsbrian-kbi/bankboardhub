import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase-admin";
import { requireAdminApi } from "@/lib/admin-auth";

const schema = z.object({
  board_name: z.string().min(1),
  access_role: z.string().min(1),
  enabled: z.string().optional(),
  description: z.string().optional(),
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
  const { error } = await supabase.from("documents").insert({
    domain: "board-post",
    title: parsed.data.board_name,
    body: `access_role=${parsed.data.access_role}; enabled=${parsed.data.enabled}; ${parsed.data.description ?? ""}`,
    is_public: false,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "게시판 설정이 저장되었습니다." });
}
