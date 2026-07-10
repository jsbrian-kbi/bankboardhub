import { PublicDocument } from "@/lib/public-data";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface TimelineFeedProps {
  items: PublicDocument[];
  emptyMessage?: string;
}

export function TimelineFeed({
  items,
  emptyMessage = "등록된 인사동정이 없습니다.",
}: TimelineFeedProps) {
  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-slate-600">{emptyMessage}</CardContent>
      </Card>
    );
  }

  return (
    <div className="relative space-y-6 border-l border-slate-200 pl-6">
      {items.map((item) => (
        <div key={item.id} className="relative">
          <span className="absolute -left-[1.6rem] top-1 h-3 w-3 rounded-full bg-slate-900" />
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-slate-900">{item.title}</p>
              {item.source_name ? <Badge>{item.source_name}</Badge> : null}
            </div>
            <p className="text-xs text-slate-500">
              {item.published_at ? item.published_at : new Date(item.created_at).toLocaleDateString("ko-KR")}
            </p>
            <p className="text-sm leading-relaxed text-slate-700">{item.body}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
