import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ApiError } from "../../api/client";
import Button from "../../components/common/Button";
import ConfirmModal from "../../components/common/ConfirmModal";
import PageContainer from "../../components/common/PageContainer";
import { cancelOrderApi, getOrderDetailApi } from "../../features/order/orderApi";
import { pushToast } from "../../features/notification/notificationToastStore";

const REASON_OPTIONS = [
  { value: "CHANGE_OF_MIND", label: "단순 변심", liability: "BUYER" },
  { value: "WRONG_OPTION", label: "옵션 변경 (색상/사이즈 등)", liability: "BUYER" },
  { value: "WRONG_PRODUCT", label: "다른 상품 주문", liability: "BUYER" },
  { value: "DEFECTIVE", label: "상품 불량/파손", liability: "SELLER" },
  { value: "WRONG_DELIVERY", label: "오배송", liability: "SELLER" },
  { value: "PRODUCT_INFO_MISMATCH", label: "상품 정보 불일치", liability: "SELLER" },
  { value: "DELIVERY_DELAY", label: "배송 지연", liability: "SELLER" },
  { value: "OTHER", label: "기타", liability: "UNKNOWN" },
];

function formatPrice(value) {
  return new Intl.NumberFormat("ko-KR").format(Number(value ?? 0));
}

function getItemActionability(status) {
  const upper = status?.toUpperCase();
  if (["PENDING", "CONFIRMED", "PREPARING"].includes(upper)) {
    return { type: "CANCEL", label: "취소 가능", canSelect: true };
  }
  if (upper === "DELIVERED") {
    return { type: "RETURN", label: "반품 가능", canSelect: true };
  }
  if (upper === "SHIPPING") {
    return { type: "NONE", label: "배송 중 (도착 후 반품 가능)", canSelect: false };
  }
  if (upper === "COMPLETED") {
    return { type: "NONE", label: "구매 확정", canSelect: false };
  }
  if (upper === "CANCELED") {
    return { type: "NONE", label: "이미 취소됨", canSelect: false };
  }
  return { type: "NONE", label: status || "처리 불가", canSelect: false };
}

function getThumbnailSrc(thumbnailKey) {
  if (typeof thumbnailKey !== "string") return "";
  return /^https?:\/\//.test(thumbnailKey) ? thumbnailKey : "";
}

export default function OrderCancellationPage() {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  // orderItemId → { reason, detail }
  const [itemReasons, setItemReasons] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        setLoadError("");
        const result = await getOrderDetailApi(orderId);
        if (!mounted) return;
        setOrder(result);
      } catch (err) {
        if (!mounted) return;
        if (err instanceof ApiError && err.status === 401) {
          navigate("/login");
          return;
        }
        setLoadError(err instanceof ApiError ? err.message : "주문 정보를 불러오는 중 오류가 발생했습니다.");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [navigate, orderId]);

  const items = useMemo(() => Array.isArray(order?.items) ? order.items : [], [order]);

  const itemRows = useMemo(() => items.map((item) => {
    const action = getItemActionability(item.status);
    return { item, action };
  }), [items]);

  const selectableRows = itemRows.filter((row) => row.action.canSelect);
  const selectedIds = useMemo(() => Object.keys(itemReasons), [itemReasons]);
  const allSelected =
    selectableRows.length > 0 &&
    selectableRows.every((row) => itemReasons[row.item.orderItemId]);

  const selectedRows = itemRows.filter((row) => itemReasons[row.item.orderItemId]);
  const refundAmount = selectedRows.reduce((sum, row) => sum + Number(row.item.totalPrice ?? 0), 0);

  const hasCancel = selectedRows.some((row) => row.action.type === "CANCEL");
  const hasReturn = selectedRows.some((row) => row.action.type === "RETURN");
  const headerLabel = hasCancel && hasReturn
    ? "취소/반품 신청"
    : hasReturn
      ? "반품 신청"
      : hasCancel
        ? "주문 취소"
        : "취소/반품 신청";

  function toggleItem(orderItemId) {
    setItemReasons((prev) => {
      const next = { ...prev };
      if (next[orderItemId]) delete next[orderItemId];
      else next[orderItemId] = { reason: "", detail: "" };
      return next;
    });
    setSubmitError("");
  }

  function toggleAll() {
    if (allSelected) {
      setItemReasons({});
    } else {
      const next = { ...itemReasons };
      selectableRows.forEach((row) => {
        if (!next[row.item.orderItemId]) next[row.item.orderItemId] = { reason: "", detail: "" };
      });
      setItemReasons(next);
    }
    setSubmitError("");
  }

  function updateReason(orderItemId, field, value) {
    setItemReasons((prev) => ({
      ...prev,
      [orderItemId]: { ...prev[orderItemId], [field]: value },
    }));
    setSubmitError("");
  }

  function applyReasonToAll(orderItemId) {
    const source = itemReasons[orderItemId];
    if (!source?.reason) return;
    setItemReasons((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((id) => {
        next[id] = { reason: source.reason, detail: source.detail || "" };
      });
      return next;
    });
  }

  function handleOpenConfirm() {
    if (selectedIds.length === 0) {
      setSubmitError("취소/반품할 상품을 선택해 주세요.");
      return;
    }
    for (const id of selectedIds) {
      const r = itemReasons[id];
      if (!r.reason) {
        setSubmitError("선택한 모든 상품의 사유를 입력해 주세요.");
        return;
      }
      if (r.reason === "OTHER" && !r.detail.trim()) {
        setSubmitError("기타 사유의 상세 내용을 입력해 주세요.");
        return;
      }
    }
    setSubmitError("");
    setConfirmOpen(true);
  }

  async function handleSubmit() {
    try {
      setSubmitting(true);
      setSubmitError("");
      const itemsPayload = selectedIds.map((orderItemId) => {
        const r = itemReasons[orderItemId];
        const option = REASON_OPTIONS.find((o) => o.value === r.reason);
        return {
          orderItemId,
          reason: option?.label || r.reason,
          detailReason: r.detail.trim() || null,
        };
      });

      const result = await cancelOrderApi(orderId, {
        items: itemsPayload,
        requesterType: "BUYER",
      });
      setConfirmOpen(false);

      const canceledCount = result?.canceledItemCount ?? 0;
      const returnCount = result?.returnRequestedItemCount ?? 0;
      const refunded = result?.refundedAmount ?? 0;
      const parts = [];
      if (canceledCount > 0) parts.push(`${canceledCount}건 취소`);
      if (returnCount > 0) parts.push(`${returnCount}건 반품 신청`);
      const title = parts.length > 0 ? `${parts.join(", ")} 완료` : "신청이 완료되었습니다";
      const message = canceledCount > 0 && Number(refunded) > 0
        ? `환불 예정 금액 ${formatPrice(refunded)}원`
        : returnCount > 0
          ? "반품 수령 후 환불이 진행됩니다."
          : "";

      pushToast({
        title,
        message,
        tone: "success",
        timeoutMs: 4000,
      });

      navigate(`/orders/${orderId}`, { replace: true });
    } catch (err) {
      setConfirmOpen(false);
      setSubmitError(err instanceof ApiError ? err.message : "신청 처리 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <PageContainer>
        <p className="py-16 text-center text-sm text-gray-500">주문 정보를 불러오는 중입니다...</p>
      </PageContainer>
    );
  }

  if (loadError) {
    return (
      <PageContainer>
        <div className="rounded-[28px] bg-red-50 px-6 py-16 text-center ring-1 ring-red-100">
          <p className="mb-2 text-lg font-bold text-red-600">주문 정보를 불러오지 못했습니다</p>
          <p className="text-sm text-red-500">{loadError}</p>
        </div>
      </PageContainer>
    );
  }

  return (
    <>
      <PageContainer>
        <div className="mx-auto max-w-2xl space-y-7 pb-32 text-left">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">{headerLabel}</h1>
            <p className="mt-2 text-sm text-gray-500">취소/반품할 상품을 선택하고 상품별 사유를 작성해 주세요.</p>
          </div>

          {/* 상품 선택 + 상품별 사유 */}
          <div>
            <div className="mb-3.5 flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-gray-900">상품 선택 및 사유</h2>
              {selectableRows.length > 1 && (
                <button
                  type="button"
                  onClick={toggleAll}
                  className="text-sm font-bold text-violet-700 hover:text-violet-900 transition"
                >
                  {allSelected ? "전체 해제" : "전체 선택"}
                </button>
              )}
            </div>

            <div className="space-y-3">
              {itemRows.map(({ item, action }) => {
                const reasonState = itemReasons[item.orderItemId];
                const checked = !!reasonState;
                const thumbnailSrc = getThumbnailSrc(item.thumbnailKey);

                return (
                  <div
                    key={item.orderItemId}
                    className={[
                      "rounded-[20px] bg-white shadow-sm ring-1 transition",
                      action.canSelect
                        ? checked
                          ? "ring-violet-300"
                          : "ring-purple-100"
                        : "ring-gray-100 opacity-60",
                    ].join(" ")}
                  >
                    <label className={[
                      "flex items-start gap-4 p-5",
                      action.canSelect ? "cursor-pointer" : "cursor-not-allowed",
                    ].join(" ")}>
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={!action.canSelect}
                        onChange={() => toggleItem(item.orderItemId)}
                        className="mt-1 h-5 w-5 accent-violet-600"
                      />
                      <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-violet-50">
                        {thumbnailSrc ? (
                          <img src={thumbnailSrc} alt={item.productName} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-2xl font-black text-violet-700">
                            {(item.productName || "O").slice(0, 1).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900">{item.productName}</p>
                        <p className="mt-1.5 text-sm text-gray-500">수량 {item.quantity}개</p>
                        <p className="mt-0.5 text-sm text-gray-500">{formatPrice(item.totalPrice)}원</p>
                        <p className={[
                          "mt-2 inline-flex rounded-full px-2 py-0.5 text-xs font-bold",
                          action.canSelect
                            ? action.type === "CANCEL"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-indigo-100 text-indigo-700"
                            : "bg-gray-100 text-gray-500",
                        ].join(" ")}>
                          {action.label}
                        </p>
                      </div>
                    </label>

                    {checked && (
                      <div className="border-t border-gray-100 px-5 py-5" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1.5">사유</label>
                          <select
                            value={reasonState.reason}
                            onChange={(e) => updateReason(item.orderItemId, "reason", e.target.value)}
                            className="h-11 w-full bg-blue-50/70 pl-3 pr-10 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-violet-200 rounded-lg"
                          >
                            <option value="">선택해 주세요</option>
                            {REASON_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </select>
                          {(() => {
                            const selected = REASON_OPTIONS.find((r) => r.value === reasonState.reason);
                            if (!selected) return null;
                            const isBeforeShipping = action.type === "CANCEL";
                            if (isBeforeShipping) {
                              return (
                                <p className="mt-4 text-xs leading-5 text-emerald-600">
                                  전액 환불됩니다.
                                </p>
                              );
                            }
                            if (selected.liability === "SELLER") {
                              return (
                                <p className="mt-4 text-xs leading-5 text-indigo-600">
                                  판매자 확인 후 환불이 진행되며, 반품 배송비는 판매자가 부담합니다.
                                </p>
                              );
                            }
                            if (selected.liability === "BUYER") {
                              return (
                                <p className="mt-4 text-xs leading-5 text-amber-600">
                                  반품 배송비는 구매자가 부담합니다.
                                </p>
                              );
                            }
                            return null;
                          })()}
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1.5">
                            상세 내용 {reasonState.reason === "OTHER" && <span className="text-rose-500">*</span>}
                          </label>
                          <textarea
                            value={reasonState.detail}
                            onChange={(e) => updateReason(item.orderItemId, "detail", e.target.value)}
                            rows={2}
                            placeholder="추가 내용이 있다면 작성해 주세요."
                            className="w-full bg-blue-50/70 p-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-violet-200 rounded-lg resize-none"
                          />
                        </div>
                        {selectedIds.length > 1 && reasonState.reason && (
                          <button
                            type="button"
                            onClick={() => applyReasonToAll(item.orderItemId)}
                            className="text-xs font-bold text-violet-700 hover:text-violet-900 transition"
                          >
                            동일 사유 모든 선택 상품에 적용
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* 환불 정보 */}
          <div>
            <h2 className="text-lg font-extrabold text-gray-900" style={{ marginBottom: "0.875rem" }}>환불 정보</h2>
            <div className="rounded-[20px] bg-white p-6 shadow-sm ring-1 ring-purple-100 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">선택 상품 수</span>
                <span className="font-semibold text-gray-900">{selectedIds.length}개</span>
              </div>
              <div className="flex justify-between border-t border-gray-100 pt-3">
                <span className="font-bold text-gray-900">환불 예정 금액</span>
                <span className="font-extrabold text-violet-700">{formatPrice(refundAmount)}원</span>
              </div>
            </div>
          </div>

          {submitError && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{submitError}</p>
          )}
        </div>
      </PageContainer>

      <footer className="fixed bottom-0 left-0 z-40 w-full bg-white/90 backdrop-blur-xl">
        <div className="mx-auto max-w-3xl space-y-3 px-4 pb-8 pt-4 sm:px-6 lg:px-8">
          <Button
            size="lg"
            className="w-full"
            disabled={submitting || selectedIds.length === 0}
            onClick={handleOpenConfirm}
          >
            {submitting ? "처리 중..." : `${formatPrice(refundAmount)}원 ${headerLabel}`}
          </Button>
          <Button
            variant="secondary"
            size="lg"
            className="w-full"
            onClick={() => navigate(-1)}
          >
            돌아가기
          </Button>
        </div>
      </footer>

      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={`${headerLabel}을 진행할까요?`}
        description={`선택한 ${selectedIds.length}개 상품에 대해 ${formatPrice(refundAmount)}원이 환불됩니다.`}
        confirmText="신청하기"
        loading={submitting}
        onConfirm={handleSubmit}
      />
    </>
  );
}
