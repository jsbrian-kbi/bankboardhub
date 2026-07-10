import { PageShell } from "@/components/layout/page-shell";
import { ListSection } from "@/components/layout/list-section";

export default function OutsideDirectorPage() {
  return (
    <PageShell title="사외이사" description="사외이사의 책임·의무·독립성과 법적 책임을 실무 관점으로 해설합니다.">
      <div className="grid gap-4 md:grid-cols-2">
        <ListSection
          title="핵심 주제"
          items={[
            "역할과 책임",
            "권리와 의무",
            "독립성",
            "충실의무",
            "선관주의의무",
            "법적 책임",
            "행동원칙",
            "FAQ",
          ]}
        />
        <ListSection
          title="실무 지원"
          items={[
            "취임 전 체크리스트",
            "의사록 확인 포인트",
            "반대의견·기권 기록 가이드",
            "감독당국 점검 대비 핵심 문답",
          ]}
        />
      </div>
    </PageShell>
  );
}
