import { PageShell } from "@/components/layout/page-shell";
import { DocumentFeed } from "@/components/layout/document-feed";
import { getDocumentsByDomain } from "@/lib/public-data";

export default async function GlobalStandardsPage() {
  const standards = await getDocumentsByDomain("global-standard");

  return (
    <PageShell title="국제기준" description="OECD, BCBS, BIS, FSB 등 국제기준의 핵심 요약과 국내 시사점을 제공합니다.">
      <DocumentFeed
        items={standards}
        emptyMessage="등록된 국제기준이 없습니다. /admin/global-standards에서 등록해주세요."
      />
    </PageShell>
  );
}
