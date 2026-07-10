import { AdminContentManager } from "@/components/layout/admin-content-manager";
import { getAdminContent } from "@/lib/admin-list";

export default async function AdminNewsPage() {
  const initialRows = await getAdminContent("news");

  return (
    <AdminContentManager
      title="뉴스 등록"
      description="뉴스 문서·웹사이트를 등록합니다."
      domain="news"
      publicPath="/news"
      initialRows={initialRows}
      fields={[
        { name: "title", label: "제목" },
        { name: "body", label: "요약/본문" },
        { name: "source_name", label: "출처" },
        { name: "source_url", label: "원문 링크" },
        { name: "published_at", label: "발행일(YYYY-MM-DD)" },
      ]}
      columns={[
        { key: "title", label: "제목" },
        { key: "source_name", label: "출처" },
        { key: "published_at", label: "발행일" },
        { key: "created_at", label: "등록일" },
      ]}
    />
  );
}
