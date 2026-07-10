import { AdminContentManager } from "@/components/layout/admin-content-manager";
import { getAdminContent } from "@/lib/admin-list";

export default async function AdminDocumentsPage() {
  const initialRows = await getAdminContent("resources");

  return (
    <AdminContentManager
      title="자료실 등록"
      description="자료실 문서·웹사이트를 등록합니다."
      domain="resources"
      publicPath="/resources"
      initialRows={initialRows}
      fields={[
        { name: "title", label: "문서명" },
        { name: "body", label: "요약" },
        { name: "source_name", label: "발행기관" },
        { name: "source_url", label: "원문 링크" },
      ]}
      columns={[
        { key: "title", label: "문서명" },
        { key: "source_name", label: "발행기관" },
        { key: "created_at", label: "등록일" },
      ]}
    />
  );
}
