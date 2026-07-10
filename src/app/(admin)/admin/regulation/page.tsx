import { AdminCrudPage } from "@/components/layout/admin-crud-page";

export default function AdminRegulationPage() {
  return (
    <AdminCrudPage
      title="법규 등록"
      description="법령·조문·정책 자료를 등록합니다."
      endpoint="/api/admin/content"
      listEndpoint="/api/admin/content?domain=regulation"
      initialDomain="regulation"
      fields={[
        { name: "title", label: "법령/조문명" },
        { name: "body", label: "조문내용/요약" },
        { name: "source_name", label: "법령구분" },
        { name: "published_at", label: "개정일(YYYY-MM-DD)" },
      ]}
      columns={[
        { key: "title", label: "법령/조문명" },
        { key: "source_name", label: "법령구분" },
        { key: "published_at", label: "개정일" },
      ]}
    />
  );
}
