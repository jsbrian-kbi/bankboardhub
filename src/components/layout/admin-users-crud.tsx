"use client";

import { AdminCrudPage } from "@/components/layout/admin-crud-page";

interface AdminUsersCrudProps {
  initialRows: Record<string, unknown>[];
}

export function AdminUsersCrud({ initialRows }: AdminUsersCrudProps) {
  return (
    <AdminCrudPage
      title="사용자 관리"
      description="사용자 권한 및 상태를 관리합니다."
      endpoint="/api/admin/users"
      initialRows={initialRows}
      fields={[
        { name: "email", label: "이메일" },
        { name: "full_name", label: "이름" },
        { name: "role", label: "역할(user/admin)" },
        { name: "organization", label: "소속" },
      ]}
      columns={[
        { key: "email", label: "이메일" },
        { key: "full_name", label: "이름" },
        { key: "role", label: "역할" },
        { key: "organization", label: "소속" },
      ]}
      getPatchPayload={(form) => ({
        full_name: form.full_name,
        role: form.role,
        organization: form.organization,
      })}
    />
  );
}
