import { AdminCrudPage } from "@/components/layout/admin-crud-page";

export default function AdminNewsPage() {
  return (
    <AdminCrudPage
      title="뉴스 등록"
      description="내/외부 출처 뉴스를 등록하고 분류합니다."
      endpoint="/api/admin/content"
      listEndpoint="/api/admin/content?domain=news"
      initialDomain="news"
      fields={[
        { name: "title", label: "제목" },
        { name: "body", label: "요약/본문" },
        { name: "source_name", label: "출처" },
        { name: "source_url", label: "링크" },
        { name: "published_at", label: "발행일(YYYY-MM-DD)" },
      ]}
      columns={[
        { key: "title", label: "제목" },
        { key: "source_name", label: "출처" },
        { key: "published_at", label: "발행일" },
        { key: "created_at", label: "등록일" },
      ]}
    />
  );
}
