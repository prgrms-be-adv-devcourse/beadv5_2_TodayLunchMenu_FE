import { useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Button from "../../components/common/Button";
import PageContainer from "../../components/common/PageContainer";
import { clearPendingOrderPayment, getPendingOrderPayment } from "../../features/payment/paymentApi";

function formatPrice(value) {
  return `${new Intl.NumberFormat("ko-KR").format(value)}원`;
}

function parseAmount(value) {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : 0;
}

function buildFailureModel(search, state) {
  const searchParams = new URLSearchParams(search);
  const pgOrderId = state?.pgOrderId || searchParams.get("orderId");
  const pendingPayment = pgOrderId ? getPendingOrderPayment(pgOrderId) : null;

  return {
    errorTitle: state?.errorTitle || "카드 결제 실패",
    errorMessage:
      state?.errorMessage ||
      searchParams.get("message") ||
      "카드 결제가 취소되었거나 승인에 실패했습니다.",
    errorCode: state?.errorCode || searchParams.get("code") || "CARD_PAYMENT_FAILED",
    pgOrderId,
    orderId: state?.orderId || pendingPayment?.orderId || null,
    amount: state?.amount ?? pendingPayment?.amount ?? parseAmount(searchParams.get("amount")),
    items: pendingPayment?.items || [],
    shipping: pendingPayment?.shipping || null,
    selectedPaymentMethod: pendingPayment?.selectedPaymentMethod || "CARD",
  };
}

function clearPendingCardPayment(result) {
  const candidateIds = [result.pgOrderId, result.orderId].filter(Boolean);
  const uniqueIds = [...new Set(candidateIds)];

  uniqueIds.forEach((id) => {
    clearPendingOrderPayment(id);
  });
}

export default function PaymentCardFailPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const result = useMemo(
    () => buildFailureModel(location.search, location.state),
    [location.search, location.state]
  );
  const displayOrderId = result.orderId || result.pgOrderId || "-";

  useEffect(() => {
    clearPendingCardPayment(result);
  }, [result]);

  return (
    <PageContainer>
      <section className="mx-auto flex min-h-[calc(100vh-9rem)] max-w-lg flex-col justify-center px-4 py-10">
        <div className="bg-white p-8 shadow-[0_40px_40px_-10px_rgba(56,39,76,0.06)] ring-1 ring-gray-200">
          <div className="mb-6 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-rose-100 text-4xl text-rose-600">
              !
            </div>
            <h1 className="mt-5 text-3xl font-black tracking-tight text-gray-900">
              카드 결제 실패
            </h1>
            <p className="mt-2 text-sm leading-6 text-gray-500">
              카드 결제가 취소되었거나 승인에 실패했습니다. 아래 정보를 확인한 뒤 다시 시도해 주세요.
            </p>
          </div>

          <div className="space-y-3 bg-blue-50/70 p-4 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="text-gray-500">실패 사유</span>
              <span className="font-semibold text-gray-900">{result.errorTitle}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-gray-500">에러 코드</span>
              <span className="font-mono font-semibold text-gray-900">{result.errorCode}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-gray-500">orderId</span>
              <span className="font-mono font-semibold text-gray-900">{displayOrderId}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-gray-500">결제 금액</span>
              <span className="font-semibold text-gray-900">{formatPrice(result.amount)}</span>
            </div>
          </div>

          <p className="mt-4 text-sm leading-6 text-gray-500">{result.errorMessage}</p>

          <div className="mt-6 space-y-3">
            <Button
              size="lg"
              className="w-full"
              onClick={() =>
                navigate("/payments", {
                  state: {
                    items: result.items,
                    shipping: result.shipping,
                    selectedPaymentMethod: result.selectedPaymentMethod,
                    paymentMethod: "카드 결제",
                  },
                })
              }
            >
              카드 결제 다시 시도
            </Button>
            <Button
              variant="secondary"
              size="lg"
              className="w-full"
              onClick={() => navigate("/orders/checkout")}
            >
              주문서로 돌아가기
            </Button>
          </div>
        </div>
      </section>
    </PageContainer>
  );
}
