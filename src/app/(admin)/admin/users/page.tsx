import { AdminUsersCrud } from "@/components/layout/admin-users-crud";
import { getAdminProfiles } from "@/lib/admin-list";

export default async function AdminUsersPage() {
  const initialRows = await getAdminProfiles();

  return <AdminUsersCrud initialRows={initialRows} />;
}
