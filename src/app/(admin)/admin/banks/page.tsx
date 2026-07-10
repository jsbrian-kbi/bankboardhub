import { AdminCrudPage } from "@/components/layout/admin-crud-page";

export default function AdminBanksPage() {
  return (
    <AdminCrudPage
      title="은행정보 수정"
      description="은행/지주 이사회 현황 데이터를 수정합니다."
      endpoint="/api/admin/banks"
      fields={[
        { name: "name", label: "기관명" },
        { name: "board_size", label: "이사회 규모" },
        { name: "outside_director_count", label: "사외이사 수" },
        { name: "female_ratio", label: "여성 이사 비율" },
        { name: "term_status", label: "임기 현황" },
      ]}
      columns={[
        { key: "name", label: "기관명" },
        { key: "board_size", label: "이사회 규모" },
        { key: "outside_director_count", label: "사외이사 수" },
        { key: "female_ratio", label: "여성 비율" },
        { key: "term_status", label: "임기 현황" },
      ]}
    />
  );
}
