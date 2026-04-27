import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ApiError } from "../../api/client";
import Button from "../../components/common/Button";
import PageContainer from "../../components/common/PageContainer";
import {
  createOrderForCardPaymentApi,
  getWalletSummaryApi,
  loadTossPaymentsSdk,
  savePendingOrderPayment,
} from "../../features/payment/paymentApi";
import { createOrderApi } from "../../features/order/orderApi";

const TOSS_CLIENT_KEY = import.meta.env.VITE_TOSS_CLIENT_KEY;

function formatPrice(value) {
  return `${new Intl.NumberFormat("ko-KR").format(value)}원`;
}

function buildCardOrderName(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return "주문 결제";
  }

  const firstItem = items[0];
  if (items.length === 1) {
    return firstItem.name || "주문 결제";
  }

  return `${firstItem.name || "상품"} 외 ${items.length - 1}건`;
}

function buildPaymentModel(state) {
  const source = state?.order ?? state ?? null;
  const items = Array.isArray(source?.items) ? source.items : [];
  const itemPrice =
    source?.itemPrice ??
    items.reduce(
      (sum, item) => sum + (item.price || 0) * (item.quantity || 0),
      0
    );
  const shippingFee =
    source?.shippingFee ?? (itemPrice >= 30000 || itemPrice === 0 ? 0 : 3000);
  const totalPrice = source?.totalPrice ?? itemPrice + shippingFee;

  return {
    orderId: source?.orderId ?? null,
    createdAt: source?.createdAt ?? null,
    items,
    shipping: source?.shipping ?? null,
    paymentMethod: source?.paymentMethod ?? "결제",
    paymentMethodCode: source?.paymentMethodCode ?? null,
    selectedPaymentMethod: source?.selectedPaymentMethod ?? null,
    depositLabel: source?.depositLabel ?? "예치금 결제",
    itemPrice,
    shippingFee,
    totalPrice,
  };
}

function isUuid(value) {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value
    )
  );
}

export default function PaymentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPreparingCardOrder, setIsPreparingCardOrder] = useState(false);
  const [preparedCardOrder, setPreparedCardOrder] = useState(null);
  const [submitError, setSubmitError] = useState("");
  const [walletBalance, setWalletBalance] = useState(null);
  const [walletLoading, setWalletLoading] = useState(true);
  const [walletError, setWalletError] = useState("");

  const payment = useMemo(() => buildPaymentModel(location.state), [location.state]);
  const hasPaymentItems = payment.items.length > 0;
  const isCardPayment =
    payment.selectedPaymentMethod === "CARD" ||
    payment.paymentMethodCode === "CARD" ||
    payment.paymentMethod === "카드 결제" ||
    payment.paymentMethod === "카드결제";
  const paymentMethodLabel = isCardPayment
    ? "카드 결제"
    : payment.depositLabel || "예치금 결제";

  const primaryItem = payment.items[0] ?? null;
  const effectiveDepositBalance =
    typeof walletBalance === "number" ? walletBalance : null;
  const hasEnoughDeposit =
    typeof effectiveDepositBalance === "number" &&
    effectiveDepositBalance >= payment.totalPrice;
  const shortageAmount =
    typeof effectiveDepositBalance === "number"
      ? Math.max(payment.totalPrice - effectiveDepositBalance, 0)
      : 0;

  useEffect(() => {
    let cancelled = false;

    async function loadWalletSummary() {
      if (isCardPayment) {
        setWalletLoading(false);
        return;
      }

      try {
        setWalletLoading(true);
        setWalletError("");
        const walletSummary = await getWalletSummaryApi();
        if (!cancelled) {
          setWalletBalance(walletSummary.balance ?? 0);
        }
      } catch (error) {
        if (!cancelled) {
          setWalletBalance(null);
          setWalletError(
            error?.message || "예치금 정보를 불러오지 못했습니다."
          );
        }
      } finally {
        if (!cancelled) {
          setWalletLoading(false);
        }
      }
    }

    loadWalletSummary();

    return () => {
      cancelled = true;
    };
  }, [isCardPayment]);

  useEffect(() => {
    let cancelled = false;

    async function prepareCardOrder() {
      if (!isCardPayment) {
        setPreparedCardOrder(null);
        setIsPreparingCardOrder(false);
        return;
      }

      setSubmitError("");
      setPreparedCardOrder(null);
      setIsPreparingCardOrder(true);

      if (isUuid(payment.orderId)) {
        if (!cancelled) {
          setPreparedCardOrder({
            orderId: payment.orderId,
            totalPrice: payment.totalPrice,
            createdAt: payment.createdAt || new Date().toISOString(),
          });
          setIsPreparingCardOrder(false);
        }
        return;
      }

      try {
        const createdOrder = await createOrderForCardPaymentApi({
          address: payment.shipping?.address,
          addressDetail: payment.shipping?.addressDetail,
          zipCode: payment.shipping?.zipCode,
          receiver: payment.shipping?.receiver,
          receiverPhone: payment.shipping?.receiverPhone,
          items: payment.items,
        });

        if (!cancelled) {
          setPreparedCardOrder(createdOrder);
        }
      } catch (error) {
        if (!cancelled) {
          setSubmitError(
            error instanceof ApiError
              ? error.message
              : "카드 결제 주문 정보를 미리 준비하는 중 오류가 발생했습니다."
          );
        }
      } finally {
        if (!cancelled) {
          setIsPreparingCardOrder(false);
        }
      }
    }

    prepareCardOrder();

    return () => {
      cancelled = true;
    };
  }, [
    isCardPayment,
    payment.orderId,
    payment.totalPrice,
    payment.createdAt,
    payment.items,
    payment.shipping,
  ]);

  const handleCreateOrder = async () => {
    try {
      setIsSubmitting(true);
      setSubmitError("");

      if (!hasPaymentItems) {
        setSubmitError(
          "주문 데이터가 없습니다. 장바구니에서 다시 시작해 주세요."
        );
        return;
      }

      if (isCardPayment && !TOSS_CLIENT_KEY) {
        setSubmitError("VITE_TOSS_CLIENT_KEY가 설정되지 않았습니다.");
        return;
      }

      if (isCardPayment) {
        const createdOrder = preparedCardOrder;
        if (!createdOrder) {
          setSubmitError(
            "카드 결제 주문 정보를 아직 준비하지 못했습니다. 잠시 후 다시 시도해 주세요."
          );
          return;
        }

        const orderId = String(createdOrder.orderId);
        if (!orderId || orderId === "null" || orderId.startsWith("pending-")) {
          setSubmitError(
            "실제 주문 UUID를 생성하지 못했습니다. 잠시 후 다시 시도해 주세요."
          );
          return;
        }

        const amount = createdOrder.totalPrice || payment.totalPrice;
        const orderName = buildCardOrderName(payment.items);

        savePendingOrderPayment({
          orderId,
          pgOrderId: orderId,
          amount,
          orderName,
          paymentMethod: "CARD",
          createdAt: createdOrder.createdAt || new Date().toISOString(),
          items: payment.items,
          shipping: payment.shipping,
          selectedPaymentMethod: payment.selectedPaymentMethod,
        });

        const TossPayments = await loadTossPaymentsSdk();
        const tossPayments = TossPayments(TOSS_CLIENT_KEY);
        const tossPayment = tossPayments.payment({
          customerKey: `order-${orderId}`,
        });

        await tossPayment.requestPayment({
          method: "CARD",
          amount: {
            currency: "KRW",
            value: amount,
          },
          orderId,
          orderName,
          successUrl: `${window.location.origin}/payments/card/success`,
          failUrl: `${window.location.origin}/payments/card/fail`,
          customerName: payment.shipping?.receiver || "주문자",
        });

        return;
      }

      const createdOrder = await createOrderApi({
        address: payment.shipping?.address,
        addressDetail: payment.shipping?.addressDetail,
        zipCode: payment.shipping?.zipCode,
        receiver: payment.shipping?.receiver,
        receiverPhone: payment.shipping?.receiverPhone,
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
          : isCardPayment
            ? "주문 생성 또는 카드 결제창 호출 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요."
            : "주문 요청 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";

      navigate(`/payments/${payment.orderId || "pending"}/fail`, {
        state: {
          ...payment,
          errorCode:
            error instanceof ApiError ? error.code : "ORDER_REQUEST_FAILED",
          errorTitle: isCardPayment ? "카드 결제 시작 실패" : "주문/결제 요청 실패",
          errorMessage,
        },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!hasPaymentItems) {
    return (
      <PageContainer>
        <section className="bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
          결제할 주문 정보가 없습니다. 장바구니에서 다시 시작해 주세요.
        </section>
      </PageContainer>
    );
  }

  return (
    <>
      <PageContainer>
        {submitError ? (
          <section className="mb-6 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
            {submitError}
          </section>
        ) : null}

        <section className="mb-6 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-blue-700 shadow-sm ring-1 ring-gray-200 transition hover:bg-blue-50"
          >
            <span aria-hidden="true">←</span>
            주문서로 돌아가기
          </button>
          <button
            type="button"
            onClick={() => navigate("/orders")}
            className="text-sm font-bold text-blue-500 transition hover:text-blue-700"
          >
            주문내역 보기
          </button>
        </section>

        <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="bg-white p-6 shadow-[0_40px_80px_-30px_rgba(56,39,76,0.18)] ring-1 ring-gray-200 md:col-span-2">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-blue-500">
                Order Reference
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-gray-900">
                #{payment.orderId || "주문 생성 전"}
              </h1>
            </div>

            <div className="mt-8 flex items-center gap-4 bg-blue-50/80 p-4">
              <div className="h-20 w-20 overflow-hidden bg-white shadow-sm ring-1 ring-gray-200">
                {primaryItem?.image ? (
                  <img
                    src={primaryItem.image}
                    alt={primaryItem.name || "상품"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs font-bold text-gray-400">
                    이미지 없음
                  </div>
                )}
              </div>
              <div>
                <p className="text-lg font-extrabold text-gray-900">
                  {primaryItem?.name || "상품 정보 없음"}
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  {primaryItem?.subtitle || `${primaryItem?.quantity || 0}개 주문`}
                </p>
                <p className="mt-2 text-sm font-semibold text-blue-700">
                  총 {payment.items.length}개 상품
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-700 p-6 text-white">
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-blue-100">
              Total Amount
            </p>
            <p className="mt-3 text-4xl font-black tracking-tight">
              {formatPrice(payment.totalPrice)}
            </p>
            <div className="mt-5 inline-flex rounded-full bg-white/20 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em]">
              {paymentMethodLabel}
            </div>
          </div>
        </section>

        <section className="mb-6 bg-blue-50/85 p-6 ring-1 ring-gray-200">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-extrabold tracking-tight text-gray-900">
              배송 요약
            </h2>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-gray-500">
                수령인
              </p>
              <p className="mt-2 text-base font-bold text-gray-900">
                {payment.shipping?.receiver || "-"}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                {payment.shipping?.receiverPhone || "-"}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-gray-500">
                배송지
              </p>
              <p className="mt-2 text-sm leading-6 text-gray-700">
                {payment.shipping?.address || "-"}
                <br />
                {payment.shipping?.addressDetail || "-"}
                <br />
                {payment.shipping?.zipCode || "-"}
              </p>
            </div>
          </div>
        </section>

        <section className="mb-6 border border-gray-200 bg-white p-6 shadow-[0_30px_60px_-40px_rgba(56,39,76,0.2)]">
          <h2 className="text-xl font-extrabold tracking-tight text-gray-900">
            결제 수단
          </h2>

          <div
            className={[
              "mt-5 flex items-center border p-4",
              isCardPayment
                ? "border-amber-200 bg-amber-50/80"
                : "border-blue-200 bg-blue-50/70",
            ].join(" ")}
          >
            <div
              className={[
                "flex h-14 w-14 items-center justify-center text-2xl text-white shadow-lg",
                isCardPayment
                  ? "bg-amber-500"
                  : "bg-blue-700",
              ].join(" ")}
            >
              {isCardPayment ? "카" : "원"}
            </div>
            <div className="ml-4 flex-1">
              <p className="text-lg font-extrabold text-gray-900">
                {isCardPayment ? "카드 결제" : payment.depositLabel || "예치금 결제"}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                {isCardPayment
                  ? "결제 버튼을 누르면 주문을 먼저 생성한 뒤 토스 결제창이 열립니다."
                  : "예치금으로 부족 없이 결제를 진행합니다."}
              </p>
            </div>
            <div
              className={[
                "text-sm font-black",
                isCardPayment ? "text-amber-700" : "text-blue-700",
              ].join(" ")}
            >
              {isCardPayment ? "선택됨" : "확인됨"}
            </div>
          </div>

          {isCardPayment ? (
            <div className="mt-4 space-y-3">
              <div className="bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
                카드 결제는 주문 생성 후 토스 결제창으로 이동합니다.
              </div>
              <div className="border border-amber-200 bg-white px-4 py-4 text-sm text-gray-600">
                승인 완료 후에는 성공 URL에서 결제 확정 API를 호출하고 최종
                상태를 반영합니다.
              </div>
            </div>
          ) : null}
        </section>

        <section className="mb-6 bg-white p-6 ring-1 ring-gray-200">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-extrabold tracking-tight text-gray-900">
              {isCardPayment ? "카드 결제 준비" : "예치금 확인"}
            </h2>
            {!isCardPayment ? (
              <span
                className={[
                  "inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em]",
                  hasEnoughDeposit
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-red-50 text-red-500",
                ].join(" ")}
              >
                {hasEnoughDeposit ? "결제 가능" : "잔액 부족"}
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-amber-700">
                연동 대기
              </span>
            )}
          </div>

          {isCardPayment ? (
            <div className="mt-6 space-y-4">
              <div className="bg-amber-50 px-4 py-4 text-sm font-medium text-amber-700">
                카드 결제는 예치금 잔액과 무관하게 주문 생성 후 PG 결제창에서
                진행됩니다.
              </div>
              <div className="space-y-3 border border-gray-200 bg-blue-50/70 px-4 py-4 text-sm text-gray-600">
                <div className="flex items-center justify-between">
                  <span>현재 단계</span>
                  <span className="font-semibold text-gray-900">
                    주문 생성 후 토스 결제창 호출
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>성공 복귀 후</span>
                  <span className="font-semibold text-gray-900">
                    confirm API 호출
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>현재 예치금</span>
                <span className="text-base font-extrabold text-gray-900">
                  {walletLoading
                    ? "불러오는 중..."
                    : walletBalance === null
                      ? "-"
                      : formatPrice(walletBalance)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm text-red-500">
                <span>결제 예정 금액</span>
                <span className="text-base font-extrabold">
                  -{formatPrice(payment.totalPrice)}
                </span>
              </div>
              <div className="h-px bg-gray-200" />
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">
                  결제 후 예상 잔액
                </span>
                <span className="text-xl font-black tracking-tight text-blue-700">
                  {walletLoading || walletBalance === null
                    ? "-"
                    : formatPrice(
                        Math.max(effectiveDepositBalance - payment.totalPrice, 0)
                      )}
                </span>
              </div>

              {walletError ? (
                <div className="bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
                  {walletError}
                </div>
              ) : null}

              {!walletLoading && walletBalance !== null && !hasEnoughDeposit ? (
                <div className="bg-red-50 px-4 py-3 text-sm font-medium text-red-500">
                  예치금이 {formatPrice(shortageAmount)} 부족합니다. 충전 후
                  다시 시도해 주세요.
                </div>
              ) : null}
            </div>
          )}
        </section>

        <section className="mb-32 space-y-3 px-2">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>상품 금액</span>
            <span className="font-semibold text-gray-900">
              {formatPrice(payment.itemPrice)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>배송비</span>
            <span className="font-semibold text-gray-900">
              {formatPrice(payment.shippingFee)}
            </span>
          </div>
          <div className="flex items-end justify-between border-t border-gray-200 pt-4">
            <span className="text-lg font-extrabold text-gray-900">
              총 결제 금액
            </span>
            <span className="text-3xl font-black tracking-tight text-blue-700">
              {formatPrice(payment.totalPrice)}
            </span>
          </div>
        </section>
      </PageContainer>

      <footer className="fixed bottom-0 left-0 z-40 w-full bg-white/85 backdrop-blur-xl">
        <div className="mx-auto max-w-3xl space-y-3 px-4 pb-8 pt-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>{paymentMethodLabel}</span>
            <span className="text-lg font-extrabold text-blue-700">
              {formatPrice(payment.totalPrice)}
            </span>
          </div>
          <Button
            size="lg"
            className="h-16 w-full rounded-full text-lg font-extrabold shadow-lg"
            disabled={
              isCardPayment
                ? isSubmitting || isPreparingCardOrder || !preparedCardOrder
                : walletLoading ||
                  walletBalance === null ||
                  !hasEnoughDeposit ||
                  isSubmitting
            }
            onClick={handleCreateOrder}
          >
            {isSubmitting
              ? isCardPayment
                ? "주문 생성 및 결제창 준비 중..."
                : "주문/결제 요청 중..."
              : isCardPayment
                ? isPreparingCardOrder
                  ? "카드 결제 주문 준비 중..."
                  : preparedCardOrder
                    ? "주문 생성 후 카드 결제하기"
                    : "카드 결제 준비 중..."
                : walletLoading
                  ? "예치금 확인 중..."
                  : hasEnoughDeposit
                    ? `${formatPrice(payment.totalPrice)} 결제하기`
                    : "예치금이 부족합니다"}
          </Button>
          {!isCardPayment &&
          !walletLoading &&
          walletBalance !== null &&
          !hasEnoughDeposit ? (
            <Button
              variant="secondary"
              size="lg"
              className="h-14 w-full rounded-full text-base font-extrabold"
              onClick={() =>
                navigate(`/payments/${payment.orderId || "pending"}/fail`, {
                  state: {
                    ...payment,
                    errorCode: "INSUFFICIENT_BALANCE",
                    errorTitle: "예치금 부족",
                    errorMessage: `현재 예치금이 ${formatPrice(shortageAmount)} 부족합니다. 충전 후 다시 시도해 주세요.`,
                  },
                })
              }
            >
              실패 화면 보기
            </Button>
          ) : null}
          <p className="text-center text-[11px] font-bold uppercase tracking-[0.22em] text-gray-400">
            {isCardPayment
              ? "Order Create + Toss Card Payment"
              : "Secure Deposit Transaction"}
          </p>
        </div>
      </footer>
    </>
  );
}
