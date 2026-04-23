function formatKRW(value) {
  return `${new Intl.NumberFormat("ko-KR").format(Number(value) || 0)}원`;
}

function SummaryItem({ label, value, helper, tone = "default" }) {
  const toneClass =
    tone === "accent"
      ? "bg-violet-700 text-white"
      : tone === "success"
        ? "bg-emerald-50 text-emerald-900 ring-1 ring-emerald-100"
        : "bg-white text-gray-900 ring-1 ring-purple-100";

  return (
    <div className={`rounded-2xl p-5 shadow-sm ${toneClass}`}>
      <p className={tone === "accent" ? "text-xs text-violet-100" : "text-xs text-gray-500"}>
        {label}
      </p>
      <p className="mt-2 text-2xl font-black tracking-tight">{formatKRW(value)}</p>
      {helper ? (
        <p className={tone === "accent" ? "mt-2 text-xs text-violet-100" : "mt-2 text-xs text-gray-500"}>
          {helper}
        </p>
      ) : null}
    </div>
  );
}

export default function SellerSettlementSummary({
  walletBalance,
  pendingEscrowAmount,
  availableSettlementAmount,
  selectedSettlementAmount,
}) {
  return (
    <section className="grid gap-3 md:grid-cols-4">
      <SummaryItem
        label="현재 지갑 잔액"
        value={walletBalance}
        helper="정산 입금과 출금이 반영된 금액"
        tone="accent"
      />
      <SummaryItem
        label="에스크로 보류 금액"
        value={pendingEscrowAmount}
        helper="구매확정 전 대기 중인 판매 금액"
      />
      <SummaryItem
        label="부분 정산 가능 금액"
        value={availableSettlementAmount}
        helper="지금 선택해 정산 요청 가능한 금액"
        tone="success"
      />
      <SummaryItem
        label="선택한 정산 금액"
        value={selectedSettlementAmount}
        helper="선택 항목의 실지급 예정 합계"
      />
    </section>
  );
}
