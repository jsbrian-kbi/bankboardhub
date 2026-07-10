import { AdminCrudPage } from "@/components/layout/admin-crud-page";
import { getAdminContent } from "@/lib/admin-list";

export default async function AdminPrecedentsPage() {
  const initialRows = await getAdminContent("precedent");

  return (
    <AdminCrudPage
      title="판례 등록"
      description="사외이사 관련 판례를 구조화하여 등록합니다."
      endpoint="/api/admin/content"
      listEndpoint="/api/admin/content?domain=precedent"
      initialDomain="precedent"
      initialRows={initialRows}
      fields={[
        { name: "title", label: "사건명" },
        { name: "body", label: "쟁점/판결요지/시사점" },
        { name: "source_name", label: "법원" },
        { name: "published_at", label: "판결일(YYYY-MM-DD)" },
      ]}
      columns={[
        { key: "title", label: "사건명" },
        { key: "source_name", label: "법원" },
        { key: "published_at", label: "판결일" },
        { key: "created_at", label: "등록일" },
      ]}
    />
  );
}
