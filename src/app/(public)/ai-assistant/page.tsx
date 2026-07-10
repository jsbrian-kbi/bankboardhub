import { PageShell } from "@/components/layout/page-shell";
import { AssistantChat } from "@/components/ai/assistant-chat";
import { getOpenAiModel, isOpenAiConfigured } from "@/lib/openai-config";

export default function AIAssistantPage() {
  return (
    <PageShell
      title="AI Board Assistant"
      description="생성형 AI 기반 문서검색·요약·질의응답 기능으로 이사회 의사결정을 지원합니다."
    >
      <AssistantChat initialOpenAiConfigured={isOpenAiConfigured()} initialModel={getOpenAiModel()} />
    </PageShell>
  );
}
