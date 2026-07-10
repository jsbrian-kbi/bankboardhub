import { PageShell } from "@/components/layout/page-shell";
import { DocumentFeed } from "@/components/layout/document-feed";
import { getDocumentsByDomain } from "@/lib/public-data";

export default async function ResourcesPage() {
  const resources = await getDocumentsByDomain("resources");

  return (
    <PageShell title="자료실" description="보고서, 연구자료, 가이드라인, 감독자료, 체크리스트를 주제별로 제공합니다.">
      <DocumentFeed items={resources} emptyMessage="등록된 자료가 없습니다. /admin/documents에서 자료를 등록해주세요." />
    </PageShell>
  );
}
