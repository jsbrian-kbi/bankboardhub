import { PublicEducation } from "@/lib/public-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface EducationListProps {
  programs: PublicEducation[];
}

export function EducationList({ programs }: EducationListProps) {
  if (programs.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-slate-600">
          등록된 교육 과정이 없습니다. 관리자 페이지에서 과정을 등록해주세요.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {programs.map((program) => (
        <Card key={program.id}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">{program.title}</CardTitle>
              <Badge>{program.track}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-700">
            {program.starts_at ? <p>일정: {formatDateTime(program.starts_at)}</p> : null}
            {program.application_deadline ? (
              <p>신청 마감: {formatDateTime(program.application_deadline)}</p>
            ) : null}
            {program.capacity != null ? <p>정원: {program.capacity}명</p> : null}
            {program.description ? <p className="text-slate-600">{program.description}</p> : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("ko-KR");
}
