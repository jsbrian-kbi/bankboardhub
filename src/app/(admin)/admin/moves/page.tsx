import { AdminCrudPage } from "@/components/layout/admin-crud-page";

export default function AdminMovesPage() {
  return (
    <AdminCrudPage
      title="인사동정 등록"
      description="사외이사 신규선임·재선임·사임·임기만료 정보를 등록합니다."
      endpoint="/api/admin/content"
      listEndpoint="/api/admin/content?domain=move"
      initialDomain="move"
      fields={[
        { name: "title", label: "인사 제목" },
        { name: "body", label: "상세 내용" },
        { name: "source_name", label: "기관명" },
        { name: "published_at", label: "발표일(YYYY-MM-DD)" },
      ]}
      columns={[
        { key: "title", label: "제목" },
        { key: "source_name", label: "기관" },
        { key: "published_at", label: "발표일" },
      ]}
    />
  );
}
