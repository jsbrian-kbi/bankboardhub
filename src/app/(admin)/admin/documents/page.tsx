import { AdminCrudPage } from "@/components/layout/admin-crud-page";
import { FileUploadForm } from "@/components/layout/file-upload-form";
import { getAdminContent } from "@/lib/admin-list";

export default async function AdminDocumentsPage() {
  const initialRows = await getAdminContent("resources");

  return (
    <div className="grid gap-6">
      <FileUploadForm />
      <AdminCrudPage
        title="문서 메타 등록"
        description="파일 없이 메타데이터만 등록하거나 외부 링크를 추가합니다."
        endpoint="/api/admin/content"
        listEndpoint="/api/admin/content?domain=resources"
        initialDomain="resources"
        initialRows={initialRows}
        fields={[
          { name: "title", label: "문서명" },
          { name: "body", label: "요약" },
          { name: "source_name", label: "발행기관" },
          { name: "source_url", label: "원문링크" },
        ]}
        columns={[
          { key: "title", label: "문서명" },
          { key: "source_name", label: "발행기관" },
          { key: "created_at", label: "등록일" },
        ]}
      />
    </div>
  );
}
