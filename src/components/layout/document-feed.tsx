import Link from "next/link";
import { PublicDocument } from "@/lib/public-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface DocumentFeedProps {
  items: PublicDocument[];
  emptyMessage?: string;
}

export function DocumentFeed({
  items,
  emptyMessage = "등록된 콘텐츠가 없습니다. 관리자 페이지에서 데이터를 등록해주세요.",
}: DocumentFeedProps) {
  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-slate-600">{emptyMessage}</CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {items.map((item) => (
        <Card key={item.id}>
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-lg">{item.title}</CardTitle>
              {item.source_name ? <Badge>{item.source_name}</Badge> : null}
            </div>
            <p className="text-xs text-slate-500">
              {item.published_at ? `발행일 ${item.published_at}` : `등록일 ${formatDate(item.created_at)}`}
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{item.body}</p>
            {item.source_url ? (
              <Link
                href={item.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-slate-900 underline"
              >
                원문 보기
              </Link>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("ko-KR");
}
