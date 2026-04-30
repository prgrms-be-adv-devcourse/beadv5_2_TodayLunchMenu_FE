import { useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Button from "../../components/common/Button";
import PageContainer from "../../components/common/PageContainer";

function formatPrice(value) {
  return `${new Intl.NumberFormat("ko-KR").format(value)}원`;
}

function buildFailureModel(orderId, state) {
  const source = state ?? {};
  const isCardPayment =
    source.paymentMethodCode === "CARD" ||
    source.selectedPaymentMethod === "CARD" ||
    source.paymentMethod === "카드 결제";

  return {
    orderId: source.orderId || orderId || null,
    orderNumber: source.orderNumber ?? null,
    totalPrice: source.totalPrice ?? 0,
    paymentMethod: source.paymentMethod || source.depositLabel || "예치금 결제",
    errorCode: source.errorCode || "PAYMENT_FAILED",
    errorTitle: source.errorTitle || "결제 실패",
    errorMessage: source.errorMessage || "결제 처리 중 오류가 발생했습니다.",
    isCardPayment,
    isInsufficientBalance: source.errorCode === "INSUFFICIENT_BALANCE",
    items: Array.isArray(source.items) ? source.items : [],
    shipping: source.shipping ?? null,
    selectedPaymentMethod: source.selectedPaymentMethod ?? null,
    paymentMethodCode: source.paymentMethodCode ?? null,
    paymentMethod_: source.paymentMethod ?? null,
    depositLabel: source.depositLabel ?? null,
    itemPrice: source.itemPrice ?? null,
    shippingFee: source.shippingFee ?? null,
    totalPrice_: source.totalPrice ?? null,
    memo: source.memo ?? null,
  };
}

export default function PaymentFailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { orderId } = useParams();

  const payment = useMemo(
    () => buildFailureModel(orderId, location.state),
    [location.state, orderId]
  );

  const retryState = {
    items: payment.items,
    shipping: payment.shipping,
    selectedPaymentMethod: payment.selectedPaymentMethod,
    paymentMethodCode: payment.paymentMethodCode,
    paymentMethod: payment.paymentMethod_,
    depositLabel: payment.depositLabel,
    itemPrice: payment.itemPrice,
    shippingFee: payment.shippingFee,
    totalPrice: payment.totalPrice_,
    memo: payment.memo,
  };

  return (
    <PageContainer>
      <div className="mx-auto max-w-2xl pb-16 pt-8 text-left">

        {/* 실패 아이콘 */}
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

          {/* 오류 내용 */}
          <div>
            <h2 className="text-lg font-extrabold text-gray-900" style={{ marginBottom: "0.875rem" }}>실패 사유</h2>
            <div className="rounded-[20px] bg-white p-6 shadow-sm ring-1 ring-rose-100 space-y-3 text-sm">
              <p className="font-bold text-gray-900">{payment.errorTitle}</p>
              <p className="whitespace-pre-line leading-6 text-gray-500">{payment.errorMessage}</p>
              {payment.totalPrice > 0 && (
                <div className="mt-2 space-y-3 border-t border-gray-100 pt-4">
                  <div className="flex justify-between">
                    <span className="text-gray-400">결제 수단</span>
                    <span className="font-semibold text-gray-900">{payment.paymentMethod}</span>
                  </div>
                  {payment.itemPrice > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">상품 금액</span>
                      <span className="font-semibold text-gray-900">{formatPrice(payment.itemPrice)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="font-bold text-gray-900">총 결제 금액</span>
                    <span className="font-extrabold text-rose-600">{formatPrice(payment.totalPrice)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 버튼 */}
          <div className="space-y-3">
            {payment.isCardPayment ? (
              <Button
                size="lg"
                className="w-full"
                onClick={() => navigate("/payments", { state: retryState })}
              >
                다시 시도하기
              </Button>
            ) : (
              <Button
                size="lg"
                className="w-full"
                onClick={() => navigate("/deposits")}
              >
                예치금 충전하기
              </Button>
            )}
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
