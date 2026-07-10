import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase-admin";

const schema = z.object({
  title: z.string().min(1),
  track: z.string().min(1),
  starts_at: z.string().optional(),
  ends_at: z.string().optional(),
  application_deadline: z.string().optional(),
  capacity: z.coerce.number().optional(),
  description: z.string().optional(),
});

export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("education_programs")
    .select("id, title, track, starts_at, ends_at, application_deadline, capacity, description, created_at")
    .order("created_at", { ascending: false });

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
  const { error } = await supabase.from("education_programs").insert(parsed.data);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "교육 과정이 저장되었습니다." });
}
