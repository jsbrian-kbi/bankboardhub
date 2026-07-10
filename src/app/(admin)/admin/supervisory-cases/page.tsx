import { AdminContentManager } from "@/components/layout/admin-content-manager";
import { getAdminContent } from "@/lib/admin-list";

export default async function AdminSupervisoryCasesPage() {
  const initialRows = await getAdminContent("supervisory-case");

  return (
    <AdminContentManager
      title="검사사례 등록"
      description="검사사례 문서·웹사이트를 등록합니다."
      domain="supervisory-case"
      publicPath="/supervisory-cases"
      initialRows={initialRows}
      fields={[
        { name: "title", label: "사례명" },
        { name: "body", label: "사고개요/지적사항/시사점" },
        { name: "source_name", label: "기관" },
        { name: "source_url", label: "원문 링크" },
        { name: "published_at", label: "발표일(YYYY-MM-DD)" },
      ]}
      columns={[
        { key: "title", label: "사례명" },
        { key: "source_name", label: "기관" },
        { key: "published_at", label: "발표일" },
        { key: "created_at", label: "등록일" },
      ]}
    />
  );
}
