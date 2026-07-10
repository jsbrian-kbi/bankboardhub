import { AdminContentManager } from "@/components/layout/admin-content-manager";
import { getAdminContent } from "@/lib/admin-list";

export default async function AdminRegulationPage() {
  const initialRows = await getAdminContent("regulation");

  return (
    <AdminContentManager
      title="법규 등록"
      description="법령·조문·정책 문서와 웹사이트를 등록합니다."
      domain="regulation"
      publicPath="/regulation"
      initialRows={initialRows}
      fields={[
        { name: "title", label: "법령/조문명" },
        { name: "body", label: "조문내용/요약" },
        { name: "source_name", label: "법령구분" },
        { name: "source_url", label: "원문 링크" },
        { name: "published_at", label: "개정일(YYYY-MM-DD)" },
      ]}
      columns={[
        { key: "title", label: "법령/조문명" },
        { key: "source_name", label: "법령구분" },
        { key: "published_at", label: "개정일" },
        { key: "created_at", label: "등록일" },
      ]}
    />
  );
}
