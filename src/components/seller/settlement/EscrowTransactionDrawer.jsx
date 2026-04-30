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

function typeLabel(type) {
  switch (type) {
    case "HOLD":
      return "정산 대기";
    case "RELEASE":
      return "정산 완료";
    case "REFUND":
      return "환불";
    default:
      return type || "-";
  }
}

export default function EscrowTransactionDrawer({
  open,
  orderId,
  items,
  loading,
  error,
  onClose,
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[70] bg-gray-900/40 px-4 py-6 backdrop-blur-sm">
      <div className="ml-auto flex h-full w-full max-w-xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-purple-100 px-6 py-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-700">
              에스크로 기록
            </p>
            <h2 className="mt-1 text-xl font-black text-gray-900">에스크로 거래 내역</h2>
            <p className="mt-1 font-mono text-xs text-gray-400">{orderId || "-"}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-purple-100 px-3 py-1.5 text-sm font-bold text-violet-700 hover:bg-purple-200"
          >
            닫기
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {loading ? (
            <p className="py-12 text-center text-sm text-gray-500">거래 내역을 불러오는 중입니다...</p>
          ) : error ? (
            <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{error}</p>
          ) : items.length === 0 ? (
            <p className="py-12 text-center text-sm text-gray-500">표시할 에스크로 거래 내역이 없습니다.</p>
          ) : (
            <ol className="space-y-3">
              {items.map((item) => (
                <li
                  key={item.escrowTransactionId}
                  className="rounded-2xl bg-purple-50/70 p-4 ring-1 ring-purple-100"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-violet-700">
                        {typeLabel(item.transactionType)}
                      </span>
                      <p className="mt-3 text-lg font-black text-gray-900">
                        {formatKRW(item.amount)}
                      </p>
                    </div>
                    <p className="text-right text-xs text-gray-500">
                      {formatDate(item.occurredAt || item.createdAt)}
                    </p>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-gray-500">
                    <div>
                      <p>이전 금액</p>
                      <p className="font-bold text-gray-900">{formatKRW(item.beforeAmount)}</p>
                    </div>
                    <div>
                      <p>이후 금액</p>
                      <p className="font-bold text-gray-900">{formatKRW(item.afterAmount)}</p>
                    </div>
                  </div>
                  {item.description ? (
                    <p className="mt-3 text-sm text-gray-600">{item.description}</p>
                  ) : null}
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}
