import { PageShell } from "@/components/layout/page-shell";
import { ListSection } from "@/components/layout/list-section";

export default function BoardPage() {
  return (
    <PageShell
      title="이사회"
      description="이사회의 역할, 연간 운영계획, 의안심의, 모범관행과 체크리스트를 제공하는 실무 중심 허브입니다."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <ListSection
          title="핵심 영역"
          items={["이사회 개요", "이사회 역할과 책임", "이사회 운영", "의안 심의", "연간 운영계획", "모범관행", "체크리스트"]}
        />
        <ListSection
          title="활용 시나리오"
          items={[
            "정기 이사회 안건 사전 점검",
            "위원회 보고체계 정합성 검토",
            "내부통제·리스크 이슈 보고라인 확인",
            "연간 캘린더 기반 의사결정 관리",
          ]}
        />
      </div>
    </PageShell>
  );
}
