import { ContentAgentPanel } from "@/components/admin/content-agent-panel";

export default function AdminContentAgentPage() {
  return (
    <div className="grid gap-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">AI 콘텐츠 등록 도우미</h1>
        <p className="mt-2 text-sm text-slate-600">
          URL이나 설명을 입력하면 뉴스·법규·판례·검사사례 등 적절한 메뉴에 등록할 초안을 생성합니다.
        </p>
      </div>
      <ContentAgentPanel />
    </div>
  );
}
