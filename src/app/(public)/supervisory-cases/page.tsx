import { PageShell } from "@/components/layout/page-shell";
import { DocumentFeed } from "@/components/layout/document-feed";
import { getDocumentsByDomain } from "@/lib/public-data";

export default async function SupervisoryCasesPage() {
  const cases = await getDocumentsByDomain("supervisory-case");

  return (
    <PageShell title="감독·검사사례" description="금융감독원·금융위원회 검사/제재 사례를 이사회 책임 관점으로 구조화합니다.">
      <DocumentFeed
        items={cases}
        emptyMessage="등록된 검사사례가 없습니다. /admin/supervisory-cases에서 사례를 등록해주세요."
      />
    </PageShell>
  );
}
