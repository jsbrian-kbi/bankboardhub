import { AdminCrudPage } from "@/components/layout/admin-crud-page";

export default function AdminEducationPage() {
  return (
    <AdminCrudPage
      title="교육 등록"
      description="교육 과정을 생성하고 접수기간을 관리합니다."
      endpoint="/api/admin/education"
      fields={[
        { name: "title", label: "과정명" },
        { name: "track", label: "유형" },
        { name: "starts_at", label: "시작일시(ISO)" },
        { name: "ends_at", label: "종료일시(ISO)" },
        { name: "application_deadline", label: "신청마감(ISO)" },
        { name: "capacity", label: "정원" },
        { name: "description", label: "설명" },
      ]}
      columns={[
        { key: "title", label: "과정명" },
        { key: "track", label: "유형" },
        { key: "starts_at", label: "시작일시" },
        { key: "capacity", label: "정원" },
      ]}
    />
  );
}
