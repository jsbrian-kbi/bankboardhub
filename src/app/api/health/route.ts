import { NextResponse } from "next/server";
import { getOpenAiModel, isOpenAiConfigured } from "@/lib/openai-config";

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const supabaseConfigured = Boolean(supabaseUrl && supabaseAnon && serviceRole);

  return NextResponse.json({
    status: supabaseConfigured ? "ok" : "degraded",
    service: "Bank Board Governance Hub",
    supabase: supabaseConfigured ? "configured" : "missing_env",
    openai: isOpenAiConfigured() ? "configured" : "not_set",
    openaiModel: getOpenAiModel(),
    timestamp: new Date().toISOString(),
  });
}
