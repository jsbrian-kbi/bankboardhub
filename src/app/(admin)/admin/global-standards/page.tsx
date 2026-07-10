import { AdminContentManager } from "@/components/layout/admin-content-manager";
import { getAdminContent } from "@/lib/admin-list";

export default async function AdminGlobalStandardsPage() {
  const initialRows = await getAdminContent("global-standard");

  return (
    <AdminContentManager
      title="국제기준 등록"
      description="국제기준 문서·웹사이트를 등록합니다."
      domain="global-standard"
      publicPath="/global-standards"
      initialRows={initialRows}
      fields={[
        { name: "title", label: "기준명" },
        { name: "body", label: "핵심 요약/국내 시사점" },
        { name: "source_name", label: "기관(OECD/BCBS 등)" },
        { name: "source_url", label: "원문 링크" },
      ]}
      columns={[
        { key: "title", label: "기준명" },
        { key: "source_name", label: "기관" },
        { key: "created_at", label: "등록일" },
      ]}
    />
  );
}
