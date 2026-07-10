import { NextResponse } from "next/server";
import { getOpenAiModel, isOpenAiConfigured } from "@/lib/openai-config";

export async function GET() {
  return NextResponse.json({
    openai: isOpenAiConfigured() ? "configured" : "not_set",
    model: getOpenAiModel(),
  });
}
