import { PageShell } from "@/components/layout/page-shell";
import { TimelineFeed } from "@/components/layout/timeline-feed";
import { getDocumentsByDomain } from "@/lib/public-data";

export default async function MovesPage() {
  const moves = await getDocumentsByDomain("move");

  return (
    <PageShell title="사외이사 인사동정" description="신규 선임, 재선임, 사임, 임기만료 정보를 타임라인 형식으로 제공합니다.">
      <TimelineFeed items={moves} emptyMessage="등록된 인사동정이 없습니다. /admin/moves에서 등록해주세요." />
    </PageShell>
  );
}
