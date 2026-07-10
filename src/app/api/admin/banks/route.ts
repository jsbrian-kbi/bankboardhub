import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase-admin";

const schema = z.object({
  name: z.string().min(1),
  board_size: z.coerce.number().optional(),
  outside_director_count: z.coerce.number().optional(),
  female_ratio: z.coerce.number().optional(),
  term_status: z.string().optional(),
});

export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("banks")
    .select("id, name, board_size, outside_director_count, female_ratio, term_status, updated_at")
    .order("name", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? [] });
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "유효하지 않은 요청" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("banks").upsert(parsed.data, { onConflict: "name" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "은행 정보가 저장되었습니다." });
}
