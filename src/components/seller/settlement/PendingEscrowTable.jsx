function formatKRW(value) {
  return `${new Intl.NumberFormat("ko-KR").format(Number(value) || 0)}원`;
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function shortId(value) {
  return value ? String(value).slice(0, 8) : "-";
}

function statusLabel(status) {
  switch (status) {
    case "HELD":
      return "보류 중";
    case "RELEASED":
      return "해제";
    case "REFUNDED":
      return "환불";
    default:
      return status || "-";
  }
}

export default function PendingEscrowTable({
  items,
  loading,
  error,
  onOpenTransactions,
}) {
  if (loading) {
    return <p className="py-12 text-center text-sm text-gray-500">에스크로 보류 내역을 불러오는 중입니다...</p>;
  }

  if (error) {
    return <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{error}</p>;
  }

  if (items.length === 0) {
    return <p className="py-12 text-center text-sm text-gray-500">현재 보류 중인 에스크로 수입이 없습니다.</p>;
  }

  return (
    <div className="-mx-4 overflow-x-auto px-4">
      <table className="w-full min-w-[760px] border-separate border-spacing-y-2 text-left text-sm">
        <thead>
          <tr className="text-xs font-bold uppercase text-gray-400">
            <th className="px-4 py-2">주문</th>
            <th className="px-4 py-2">에스크로</th>
            <th className="px-4 py-2">보류 금액</th>
            <th className="px-4 py-2">상태</th>
            <th className="px-4 py-2">생성일</th>
            <th className="px-4 py-2 text-right">거래</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.escrowId} className="bg-white shadow-sm ring-1 ring-purple-100">
              <td className="rounded-l-2xl px-4 py-4 font-mono text-xs text-gray-700">
                {shortId(item.orderId)}
              </td>
              <td className="px-4 py-4 font-mono text-xs text-gray-500">
                {shortId(item.escrowId)}
              </td>
              <td className="px-4 py-4 font-extrabold text-gray-900">
                {formatKRW(item.amount)}
              </td>
              <td className="px-4 py-4">
                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                  {statusLabel(item.escrowStatus)}
                </span>
              </td>
              <td className="px-4 py-4 text-gray-500">{formatDate(item.createdAt)}</td>
              <td className="rounded-r-2xl px-4 py-4 text-right">
                <button
                  type="button"
                  onClick={() => onOpenTransactions(item.orderId)}
                  className="text-sm font-bold text-violet-700 hover:text-violet-900"
                >
                  거래 보기
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
