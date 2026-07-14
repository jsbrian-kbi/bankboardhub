import { PageShell } from "@/components/layout/page-shell";
import { DocumentFeed } from "@/components/layout/document-feed";
import { getDocumentsByDomain } from "@/lib/public-data";

export default async function NewsPage() {
  const news = await getDocumentsByDomain("news");

  return (
    <PageShell title="뉴스센터" description="국내외 감독·정책·거버넌스 뉴스를 주제별로 큐레이션합니다.">
      <DocumentFeed
        items={news}
        detailBasePath="/news"
        emptyMessage="등록된 뉴스가 없습니다. /admin/news에서 뉴스를 등록해주세요."
      />
    </PageShell>
  );
}
