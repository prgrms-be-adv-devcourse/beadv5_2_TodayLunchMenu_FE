import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ApiError } from "../../api/client";
import Button from "../../components/common/Button";
import PageContainer from "../../components/common/PageContainer";
import { createOrderApi } from "../../features/order/orderApi";

const MOCK_PAYMENT_ORDER = {
  orderId: "COL-2024-001",
  items: [
    {
      productId: "sample-product-1",
      name: "네온 컬렉터 재킷",
      subtitle: "리미티드 에디션 아티팩트",
      quantity: 1,
      price: 1200000,
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuB-5gINY10iCNMHH6S8FisFTNWXT0F9Cj0xanOaWrsjraikEY-nw3o0dWKRbpZn0d3q1R1gNm89kG5XvtjGC3ow3TxZrexE-_LBp9DDBeQMn8Y1QuU2UEi_UdeUuWhy8mqEuXe_CyZuJ8fN6sN7Vc1sdAurTUW7QVbDEboi8whISZNsK-AtwUEpWs4CnsjEXgqS0VR0eVw4oJCh7zY7iMrJwIdmE7H5E6G0GbVPIhy3TPaZw8UTkifL1Wq6H_nUidvF--5UgSLoUQlV",
    },
  ],
  shipping: {
    receiver: "홍길동",
    receiverPhone: "010-1234-5678",
    address: "서울특별시 강남구 테헤란로 123",
    addressDetail: "101동 1001호",
    zipCode: "06014",
  },
  paymentMethod: "예치금 결제",
  depositLabel: "Deposit / Vivid Pay",
  depositBalance: 2000000,
  itemPrice: 1200000,
  shippingFee: 40000,
};

function formatPrice(value) {
  return `${new Intl.NumberFormat("ko-KR").format(value)}원`;
}

function buildPaymentModel(state) {
  const source = state?.order ?? state ?? MOCK_PAYMENT_ORDER;
  const items =
    Array.isArray(source.items) && source.items.length > 0
      ? source.items
      : MOCK_PAYMENT_ORDER.items;
  const itemPrice =
    source.itemPrice ??
    items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 0), 0);
  const shippingFee = source.shippingFee ?? (itemPrice >= 30000 || itemPrice === 0 ? 0 : 3000);
  const totalPrice = source.totalPrice ?? itemPrice + shippingFee;
  const depositBalance = source.depositBalance ?? MOCK_PAYMENT_ORDER.depositBalance;

  return {
    orderId: source.orderId || null,
    items,
    shipping: {
      ...MOCK_PAYMENT_ORDER.shipping,
      ...(source.shipping || {}),
    },
    paymentMethod: source.paymentMethod || MOCK_PAYMENT_ORDER.paymentMethod,
    depositLabel: source.depositLabel || MOCK_PAYMENT_ORDER.depositLabel,
    depositBalance,
    itemPrice,
    shippingFee,
    totalPrice,
    hasEnoughBalance: depositBalance >= totalPrice,
    expectedBalance: depositBalance - totalPrice,
  };
}

export default function PaymentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const payment = useMemo(() => buildPaymentModel(location.state), [location.state]);

  const primaryItem = payment.items[0];
  const shortageAmount = Math.max(payment.totalPrice - payment.depositBalance, 0);

  const handleCreateOrder = async () => {
    try {
      setIsSubmitting(true);
      setSubmitError("");

      const createdOrder = await createOrderApi({
        address: payment.shipping.address,
        addressDetail: payment.shipping.addressDetail,
        zipCode: payment.shipping.zipCode,
        receiver: payment.shipping.receiver,
        receiverPhone: payment.shipping.receiverPhone,
        items: payment.items,
      });

      navigate(`/payments/${createdOrder.orderId}/success`, {
        state: {
          ...payment,
          orderId: createdOrder.orderId,
          totalPrice: createdOrder.totalPrice || payment.totalPrice,
          status: createdOrder.status,
          paidAt: createdOrder.createdAt,
        },
      });
    } catch (error) {
      const errorMessage =
        error instanceof ApiError
          ? error.message
          : "주문 요청 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";

      navigate(`/payments/${payment.orderId || "pending"}/fail`, {
        state: {
          ...payment,
          errorCode: error instanceof ApiError ? error.code : "ORDER_REQUEST_FAILED",
          errorTitle: "주문/결제 요청 실패",
          errorMessage,
        },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <PageContainer>
        <section className="mb-6 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-violet-700 shadow-sm ring-1 ring-purple-100 transition hover:bg-purple-50"
          >
            <span aria-hidden="true">←</span>
            주문서로 돌아가기
          </button>
          <button
            type="button"
            onClick={() => navigate("/orders")}
            className="text-sm font-bold text-violet-500 transition hover:text-violet-700"
          >
            주문내역 보기
          </button>
        </section>

        {submitError ? (
          <section className="mb-6 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
            {submitError}
          </section>
        ) : null}

        <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-[28px] bg-white p-6 shadow-[0_40px_80px_-30px_rgba(56,39,76,0.18)] ring-1 ring-purple-100 md:col-span-2">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-violet-500">
                Order Reference
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-gray-900">
                #{payment.orderId || "주문 생성 전"}
              </h1>
            </div>

            <div className="mt-8 flex items-center gap-4 rounded-2xl bg-purple-50/80 p-4">
              <div className="h-20 w-20 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-purple-100">
                <img
                  src={primaryItem.image}
                  alt={primaryItem.name}
                  className="h-full w-full object-cover"
                />
              </div>
              <div>
                <p className="text-lg font-extrabold text-gray-900">{primaryItem.name}</p>
                <p className="mt-1 text-sm text-gray-500">
                  {primaryItem.subtitle || `${primaryItem.quantity}개 주문`}
                </p>
                <p className="mt-2 text-sm font-semibold text-violet-700">
                  총 {payment.items.length}개 상품
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] bg-gradient-to-br from-violet-700 to-fuchsia-600 p-6 text-white shadow-[0_40px_80px_-30px_rgba(93,63,211,0.45)]">
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-violet-100">
              Total Amount
            </p>
            <p className="mt-3 text-4xl font-black tracking-tight">{formatPrice(payment.totalPrice)}</p>
            <div className="mt-5 inline-flex rounded-full bg-white/20 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em]">
              {payment.paymentMethod}
            </div>
          </div>
        </section>

        <section className="mb-6 rounded-[28px] bg-purple-50/85 p-6 ring-1 ring-purple-100">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-extrabold tracking-tight text-gray-900">배송 요약</h2>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-gray-500">수령인</p>
              <p className="mt-2 text-base font-bold text-gray-900">{payment.shipping.receiver}</p>
              <p className="mt-1 text-sm text-gray-500">{payment.shipping.receiverPhone}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-gray-500">배송지</p>
              <p className="mt-2 text-sm leading-6 text-gray-700">
                {payment.shipping.address}
                <br />
                {payment.shipping.addressDetail}
                <br />
                {payment.shipping.zipCode}
              </p>
            </div>
          </div>
        </section>

        <section className="mb-6 rounded-[28px] border border-purple-100 bg-white p-6 shadow-[0_30px_60px_-40px_rgba(56,39,76,0.2)]">
          <h2 className="text-xl font-extrabold tracking-tight text-gray-900">결제 수단</h2>

          <div className="mt-5 flex items-center rounded-[24px] border border-violet-200 bg-violet-50/70 p-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-700 text-2xl text-white shadow-lg shadow-violet-500/25">
              원
            </div>
            <div className="ml-4 flex-1">
              <p className="text-lg font-extrabold text-gray-900">{payment.depositLabel}</p>
              <p className="mt-1 text-sm text-gray-500">예치금으로 빠르고 안전하게 결제합니다.</p>
            </div>
            <div className="text-sm font-black text-violet-700">선택됨</div>
          </div>
        </section>

        <section className="mb-6 rounded-[28px] bg-white p-6 ring-1 ring-purple-100">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-extrabold tracking-tight text-gray-900">예치금 확인</h2>
            <span
              className={[
                "inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em]",
                payment.hasEnoughBalance
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-red-50 text-red-500",
              ].join(" ")}
            >
              {payment.hasEnoughBalance ? "결제 가능" : "잔액 부족"}
            </span>
          </div>

          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>현재 예치금</span>
              <span className="text-base font-extrabold text-gray-900">
                {formatPrice(payment.depositBalance)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm text-red-500">
              <span>결제 예정 금액</span>
              <span className="text-base font-extrabold">-{formatPrice(payment.totalPrice)}</span>
            </div>
            <div className="h-px bg-purple-100" />
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700">결제 후 예상 잔액</span>
              <span className="text-xl font-black tracking-tight text-violet-700">
                {formatPrice(Math.max(payment.expectedBalance, 0))}
              </span>
            </div>

            {!payment.hasEnoughBalance ? (
              <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-500">
                예치금이 {formatPrice(shortageAmount)} 부족합니다. 충전 후 다시 시도해 주세요.
              </div>
            ) : null}
          </div>
        </section>

        <section className="mb-32 space-y-3 px-2">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>상품 금액</span>
            <span className="font-semibold text-gray-900">{formatPrice(payment.itemPrice)}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>배송비</span>
            <span className="font-semibold text-gray-900">{formatPrice(payment.shippingFee)}</span>
          </div>
          <div className="flex items-end justify-between border-t border-purple-100 pt-4">
            <span className="text-lg font-extrabold text-gray-900">총 결제 금액</span>
            <span className="text-3xl font-black tracking-tight text-violet-700">
              {formatPrice(payment.totalPrice)}
            </span>
          </div>
        </section>
      </PageContainer>

      <footer className="fixed bottom-0 left-0 z-40 w-full bg-white/85 backdrop-blur-xl">
        <div className="mx-auto max-w-3xl space-y-3 px-4 pb-8 pt-4 sm:px-6 lg:px-8">
          <Button
            size="lg"
            className="h-16 w-full rounded-full text-lg font-extrabold shadow-lg shadow-violet-500/20"
            disabled={!payment.hasEnoughBalance || isSubmitting}
            onClick={handleCreateOrder}
          >
            {isSubmitting
              ? "주문/결제 요청 중..."
              : payment.hasEnoughBalance
                ? `${formatPrice(payment.totalPrice)} 결제하기`
                : "예치금이 부족합니다"}
          </Button>
          {!payment.hasEnoughBalance ? (
            <Button
              variant="secondary"
              size="lg"
              className="h-14 w-full rounded-full text-base font-extrabold"
              onClick={() =>
                navigate(`/payments/${payment.orderId || "pending"}/fail`, {
                  state: {
                    ...payment,
                    errorCode: "INSUFFICIENT_BALANCE",
                    errorTitle: "잔액 부족",
                    errorMessage: `현재 예치금이 ${formatPrice(shortageAmount)} 부족합니다. 충전 후 다시 시도해 주세요.`,
                  },
                })
              }
            >
              실패 화면 보기
            </Button>
          ) : null}
          <p className="text-center text-[11px] font-bold uppercase tracking-[0.22em] text-gray-400">
            Secure Deposit Transaction
          </p>
        </div>
      </footer>
    </>
  );
}
