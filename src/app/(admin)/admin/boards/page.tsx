import { AdminBoardsCrud } from "@/components/layout/admin-boards-crud";
import { getAdminContent } from "@/lib/admin-list";

export default async function AdminBoardsPage() {
  const initialRows = await getAdminContent("board-post");

  return <AdminBoardsCrud initialRows={initialRows} />;
}
