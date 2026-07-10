import { AdminContentManager } from "@/components/layout/admin-content-manager";
import { getAdminContent } from "@/lib/admin-list";

export default async function AdminMovesPage() {
  const initialRows = await getAdminContent("move");

  return (
    <AdminContentManager
      title="인사동정 등록"
      description="인사동정 문서·웹사이트를 등록합니다."
      domain="move"
      publicPath="/moves"
      initialRows={initialRows}
      fields={[
        { name: "title", label: "인사 제목" },
        { name: "body", label: "상세 내용" },
        { name: "source_name", label: "기관명" },
        { name: "source_url", label: "원문 링크" },
        { name: "published_at", label: "발표일(YYYY-MM-DD)" },
      ]}
      columns={[
        { key: "title", label: "제목" },
        { key: "source_name", label: "기관" },
        { key: "published_at", label: "발표일" },
        { key: "created_at", label: "등록일" },
      ]}
    />
  );
}
