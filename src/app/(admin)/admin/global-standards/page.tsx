import { AdminCrudPage } from "@/components/layout/admin-crud-page";

export default function AdminGlobalStandardsPage() {
  return (
    <AdminCrudPage
      title="국제기준 등록"
      description="OECD, BCBS, BIS 등 국제기준 요약과 국내 시사점을 등록합니다."
      endpoint="/api/admin/content"
      listEndpoint="/api/admin/content?domain=global-standard"
      initialDomain="global-standard"
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
