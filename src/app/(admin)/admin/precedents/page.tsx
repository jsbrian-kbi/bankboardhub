import { AdminContentManager } from "@/components/layout/admin-content-manager";
import { getAdminContent } from "@/lib/admin-list";

export default async function AdminPrecedentsPage() {
  const initialRows = await getAdminContent("precedent");

  return (
    <AdminContentManager
      title="판례 등록"
      description="판례 문서·웹사이트를 등록합니다."
      domain="precedent"
      publicPath="/precedents"
      initialRows={initialRows}
      fields={[
        { name: "title", label: "사건명" },
        { name: "body", label: "쟁점/판결요지/시사점" },
        { name: "source_name", label: "법원" },
        { name: "source_url", label: "원문 링크" },
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
