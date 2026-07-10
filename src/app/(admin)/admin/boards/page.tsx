import { AdminCrudPage } from "@/components/layout/admin-crud-page";
import { getAdminContent } from "@/lib/admin-list";

export default async function AdminBoardsPage() {
  const initialRows = await getAdminContent("board-post");

  return (
    <AdminCrudPage
      title="게시판 관리"
      description="공지·Q&A 게시판 메타설정을 저장합니다."
      endpoint="/api/admin/content"
      listEndpoint="/api/admin/content?domain=board-post"
      initialDomain="board-post"
      initialRows={initialRows}
      transformPayload={(form) => ({
        domain: "board-post",
        title: form.board_name,
        body: `access_role=${form.access_role}; enabled=${form.enabled}; ${form.description ?? ""}`,
        is_public: false,
      })}
      getPatchPayload={(form) => ({
        title: form.board_name,
        body: `access_role=${form.access_role}; enabled=${form.enabled}; ${form.description ?? ""}`,
      })}
      mapRowToForm={(row) => {
        const body = String(row.body ?? "");
        const accessMatch = body.match(/access_role=([^;]+)/);
        const enabledMatch = body.match(/enabled=([^;]+)/);
        const description = body.replace(/^access_role=[^;]+;\s*enabled=[^;]+;\s*/, "");
        return {
          board_name: String(row.title ?? ""),
          access_role: accessMatch?.[1]?.trim() ?? "",
          enabled: enabledMatch?.[1]?.trim() ?? "",
          description,
        };
      }}
      fields={[
        { name: "board_name", label: "게시판명" },
        { name: "access_role", label: "접근권한" },
        { name: "enabled", label: "활성화(true/false)" },
        { name: "description", label: "설명" },
      ]}
      columns={[
        { key: "title", label: "게시판명" },
        { key: "body", label: "설정" },
        { key: "created_at", label: "등록일" },
      ]}
    />
  );
}
