import { AdminCrudPage } from "@/components/layout/admin-crud-page";
import { getAdminContent } from "@/lib/admin-list";

export default async function AdminSupervisoryCasesPage() {
  const initialRows = await getAdminContent("supervisory-case");

  return (
    <AdminCrudPage
      title="검사사례 등록"
      description="감독·검사 지적사항과 시사점을 입력합니다."
      endpoint="/api/admin/content"
      listEndpoint="/api/admin/content?domain=supervisory-case"
      initialDomain="supervisory-case"
      initialRows={initialRows}
      fields={[
        { name: "title", label: "사례명" },
        { name: "body", label: "사고개요/지적사항/시사점" },
        { name: "source_name", label: "기관" },
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
