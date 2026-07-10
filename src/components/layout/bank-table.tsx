import { PublicBank } from "@/lib/public-data";
import { Card, CardContent } from "@/components/ui/card";

interface BankTableProps {
  banks: PublicBank[];
}

export function BankTable({ banks }: BankTableProps) {
  if (banks.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-slate-600">
          등록된 은행 이사회 현황이 없습니다. 관리자 페이지에서 데이터를 등록해주세요.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="overflow-x-auto p-0">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
              <th className="px-4 py-3 font-medium">기관명</th>
              <th className="px-4 py-3 font-medium">이사회 규모</th>
              <th className="px-4 py-3 font-medium">사외이사 수</th>
              <th className="px-4 py-3 font-medium">여성 이사 비율</th>
              <th className="px-4 py-3 font-medium">임기 현황</th>
            </tr>
          </thead>
          <tbody>
            {banks.map((bank) => (
              <tr key={bank.id} className="border-b border-slate-100">
                <td className="px-4 py-3 font-medium text-slate-900">{bank.name}</td>
                <td className="px-4 py-3">{bank.board_size ?? "-"}</td>
                <td className="px-4 py-3">{bank.outside_director_count ?? "-"}</td>
                <td className="px-4 py-3">{bank.female_ratio != null ? `${bank.female_ratio}%` : "-"}</td>
                <td className="px-4 py-3">{bank.term_status ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
