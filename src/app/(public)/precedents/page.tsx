import { PageShell } from "@/components/layout/page-shell";
import { DocumentFeed } from "@/components/layout/document-feed";
import { getDocumentsByDomain } from "@/lib/public-data";

export default async function PrecedentsPage() {
  const precedents = await getDocumentsByDomain("precedent");

  return (
    <PageShell title="판례 라이브러리" description="사외이사 관련 판례를 사건정보·쟁점·실무 시사점 중심으로 제공합니다.">
      <DocumentFeed items={precedents} emptyMessage="등록된 판례가 없습니다. /admin/precedents에서 판례를 등록해주세요." />
    </PageShell>
  );
}
