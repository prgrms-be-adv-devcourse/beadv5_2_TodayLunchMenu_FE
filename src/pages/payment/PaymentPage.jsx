import { useEffect, useMemo, useState } from "react";
import { useBlocker, useLocation, useNavigate } from "react-router-dom";
import { ApiError } from "../../api/client";
import Button from "../../components/common/Button";
import ConfirmModal from "../../components/common/ConfirmModal";
import PageContainer from "../../components/common/PageContainer";
import {
  createOrderForCardPaymentApi,
  getWalletSummaryApi,
  loadTossPaymentsSdk,
  savePendingOrderPayment,
} from "../../features/payment/paymentApi";
import { acceptAuctionOrderApi, createOrderApi, getOrderDetailApi } from "../../features/order/orderApi";

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
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  const isAuction = location.state?.isAuction === true;
  const auctionOrderId = location.state?.auctionOrderId ?? null;
  const payment = useMemo(() => buildPaymentModel(location.state), [location.state]);
  const hasPaymentItems = payment.items.length > 0;

  const blocker = useBlocker(({ nextLocation }) => {
    if (nextLocation.pathname.startsWith("/payments/")) return false;
    return hasPaymentItems;
  });

  useEffect(() => {
    if (blocker.state === "blocked") {
      setShowLeaveModal(true);
    }
  }, [blocker.state]);

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
        if (isAuction) {
          try {
            const orderDetail = await getOrderDetailApi(payment.orderId);
            if (!cancelled) {
              setPreparedCardOrder({
                orderId: payment.orderId,
                totalPrice: orderDetail.totalPrice,
                createdAt: orderDetail.createdAt || new Date().toISOString(),
              });
            }
          } catch (error) {
            if (!cancelled) {
              setSubmitError(
                error instanceof ApiError
                  ? error.message
                  : "주문 정보를 불러오는 중 오류가 발생했습니다."
              );
            }
          } finally {
            if (!cancelled) setIsPreparingCardOrder(false);
          }
          return;
        }

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

        if (isAuction) {
          await acceptAuctionOrderApi({
            orderId: auctionOrderId,
            method: "PG",
            address: payment.shipping?.address,
            addressDetail: payment.shipping?.addressDetail,
            zipCode: payment.shipping?.zipCode,
            receiver: payment.shipping?.receiver,
            receiverPhone: payment.shipping?.receiverPhone,
          });
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
          orderNumber: createdOrder.orderNumber ?? null,
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

      if (isAuction) {
        const auctionResult = await acceptAuctionOrderApi({
          orderId: auctionOrderId,
          method: "DEPOSIT",
          address: payment.shipping?.address,
          addressDetail: payment.shipping?.addressDetail,
          zipCode: payment.shipping?.zipCode,
          receiver: payment.shipping?.receiver,
          receiverPhone: payment.shipping?.receiverPhone,
        });
        navigate(`/payments/${auctionOrderId}/success`, {
          replace: true,
          state: {
            ...payment,
            orderId: auctionOrderId,
            orderNumber: auctionResult?.orderNumber ?? null,
            paidAt: new Date().toISOString(),
          },
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
        replace: true,
        state: {
          ...payment,
          orderId: createdOrder.orderId,
          orderNumber: createdOrder.orderNumber ?? null,
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
            ? "주문 생성 또는 카드 결제창 호출 중 오류가 발생했습니다.\n잠시 후 다시 시도해 주세요."
            : "주문 요청 중 오류가 발생했습니다.\n잠시 후 다시 시도해 주세요.";

      navigate(`/payments/${payment.orderId || "pending"}/fail`, {
        state: {
          ...payment,
          errorCode:
            error instanceof ApiError ? error.code : "ORDER_REQUEST_FAILED",
          errorTitle: "결제 실패",
          errorMessage,
        },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!hasPaymentItems) {
      navigate("/orders", { replace: true });
    }
  }, [hasPaymentItems, navigate]);

  if (!hasPaymentItems) {
    return null;
  }

  return (
    <>
      <PageContainer>
        <div className="mx-auto max-w-2xl space-y-7 text-left">

          {submitError ? (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{submitError}</p>
          ) : null}

          <div>
            <button
              type="button"
              onClick={() => {
                try {
                  sessionStorage.setItem("checkout-form-state", JSON.stringify({
                    form: {
                      receiver: payment.shipping?.receiver || "",
                      receiverPhone: payment.shipping?.receiverPhone || "",
                      address: payment.shipping?.address || "",
                      addressDetail: payment.shipping?.addressDetail || "",
                      zipCode: payment.shipping?.zipCode || "",
                      memo: location.state?.memo || "",
                    },
                    paymentMethod: payment.selectedPaymentMethod || payment.paymentMethodCode || "DEPOSIT",
                  }));
                } catch {}
                navigate("/orders/checkout", { state: location.state });
              }}
              className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-900 transition"
            >
              <span aria-hidden="true">←</span> 주문서로 돌아가기
            </button>
          </div>

          {/* 주문 상품 */}
          <div>
            <h2 className="text-lg font-extrabold text-gray-900" style={{ marginBottom: "0.875rem" }}>주문 상품</h2>
            <div className="rounded-[20px] bg-white p-6 shadow-sm ring-1 ring-purple-100">
              <div className="flex items-start gap-4">
                <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-violet-50">
                  {primaryItem?.image ? (
                    <img src={primaryItem.image} alt={primaryItem.name || "상품"} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-2xl font-black text-violet-700">
                      {(primaryItem?.name || "P").slice(0, 1).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900">
                    {primaryItem?.name || "상품 정보 없음"}
                    {payment.items.length > 1 ? ` 외 ${payment.items.length - 1}건` : ""}
                  </p>
                  <p className="mt-1.5 text-sm text-gray-500">수량: {primaryItem?.quantity || 1}개</p>
                  <p className="mt-0.5 text-sm text-gray-500">결제 금액: {formatPrice(payment.totalPrice)}</p>
                </div>
              </div>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* 배송 정보 */}
          <div>
            <h2 className="text-lg font-extrabold text-gray-900" style={{ marginBottom: "0.875rem" }}>배송 정보</h2>
            <div className="rounded-[20px] bg-white p-6 shadow-sm ring-1 ring-purple-100 space-y-4 text-sm">
              <div>
                <p className="text-gray-400">받는 분</p>
                <p className="mt-1 font-semibold text-gray-900">{payment.shipping?.receiver || "-"}</p>
              </div>
              <div>
                <p className="text-gray-400">연락처</p>
                <p className="mt-1 font-semibold text-gray-900">{payment.shipping?.receiverPhone || "-"}</p>
              </div>
              <div>
                <p className="text-gray-400">배송 주소</p>
                <p className="mt-1 font-semibold text-gray-900">
                  {[payment.shipping?.address, payment.shipping?.addressDetail].filter(Boolean).join(" ") || "-"}
                </p>
                {payment.shipping?.zipCode && (
                  <p className="mt-0.5 text-gray-500">({payment.shipping.zipCode})</p>
                )}
              </div>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* 결제 정보 */}
          <div>
            <h2 className="text-lg font-extrabold text-gray-900" style={{ marginBottom: "0.875rem" }}>결제 정보</h2>
            <div className="rounded-[20px] bg-white p-6 shadow-sm ring-1 ring-purple-100 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">결제 수단</span>
                <span className="font-semibold text-gray-900">{paymentMethodLabel}</span>
              </div>
              {!isCardPayment && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-400">보유 예치금</span>
                    <span className="font-semibold text-gray-900">
                      {walletLoading ? "확인 중..." : walletBalance === null ? "-" : formatPrice(walletBalance)}
                    </span>
                  </div>
                  {!walletLoading && walletBalance !== null && !hasEnoughDeposit && (
                    <p className="text-xs font-medium text-red-500">예치금이 {formatPrice(shortageAmount)} 부족합니다</p>
                  )}
                  {walletError && <p className="text-xs text-red-500">{walletError}</p>}
                </>
              )}
              <div className="flex justify-between border-t border-gray-100 pt-3">
                <span className="text-gray-400">상품 금액</span>
                <span className="font-semibold text-gray-900">{formatPrice(payment.itemPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">배송비</span>
                <span className="font-semibold text-gray-900">{payment.shippingFee === 0 ? "무료" : formatPrice(payment.shippingFee)}</span>
              </div>
              <div className="flex justify-between border-t border-gray-100 pt-3">
                <span className="font-bold text-gray-900">총 결제 금액</span>
                <span className="font-extrabold text-violet-700">{formatPrice(payment.totalPrice)}</span>
              </div>
            </div>
          </div>

          <div className="pb-32" />
        </div>
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
            className="h-14 w-full text-base font-extrabold"
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
        </div>
      </footer>

      <ConfirmModal
        open={showLeaveModal}
        onClose={() => { setShowLeaveModal(false); blocker.reset?.(); }}
        title="결제를 중단하시겠습니까?"
        description="페이지를 벗어나면 현재 결제가 중단됩니다."
        confirmText="나가기"
        onConfirm={() => { setShowLeaveModal(false); blocker.proceed?.(); }}
      />
    </>
  );
}
