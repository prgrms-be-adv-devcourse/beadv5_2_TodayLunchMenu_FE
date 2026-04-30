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
    orderNumber: pendingPayment?.orderNumber || null,
    amount: state?.amount ?? pendingPayment?.amount ?? parseAmount(searchParams.get("amount")),
    items: pendingPayment?.items || [],
    shipping: pendingPayment?.shipping || null,
    selectedPaymentMethod: pendingPayment?.selectedPaymentMethod || "CARD",
    paymentMethodCode: "CARD",
    paymentMethod: "카드 결제",
  };
}

function clearPendingCardPayment(result) {
  const candidateIds = [result.pgOrderId, result.orderId].filter(Boolean);
  [...new Set(candidateIds)].forEach((id) => clearPendingOrderPayment(id));
}

export default function PaymentCardFailPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const result = useMemo(
    () => buildFailureModel(location.search, location.state),
    [location.search, location.state]
  );

  useEffect(() => {
    clearPendingCardPayment(result);
  }, [result]);

  const retryState = {
    orderId: result.orderId,
    orderNumber: result.orderNumber,
    items: result.items,
    shipping: result.shipping,
    selectedPaymentMethod: result.selectedPaymentMethod,
    paymentMethodCode: result.paymentMethodCode,
    paymentMethod: result.paymentMethod,
    totalPrice: result.amount,
  };

  return (
    <PageContainer>
      <div className="mx-auto max-w-2xl pb-16 pt-8 text-left">

        <div className="mb-10 flex flex-col items-center text-center">
          <div className="relative mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-rose-100">
            <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-rose-500 text-4xl text-white shadow-[0_10px_30px_-5px_rgba(244,63,94,0.4)]">
              !
            </div>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-gray-900">결제에 실패했습니다</h1>
          <p className="mt-2 text-sm text-gray-500">아래 내용을 확인하고 다시 시도해 주세요</p>
        </div>

        <div className="space-y-7">
          <div>
            <h2 className="text-lg font-extrabold text-gray-900" style={{ marginBottom: "0.875rem" }}>실패 사유</h2>
            <div className="rounded-[20px] bg-white p-6 shadow-sm ring-1 ring-rose-100 space-y-3 text-sm">
              <p className="font-bold text-gray-900">{result.errorTitle}</p>
              <p className="whitespace-pre-line leading-6 text-gray-500">{result.errorMessage}</p>
              {result.amount > 0 && (
                <div className="mt-2 space-y-3 border-t border-gray-100 pt-4">
                  <div className="flex justify-between">
                    <span className="text-gray-400">결제 수단</span>
                    <span className="font-semibold text-gray-900">{result.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold text-gray-900">총 결제 금액</span>
                    <span className="font-extrabold text-rose-600">{formatPrice(result.amount)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <Button
              size="lg"
              className="w-full"
              onClick={() => navigate("/payments", { state: retryState })}
            >
              다시 시도하기
            </Button>
            <Button
              variant="secondary"
              size="lg"
              className="w-full"
              onClick={() => navigate("/cart")}
            >
              장바구니 보기
            </Button>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
