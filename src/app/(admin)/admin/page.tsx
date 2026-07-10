import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>관리자 대시보드</CardTitle>
      </CardHeader>
      <CardContent>
        콘텐츠 등록·목록 조회·수정·삭제를 통합 관리하는 운영 콘솔입니다. 각 메뉴에서 등록 후 하단 목록에서 수정/삭제할 수 있습니다.
      </CardContent>
    </Card>
  );
}
