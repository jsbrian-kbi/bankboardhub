export interface AdminMenuItem {
  href: string;
  label: string;
  publicHref?: string | null;
}

export const ADMIN_MENUS: AdminMenuItem[] = [
  { href: "/admin/content-agent", label: "AI 등록 도우미" },
  { href: "/admin/news", label: "뉴스 등록", publicHref: "/news" },
  { href: "/admin/regulation", label: "법규 등록", publicHref: "/regulation" },
  { href: "/admin/precedents", label: "판례 등록", publicHref: "/precedents" },
  { href: "/admin/supervisory-cases", label: "검사사례 등록", publicHref: "/supervisory-cases" },
  { href: "/admin/moves", label: "인사동정 등록", publicHref: "/moves" },
  { href: "/admin/global-standards", label: "국제기준 등록", publicHref: "/global-standards" },
  { href: "/admin/education", label: "교육 등록", publicHref: "/education" },
  { href: "/admin/banks", label: "은행정보 수정", publicHref: "/bank-status" },
  { href: "/admin/documents", label: "자료실 등록", publicHref: "/resources" },
  { href: "/admin/users", label: "사용자 관리" },
  { href: "/admin/boards", label: "게시판 관리" },
];

export const ADMIN_QUICK_LINKS = ADMIN_MENUS.filter((menu) =>
  [
    "/admin/content-agent",
    "/admin/news",
    "/admin/regulation",
    "/admin/precedents",
    "/admin/supervisory-cases",
    "/admin/documents",
    "/admin/banks",
    "/admin/education",
    "/admin/users",
  ].includes(menu.href),
);
