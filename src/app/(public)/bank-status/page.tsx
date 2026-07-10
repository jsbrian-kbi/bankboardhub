import { PageShell } from "@/components/layout/page-shell";
import { BankTable } from "@/components/layout/bank-table";
import { getBanks } from "@/lib/public-data";

export default async function BankStatusPage() {
  const banks = await getBanks();

  return (
    <PageShell title="은행 이사회 현황" description="국내 은행 및 금융지주 이사회 구성 데이터를 비교·조회합니다.">
      <BankTable banks={banks} />
    </PageShell>
  );
}
