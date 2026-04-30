function formatKRW(value) {
  return `${new Intl.NumberFormat("ko-KR").format(Number(value) || 0)}\uC6D0`;
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatSettlementMonth(year, month) {
  if (!year || !month) return "-";
  return `${year}.${String(month).padStart(2, "0")}`;
}

function getStatusMeta(status) {
  switch (status) {
    case "COMPLETED":
      return {
        label: "\uC9C0\uAE09 \uC644\uB8CC",
        className: "bg-emerald-100 text-emerald-700",
      };
    case "PROCESSING":
      return {
        label: "\uC9C0\uAE09 \uCC98\uB9AC \uC911",
        className: "bg-amber-100 text-amber-700",
      };
    case "FAILED":
      return {
        label: "\uC9C0\uAE09 \uC2E4\uD328",
        className: "bg-rose-100 text-rose-700",
      };
    case "PENDING":
    default:
      return {
        label: "\uC9C0\uAE09 \uB300\uAE30",
        className: "bg-slate-100 text-slate-700",
      };
  }
}

function getFailureReasonText(reason) {
  if (!reason) return "";

  switch (reason) {
    case "WALLET_NOT_FOUND":
      return "\uC9C0\uAC11\uC744 \uCC3E\uC9C0 \uBABB\uD574 \uC9C0\uAE09\uC5D0 \uC2E4\uD328\uD588\uC5B4\uC694.";
    case "INVALID_PAYOUT_AMOUNT":
      return "\uC9C0\uAE09 \uAE08\uC561\uC774 \uC62C\uBC14\uB974\uC9C0 \uC54A\uC544 \uC2E4\uD328\uD588\uC5B4\uC694.";
    case "DUPLICATE_PAYOUT":
      return "\uC774\uBBF8 \uCC98\uB9AC\uB41C \uC815\uC0B0\uC73C\uB85C \uD655\uC778\uB410\uC5B4\uC694.";
    case "SETTLEMENT_NOT_FOUND":
      return "\uC815\uC0B0 \uC815\uBCF4\uB97C \uCC3E\uC9C0 \uBABB\uD574 \uC2E4\uD328\uD588\uC5B4\uC694.";
    case "TEMPORARY_DB_ERROR":
      return "\uC77C\uC2DC\uC801\uC778 DB \uC624\uB958\uB85C \uC2E4\uD328\uD588\uC5B4\uC694.";
    case "KAFKA_PUBLISH_ERROR":
      return "\uC774\uBCA4\uD2B8 \uBC1C\uD589 \uC624\uB958\uB85C \uC2E4\uD328\uD588\uC5B4\uC694.";
    case "INTERNAL_ERROR":
      return "\uC77C\uC2DC\uC801\uC778 \uB0B4\uBD80 \uC624\uB958\uB85C \uC2E4\uD328\uD588\uC5B4\uC694.";
    default:
      return reason;
  }
}

export default function MonthlySettlementTable({
  items,
  loading,
  error,
  totalCount = 0,
}) {
  if (loading) {
    return (
      <p className="py-12 text-center text-sm text-gray-500">
        {"\uC6D4 \uC815\uC0B0 \uB0B4\uC5ED\uC744 \uBD88\uB7EC\uC624\uB294 \uC911\uC785\uB2C8\uB2E4..."}
      </p>
    );
  }

  if (error) {
    return (
      <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
        {error}
      </p>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-[28px] bg-white px-6 py-10 text-center shadow-sm ring-1 ring-purple-100">
        <p className="text-sm font-semibold text-gray-700">
          {"\uC544\uC9C1 \uC6D4 \uC815\uC0B0 \uB0B4\uC5ED\uC774 \uC5C6\uC2B5\uB2C8\uB2E4."}
        </p>
        <p className="mt-2 text-sm text-gray-500">
          {
            "\uC6D4\uC815\uC0B0\uC774 \uC9D1\uACC4\uB418\uACE0 \uC9C0\uAE09\uB418\uBA74 \uC774 \uD0ED\uC5D0\uC11C \uC0C1\uD0DC\uB97C \uBC14\uB85C \uD655\uC778\uD560 \uC218 \uC788\uC5B4\uC694."
          }
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-2xl bg-violet-50 px-4 py-3 ring-1 ring-violet-100">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-700">
            월 정산 내역
          </p>
          <p className="mt-1 text-sm text-gray-600">
            {
              "\uC6D4\uC815\uC0B0 \uC0C1\uD0DC\uC640 \uC9C0\uAE09 \uC644\uB8CC \uC5EC\uBD80\uB97C \uC815\uC0B0 \uB2E8\uC704\uB85C \uD655\uC778\uD569\uB2C8\uB2E4."
            }
          </p>
        </div>
        <p className="text-sm font-bold text-violet-700">{totalCount}\uAC74</p>
      </div>

      {items.map((item) => {
        const statusMeta = getStatusMeta(item.settlementStatus);

        return (
          <article
            key={item.settlementId}
            className="rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-purple-100"
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${statusMeta.className}`}
                  >
                    {statusMeta.label}
                  </span>
                  <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-violet-700">
                    {item.settlementType === "MONTHLY"
                      ? "\uC6D4 \uC815\uC0B0"
                      : "\uBD80\uBD84 \uC815\uC0B0"}
                  </span>
                </div>
                <h3 className="mt-3 text-xl font-black tracking-tight text-gray-900">
                  {formatSettlementMonth(item.settlementYear, item.settlementMonth)}
                </h3>
                <p className="mt-1 text-xs text-gray-400">
                  정산 ID {item.settlementId?.slice?.(0, 8) || "-"}
                </p>
              </div>

              <div className="grid gap-3 text-sm md:min-w-[320px] md:grid-cols-2">
                <div>
                  <p className="text-gray-400">{"\uCD1D \uB9E4\uCD9C"}</p>
                  <p className="mt-1 font-bold text-gray-900">
                    {formatKRW(item.totalSalesAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400">{"\uC218\uC218\uB8CC"}</p>
                  <p className="mt-1 font-bold text-gray-900">
                    {formatKRW(item.feeAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400">{"\uCD5C\uC885 \uC815\uC0B0\uAE08"}</p>
                  <p className="mt-1 font-bold text-violet-700">
                    {formatKRW(item.finalSettlementAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400">{"\uC9C0\uAE09 \uC644\uB8CC \uAE08\uC561"}</p>
                  <p className="mt-1 font-bold text-gray-900">
                    {formatKRW(item.settledAmount)}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-3 rounded-2xl bg-gray-50 px-4 py-4 text-sm md:grid-cols-3">
              <div>
                <p className="text-gray-400">{"\uC9C0\uAE09 \uC694\uCCAD \uC2DC\uAC01"}</p>
                <p className="mt-1 font-medium text-gray-700">{formatDate(item.requestedAt)}</p>
              </div>
              <div>
                <p className="text-gray-400">{"\uC9C0\uAE09 \uC644\uB8CC \uC2DC\uAC01"}</p>
                <p className="mt-1 font-medium text-gray-700">{formatDate(item.settledAt)}</p>
              </div>
              <div>
                <p className="text-gray-400">{"\uCD5C\uADFC \uAC31\uC2E0"}</p>
                <p className="mt-1 font-medium text-gray-700">{formatDate(item.updatedAt)}</p>
              </div>
            </div>

            {item.settlementStatus === "FAILED" ? (
              <div className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-100">
                <p className="font-semibold">{"\uC2E4\uD328 \uC0AC\uC720"}</p>
                <p className="mt-1">{getFailureReasonText(item.lastFailureReason)}</p>
              </div>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
