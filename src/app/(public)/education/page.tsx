import { PageShell } from "@/components/layout/page-shell";
import { EducationList } from "@/components/layout/education-list";
import { getEducationPrograms } from "@/lib/public-data";

export default async function EducationPage() {
  const programs = await getEducationPrograms();

  return (
    <PageShell title="교육센터" description="특정 기관 종속 없이 다양한 교육과정을 등록·운영하는 독립형 교육 허브입니다.">
      <EducationList programs={programs} />
    </PageShell>
  );
}
