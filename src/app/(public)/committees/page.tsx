import Link from "next/link";
import { committeeMenus } from "@/data/navigation";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const committeeLabels: Record<(typeof committeeMenus)[number], string> = {
  audit: "감사위원회",
  risk: "위험관리위원회",
  "internal-control": "내부통제위원회",
  "executive-nomination": "임원후보추천위원회",
  compensation: "보수위원회",
  esg: "ESG위원회",
  "consumer-protection": "소비자보호위원회",
  digital: "디지털위원회",
};

export default function CommitteesPage() {
  return (
    <PageShell title="위원회" description="위원회별 설치 근거, 주요 역할, 최근 이슈, 점검항목을 제공합니다.">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {committeeMenus.map((slug) => (
          <Link key={slug} href={`/committees/${slug}`}>
            <Card className="h-full transition hover:shadow-md">
              <CardHeader>
                <CardTitle>{committeeLabels[slug]}</CardTitle>
              </CardHeader>
              <CardContent>설치 근거 · 관련 법규 · 체크리스트</CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
