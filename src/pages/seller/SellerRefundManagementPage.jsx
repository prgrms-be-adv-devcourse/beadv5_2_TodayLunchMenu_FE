import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";

import { ApiError } from "../../api/client";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";
import PageContainer from "../../components/common/PageContainer";
import PageHeader from "../../components/common/PageHeader";
import SellerNav from "../../components/seller/SellerNav";
import { pushToast } from "../../features/notification/notificationToastStore";
import { useAuth } from "../../features/auth/useAuth";
import {
  getSellerReturnRequestsApi,
  inspectReturnRequestApi,
} from "../../features/seller/sellerRefundApi";

const REFUND_STATUS = {
  RECEIVED: { label: "검수 대기", className: "bg-amber-100 text-amber-700" },
  PENDING: { label: "수령 대기", className: "bg-amber-100 text-amber-700" },
  SHIPPED: { label: "배송 중", className: "bg-blue-100 text-blue-700" },
  DELIVERED: { label: "수령 완료", className: "bg-indigo-100 text-indigo-700" },
  COMPLETED: { label: "환불 완료", className: "bg-emerald-100 text-emerald-700" },
  CONFIRMED: { label: "검수 완료", className: "bg-emerald-100 text-emerald-700" },
  REFUNDED: { label: "환불 완료", className: "bg-emerald-100 text-emerald-700" },
  FAILED: { label: "거절", className: "bg-red-100 text-red-700" },
  REJECTED: { label: "거절", className: "bg-red-100 text-red-700" },
};

const TABS = [
  { value: "RECEIVED", label: "처리 대기" },
  { value: "COMPLETED", label: "처리 완료" },
  { value: "FAILED", label: "거절" },
];

function formatPrice(value) {
  return `${new Intl.NumberFormat("ko-KR").format(Number(value) || 0)}원`;
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getErrorMessage(error, fallback) {
  return error instanceof ApiError ? error.message : fallback;
}

function calcTotal(items) {
  if (!Array.isArray(items)) return 0;
  return items.reduce((sum, item) => sum + Number(item.price ?? 0) * Number(item.quantity ?? 0), 0);
}

function RefundCard({ refund, onInspect }) {
  const totalPrice = calcTotal(refund.items);
  const status = REFUND_STATUS[refund.status] || { label: refund.status, className: "bg-gray-100 text-gray-700" };
  const canInspect = ["RECEIVED", "DELIVERED", "PENDING"].includes(refund.status);
  const isCompleted = refund.status === "COMPLETED";
  const isFailed = refund.status === "FAILED" || refund.status === "REJECTED";

  return (
    <div className="rounded-[20px] bg-white p-6 shadow-sm ring-1 ring-purple-100 space-y-4 text-left">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 text-sm">
          <p className="text-gray-400">주문번호</p>
          <p className="font-semibold text-gray-900">{refund.orderId}</p>
        </div>
        <span className={`inline-flex shrink-0 rounded-full px-3 py-1 text-xs font-bold ${status.className}`}>
          {status.label}
        </span>
      </div>

      <div className="text-sm">
        <p className="text-gray-400">구매자</p>
        <p className="mt-1 font-semibold text-gray-900">{refund.buyerName || "-"}</p>
      </div>

      <hr className="border-gray-100" />

      <div>
        <p className="mb-2 text-xs font-bold text-gray-500">반품 상품</p>
        <div className="space-y-2 rounded-xl bg-violet-50/50 p-4 text-sm">
          {refund.items?.length > 0 ? (
            refund.items.map((item, idx) => (
              <div key={idx} className="flex items-start justify-between gap-3">
                <span className="text-gray-700">{item.productName} × {item.quantity}</span>
                <span className="font-semibold text-gray-900">{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))
          ) : (
            <p className="text-gray-400">상품 정보 없음</p>
          )}
        </div>
      </div>

      {refund.reason && (
        <div className="text-sm">
          <p className="text-gray-400">반품 사유</p>
          <p className="mt-1 whitespace-pre-line font-semibold text-gray-900">{refund.reason}</p>
        </div>
      )}

      <div className="text-sm">
        <p className="text-gray-400">신청 일시</p>
        <p className="mt-1 font-semibold text-gray-900">{formatDate(refund.createdAt)}</p>
      </div>

      {/* 처리 결과 (완료/거절) */}
      {(isCompleted || isFailed) && (
        <>
          <hr className="border-gray-100" />
          <div className="space-y-3 text-sm">
            <p className="text-xs font-bold text-gray-500">처리 결과</p>
            {refund.processedAt && (
              <div className="flex justify-between">
                <span className="text-gray-400">처리 일시</span>
                <span className="font-semibold text-gray-900">{formatDate(refund.processedAt)}</span>
              </div>
            )}
            {isCompleted && refund.responsibilityType && (
              <div className="flex justify-between">
                <span className="text-gray-400">귀책</span>
                <span className="font-semibold text-gray-900">
                  {refund.responsibilityType === "BUYER" ? "구매자" : "판매자"}
                </span>
              </div>
            )}
            {isCompleted && refund.refundedAmount != null && (
              <div className="flex justify-between border-t border-gray-100 pt-3">
                <span className="font-bold text-gray-900">환불 금액</span>
                <span className="font-extrabold text-violet-700">{formatPrice(refund.refundedAmount)}</span>
              </div>
            )}
            {isFailed && refund.rejectReason && (
              <div>
                <p className="text-gray-400">거절 사유</p>
                <p className="mt-1 whitespace-pre-line font-semibold text-gray-900">{refund.rejectReason}</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* 검수 대기 상태일 때만 환불 예정액 + 검수 버튼 */}
      {canInspect && (
        <>
          <hr className="border-gray-100" />
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-gray-900">환불 예정액</span>
            <span className="text-lg font-extrabold text-violet-700">{formatPrice(totalPrice)}</span>
          </div>
          <Button size="lg" className="w-full" onClick={() => onInspect(refund)}>
            검수하기
          </Button>
        </>
      )}
    </div>
  );
}

function InspectionModal({ refund, onClose, onSubmit, submitting }) {
  const [result, setResult] = useState("APPROVED");
  const [responsibility, setResponsibility] = useState("BUYER");
  const [rejectReason, setRejectReason] = useState("");
  const [memo, setMemo] = useState("");
  const [error, setError] = useState("");

  const totalPrice = useMemo(() => calcTotal(refund?.items), [refund]);

  function handleSubmit() {
    if (result === "REJECTED" && !rejectReason.trim()) {
      setError("거절 사유를 입력해 주세요.");
      return;
    }
    setError("");
    onSubmit({ result, responsibility, rejectReason: rejectReason.trim(), memo: memo.trim(), totalPrice });
  }

  return (
    <Modal open onClose={submitting ? undefined : onClose} title="반품 검수">
      <div className="space-y-5 text-left">
        {/* 상품 요약 */}
        <div className="rounded-xl bg-violet-50/50 p-4 text-sm">
          <p className="text-gray-400">반품 상품</p>
          <div className="mt-1 space-y-1">
            {refund.items?.map((item, idx) => (
              <p key={idx} className="font-semibold text-gray-900">
                {item.productName} × {item.quantity} <span className="text-gray-500">({formatPrice(item.price * item.quantity)})</span>
              </p>
            ))}
          </div>
          {refund.reason && (
            <>
              <p className="mt-3 text-gray-400">반품 사유</p>
              <p className="mt-1 whitespace-pre-line font-semibold text-gray-900">{refund.reason}</p>
            </>
          )}
        </div>

        {/* 검수 결과 */}
        <div>
          <p className="mb-2 text-sm font-bold text-gray-700">검수 결과</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setResult("APPROVED")}
              className={`rounded-xl border px-4 py-3 text-sm font-bold transition ${
                result === "APPROVED"
                  ? "border-violet-300 bg-violet-50 text-violet-700 ring-2 ring-violet-200"
                  : "border-gray-200 bg-white text-gray-600 hover:border-violet-200"
              }`}
            >
              승인 (환불 진행)
            </button>
            <button
              type="button"
              onClick={() => setResult("REJECTED")}
              className={`rounded-xl border px-4 py-3 text-sm font-bold transition ${
                result === "REJECTED"
                  ? "border-rose-300 bg-rose-50 text-rose-700 ring-2 ring-rose-200"
                  : "border-gray-200 bg-white text-gray-600 hover:border-rose-200"
              }`}
            >
              거절
            </button>
          </div>
        </div>

        {/* 승인 시: 귀책 + 메모 */}
        {result === "APPROVED" && (
          <>
            <div>
              <p className="mb-2 text-sm font-bold text-gray-700">귀책</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setResponsibility("BUYER")}
                  className={`rounded-xl border px-4 py-3 text-sm font-bold transition ${
                    responsibility === "BUYER"
                      ? "border-amber-300 bg-amber-50 text-amber-700 ring-2 ring-amber-200"
                      : "border-gray-200 bg-white text-gray-600 hover:border-amber-200"
                  }`}
                >
                  구매자 귀책
                </button>
                <button
                  type="button"
                  onClick={() => setResponsibility("SELLER")}
                  className={`rounded-xl border px-4 py-3 text-sm font-bold transition ${
                    responsibility === "SELLER"
                      ? "border-indigo-300 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-200"
                      : "border-gray-200 bg-white text-gray-600 hover:border-indigo-200"
                  }`}
                >
                  판매자 귀책
                </button>
              </div>
              <p className="mt-3 text-xs leading-5 text-gray-500">
                {responsibility === "BUYER"
                  ? "구매자 귀책: 반품 배송비가 환불 금액에서 차감됩니다."
                  : "판매자 귀책: 전액 환불 + 반품 배송비를 판매자가 부담합니다."}
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-gray-700">검수 메모 (선택)</label>
              <textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                rows={2}
                placeholder="구매자에게 전달할 내용이 있다면 작성해 주세요."
                className="w-full rounded-lg bg-blue-50/70 p-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-violet-200 resize-none"
              />
            </div>
          </>
        )}

        {/* 거절 시: 거절 사유 필수 */}
        {result === "REJECTED" && (
          <div>
            <label className="mb-2 block text-sm font-bold text-gray-700">
              거절 사유 <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => { setRejectReason(e.target.value); setError(""); }}
              rows={3}
              placeholder="예: 사용 흔적이 있음, 구성품 누락, 임의 분해 등"
              className="w-full rounded-lg bg-blue-50/70 p-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-rose-200 resize-none"
            />
            <p className="mt-2 text-xs leading-5 text-gray-500">
              거절 사유는 구매자에게 그대로 전달됩니다.
            </p>
          </div>
        )}

        {/* 환불 요약 */}
        <div className="rounded-xl bg-gray-50 p-4 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">상품 합계</span>
            <span className="font-semibold text-gray-900">{formatPrice(totalPrice)}</span>
          </div>
          {result === "APPROVED" && (
            <div className="mt-2 flex justify-between border-t border-gray-200 pt-2">
              <span className="font-bold text-gray-900">예상 환불 금액</span>
              <span className="font-extrabold text-violet-700">{formatPrice(totalPrice)}</span>
            </div>
          )}
        </div>

        {error && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</p>
        )}

        <div className="flex gap-2 pt-2">
          <Button variant="secondary" size="lg" className="flex-1" onClick={onClose} disabled={submitting}>
            취소
          </Button>
          <Button size="lg" className="flex-1" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "처리 중..." : result === "REJECTED" ? "거절 확정" : "승인 확정"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default function SellerRefundManagementPage() {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("RECEIVED");
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedRefund, setSelectedRefund] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchRefundList = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);
      const data = await getSellerReturnRequestsApi({ status: activeTab });
      setRefunds(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch refunds:", err);
      setError(getErrorMessage(err, "반품 목록을 불러올 수 없습니다."));
      setRefunds([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id, activeTab]);

  useEffect(() => {
    void fetchRefundList();
  }, [fetchRefundList]);

  if (!authLoading && (!user || user.role !== "SELLER")) {
    return <Navigate to="/" />;
  }

  function handleInspect(refund) {
    setSelectedRefund(refund);
  }

  async function handleSubmit({ result, responsibility, rejectReason, totalPrice }) {
    if (!selectedRefund) return;
    if (!selectedRefund.returnRequestId) {
      pushToast({
        title: "반품 요청 정보를 찾을 수 없습니다",
        tone: "error",
        timeoutMs: 4000,
      });
      return;
    }
    try {
      setSubmitting(true);
      const isPass = result === "APPROVED";
      const payload = {
        inspectionResult: isPass ? "PASS" : "FAIL",
        responsibilityType: isPass ? responsibility : null,
        rejectReason: isPass ? null : rejectReason,
      };

      await inspectReturnRequestApi(selectedRefund.returnRequestId, payload);

      pushToast({
        title: isPass ? "환불 승인이 완료되었습니다" : "반품이 거절되었습니다",
        message: isPass ? `환불 예정 금액 ${formatPrice(totalPrice)}` : "구매자에게 거절 사유가 전달됩니다.",
        tone: isPass ? "success" : "info",
        timeoutMs: 4000,
      });

      setSelectedRefund(null);
      await fetchRefundList();
    } catch (err) {
      console.error("Failed to submit refund inspection:", err);
      pushToast({
        title: "처리에 실패했습니다",
        message: getErrorMessage(err, "잠시 후 다시 시도해 주세요."),
        tone: "error",
        timeoutMs: 4000,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <SellerNav currentPage="refunds" />
      <PageContainer>
        <div className="mx-auto max-w-3xl text-left">
          <PageHeader
            title="환불 관리"
            action={
              <span className="text-sm font-medium text-gray-500">
                총 {refunds.length}건
              </span>
            }
          />

          {/* 탭 */}
          <div className="mb-5 flex rounded-xl bg-gray-100 p-1">
            {TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setActiveTab(tab.value)}
                className={`flex-1 rounded-lg py-2 text-sm font-bold transition ${
                  activeTab === tab.value
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-6 rounded-xl bg-red-50 p-4 ring-1 ring-red-100">
              <p className="font-semibold text-red-700">오류</p>
              <p className="mt-1 text-sm text-red-600">{error}</p>
              <button
                type="button"
                onClick={fetchRefundList}
                className="mt-3 text-sm font-bold text-red-700 hover:text-red-900 underline"
              >
                다시 시도
              </button>
            </div>
          )}

          {loading ? (
            <div className="space-y-4">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-64 animate-pulse rounded-[20px] bg-gray-100" />
              ))}
            </div>
          ) : refunds.length === 0 ? (
            <div className="rounded-[20px] bg-white px-6 py-16 text-center shadow-sm ring-1 ring-gray-200">
              <p className="text-lg font-bold text-gray-900">
                {activeTab === "RECEIVED" && "처리할 반품이 없습니다"}
                {activeTab === "COMPLETED" && "완료된 반품이 없습니다"}
                {activeTab === "FAILED" && "거절한 반품이 없습니다"}
              </p>
              <p className="mt-2 text-sm text-gray-500">
                {activeTab === "RECEIVED" && "고객이 반품을 신청하면 이곳에 표시됩니다."}
                {activeTab === "COMPLETED" && "검수 완료된 반품이 이곳에 기록됩니다."}
                {activeTab === "FAILED" && "거절한 반품 내역이 이곳에 기록됩니다."}
              </p>
            </div>
          ) : (
            <section className="space-y-4">
              {refunds.map((refund) => (
                <RefundCard
                  key={refund.returnRequestId || refund.orderId}
                  refund={refund}
                  onInspect={handleInspect}
                />
              ))}
            </section>
          )}
        </div>
      </PageContainer>

      {selectedRefund && (
        <InspectionModal
          refund={selectedRefund}
          onClose={() => setSelectedRefund(null)}
          onSubmit={handleSubmit}
          submitting={submitting}
        />
      )}
    </>
  );
}
