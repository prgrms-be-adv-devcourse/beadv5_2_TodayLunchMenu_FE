import Button from "../../common/Button";

function formatKRW(value) {
  return `${new Intl.NumberFormat("ko-KR").format(Number(value) || 0)}원`;
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("ko-KR", {
    dateStyle: "medium",
  });
}

function shortId(value) {
  return value ? String(value).slice(0, 8) : "-";
}

export default function PartialSettlementTable({
  items,
  selectedIds,
  loading,
  error,
  submitting,
  onToggle,
  onToggleAll,
  onSubmit,
}) {
  const allSelected = items.length > 0 && selectedIds.length === items.length;
  const selectedAmount = items
    .filter((item) => selectedIds.includes(item.settlementItemId))
    .reduce((sum, item) => sum + item.netAmount, 0);

  if (loading) {
    return <p className="py-12 text-center text-sm text-gray-500">부분 정산 가능 항목을 불러오는 중입니다...</p>;
  }

  if (error) {
    return <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{error}</p>;
  }

  if (items.length === 0) {
    return <p className="py-12 text-center text-sm text-gray-500">지금 부분 정산할 수 있는 항목이 없습니다.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-purple-100 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs text-gray-500">선택한 실지급 예정 금액</p>
          <p className="text-xl font-black text-gray-900">{formatKRW(selectedAmount)}</p>
        </div>
        <Button
          size="md"
          disabled={selectedIds.length === 0 || submitting}
          onClick={onSubmit}
          className="w-full md:w-auto"
        >
          {submitting ? "정산 요청 중..." : "선택 항목 정산 요청"}
        </Button>
      </div>

      <div className="-mx-4 overflow-x-auto px-4">
        <table className="w-full min-w-[880px] border-separate border-spacing-y-2 text-left text-sm">
          <thead>
            <tr className="text-xs font-bold uppercase text-gray-400">
              <th className="px-4 py-2">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onToggleAll}
                  className="h-4 w-4 rounded border-purple-200 text-violet-700"
                />
              </th>
              <th className="px-4 py-2">주문</th>
              <th className="px-4 py-2">판매 금액</th>
              <th className="px-4 py-2">수수료</th>
              <th className="px-4 py-2">정산 가능 금액</th>
              <th className="px-4 py-2">정산 가능일</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const checked = selectedIds.includes(item.settlementItemId);

              return (
                <tr key={item.settlementItemId} className="bg-white shadow-sm ring-1 ring-purple-100">
                  <td className="rounded-l-2xl px-4 py-4">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onToggle(item.settlementItemId)}
                      className="h-4 w-4 rounded border-purple-200 text-violet-700"
                    />
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-mono text-xs font-bold text-gray-800">{shortId(item.orderId)}</p>
                    <p className="mt-1 font-mono text-[11px] text-gray-400">item {shortId(item.settlementItemId)}</p>
                  </td>
                  <td className="px-4 py-4 text-gray-700">{formatKRW(item.grossAmount)}</td>
                  <td className="px-4 py-4 text-gray-500">-{formatKRW(item.feeAmount)}</td>
                  <td className="px-4 py-4 font-extrabold text-violet-700">{formatKRW(item.netAmount)}</td>
                  <td className="rounded-r-2xl px-4 py-4 text-gray-500">{formatDate(item.releasedAt)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
