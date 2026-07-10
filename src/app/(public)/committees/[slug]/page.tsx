import { notFound } from "next/navigation";
import { PageShell } from "@/components/layout/page-shell";
import { ListSection } from "@/components/layout/list-section";

const committeeData = {
  audit: { title: "감사위원회", legal: "금융회사지배구조법 및 내부통제 규정" },
  risk: { title: "위험관리위원회", legal: "은행법, 바젤기준 및 내부 리스크 정책" },
  "internal-control": { title: "내부통제위원회", legal: "책무구조도 관련 규정 및 내부통제 모범규준" },
  "executive-nomination": { title: "임원후보추천위원회", legal: "지배구조법 및 정관" },
  compensation: { title: "보수위원회", legal: "지배구조법, 보수체계 연차보고 지침" },
  esg: { title: "ESG위원회", legal: "자율공시기준 및 지속가능경영 가이드라인" },
  "consumer-protection": { title: "소비자보호위원회", legal: "금융소비자보호법" },
  digital: { title: "디지털위원회", legal: "전자금융·개인정보·AI 관련 규정" },
} as const;

type Slug = keyof typeof committeeData;

export default async function CommitteeDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!(slug in committeeData)) {
    notFound();
  }

  const data = committeeData[slug as Slug];

  return (
    <PageShell title={data.title} description={`${data.title} 실무 운영 지침 및 최신 감독 이슈를 제공합니다.`}>
      <div className="grid gap-4 md:grid-cols-2">
        <ListSection title="설치 근거 및 법규" items={[data.legal, "감독당국 가이드", "내규 정합성 검토"]} />
        <ListSection
          title="주요 역할"
          items={["핵심 리스크 점검", "경영진 보고사항 검토", "개선계획 이행 모니터링", "이사회 보고"]}
        />
        <ListSection title="최근 이슈" items={["내부통제 체계 고도화", "AI·디지털 리스크 대응", "소비자보호 강화"]} />
        <ListSection title="체크리스트" items={["연간 의결 안건", "정기점검 일정", "성과평가 항목", "외부평가 연계"]} />
      </div>
    </PageShell>
  );
}
