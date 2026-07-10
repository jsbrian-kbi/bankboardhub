import { PageShell } from "@/components/layout/page-shell";
import { DocumentFeed } from "@/components/layout/document-feed";
import { RegulationSearch } from "@/components/layout/regulation-search";
import { getDocumentsByDomain } from "@/lib/public-data";

export default async function RegulationPage() {
  const regulations = await getDocumentsByDomain("regulation");

  return (
    <PageShell title="법규·정책센터" description="상법부터 AI 기본법까지 조문·주제·개정이력 기반으로 검색 가능한 규제 데이터베이스입니다.">
      <RegulationSearch />
      <div className="mt-8">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">등록 법규·정책</h2>
        <DocumentFeed
          items={regulations}
          emptyMessage="등록된 법규가 없습니다. /admin/regulation에서 법규·조문을 등록해주세요."
        />
      </div>
    </PageShell>
  );
}
