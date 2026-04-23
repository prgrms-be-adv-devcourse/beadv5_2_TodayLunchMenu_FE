import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Button from "../../components/common/Button";
import PageContainer from "../../components/common/PageContainer";
import {
  clearPendingOrderPayment,
  confirmCardPaymentApi,
  getPendingOrderPayment,
} from "../../features/payment/paymentApi";

function formatPrice(value) {
  return `${new Intl.NumberFormat("ko-KR").format(value)}원`;
}

function parseAmount(value) {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : 0;
}

function buildModel(search) {
  const searchParams = new URLSearchParams(search);

  return {
    paymentKey: searchParams.get("paymentKey"),
    orderId: searchParams.get("orderId"),
    amount: parseAmount(searchParams.get("amount")),
  };
}

export default function PaymentCardSuccessPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [confirming, setConfirming] = useState(true);
  const [confirmResult, setConfirmResult] = useState(null);

  const result = useMemo(() => buildModel(location.search), [location.search]);
  const pendingPayment = useMemo(
    () => getPendingOrderPayment(result.orderId),
    [result.orderId]
  );

  useEffect(() => {
    console.info("[PaymentCardSuccessPage] landed", {
      paymentKey: result.paymentKey,
      orderId: result.orderId,
      amount: result.amount,
      hasPendingPayment: Boolean(pendingPayment),
    });
  }, [pendingPayment, result.amount, result.orderId, result.paymentKey]);

  useEffect(() => {
    let cancelled = false;

    async function confirm() {
      console.info("[PaymentCardSuccessPage] confirm start", {
        paymentKey: result.paymentKey,
        orderId: result.orderId,
        amount: result.amount,
        hasPendingPayment: Boolean(pendingPayment),
      });

      if (!result.paymentKey || !result.orderId || !result.amount) {
        navigate("/payments/card/fail", {
          replace: true,
          state: {
            errorTitle: "승인 정보 누락",
            errorMessage: "카드 결제 승인에 필요한 정보가 누락되었습니다.",
            errorCode: "INVALID_CARD_CONFIRM_PARAMS",
            pgOrderId: result.orderId,
            amount: result.amount,
          },
        });
        return;
      }

      if (!pendingPayment) {
        navigate("/payments/card/fail", {
          replace: true,
          state: {
            errorTitle: "진행 중인 결제 정보 없음",
            errorMessage: "세션에서 카드 결제 대기 정보를 찾을 수 없습니다.",
            errorCode: "PENDING_ORDER_PAYMENT_NOT_FOUND",
            pgOrderId: result.orderId,
            amount: result.amount,
          },
        });
        return;
      }

      if (pendingPayment.amount !== result.amount) {
        clearPendingOrderPayment(result.orderId);
        navigate("/payments/card/fail", {
          replace: true,
          state: {
            errorTitle: "결제 금액 불일치",
            errorMessage: "요청한 결제 금액과 승인 금액이 일치하지 않습니다.",
            errorCode: "CARD_PAYMENT_AMOUNT_MISMATCH",
            pgOrderId: result.orderId,
            amount: result.amount,
          },
        });
        return;
      }

      try {
        setConfirming(true);
        const response = await confirmCardPaymentApi({
          orderId: result.orderId,
          paymentKey: result.paymentKey,
          amount: result.amount,
        });

        if (!cancelled) {
          setConfirmResult(response);
        }
      } catch (error) {
        if (!cancelled) {
          navigate("/payments/card/fail", {
            replace: true,
            state: {
              errorTitle: "카드 결제 승인 실패",
              errorMessage:
                error?.message || "카드 결제 승인 중 오류가 발생했습니다.",
              errorCode: error?.code || "CARD_PAYMENT_CONFIRM_FAILED",
              pgOrderId: result.orderId,
              orderId: pendingPayment.orderId,
              amount: result.amount,
            },
          });
        }
      } finally {
        if (!cancelled) {
          setConfirming(false);
        }
      }
    }

    confirm();

    return () => {
      cancelled = true;
    };
  }, [navigate, pendingPayment, result.amount, result.orderId, result.paymentKey]);

  const handleGoSuccess = () => {
    if (!pendingPayment || !confirmResult) {
      return;
    }

    clearPendingOrderPayment(result.orderId);
    navigate(`/payments/${pendingPayment.orderId}/success`, {
      replace: true,
      state: {
        orderId: pendingPayment.orderId,
        totalPrice: confirmResult.amount,
        paymentMethod: "토스 카드 결제",
        paidAt: confirmResult.approvedAt,
        items: pendingPayment.items,
        shipping: pendingPayment.shipping,
      },
    });
  };

  return (
    <PageContainer>
      <section className="mx-auto flex min-h-[calc(100vh-9rem)] max-w-xl flex-col justify-center px-4 py-10">
        <div className="rounded-[32px] bg-white p-8 shadow-[0_40px_40px_-10px_rgba(56,39,76,0.06)] ring-1 ring-purple-100">
          <div className="mb-6 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-4xl text-emerald-600">
              {confirming ? "..." : "✓"}
            </div>
            <h1 className="mt-5 text-3xl font-black tracking-tight text-gray-900">
              {confirming ? "카드 결제 승인 중" : "카드 결제 승인 완료"}
            </h1>
            <p className="mt-2 text-sm leading-6 text-gray-500">
              {confirming
                ? "결제 정보를 검증하고 최종 승인 처리 중입니다."
                : "카드 결제 승인이 완료되었습니다. 주문 완료 화면으로 이동할 수 있습니다."}
            </p>
          </div>

          <div className="space-y-3 rounded-2xl bg-purple-50/70 p-4 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="text-gray-500">paymentKey</span>
              <span className="font-mono font-semibold text-gray-900">
                {result.paymentKey || "-"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-gray-500">orderId</span>
              <span className="font-mono font-semibold text-gray-900">
                {result.orderId || "-"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-gray-500">amount</span>
              <span className="font-semibold text-gray-900">
                {formatPrice(result.amount)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-gray-500">승인 상태</span>
              <span className="font-semibold text-gray-900">
                {confirmResult?.status || (confirming ? "PENDING" : "-")}
              </span>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <Button
              size="lg"
              className="w-full"
              onClick={handleGoSuccess}
              disabled={confirming || !confirmResult}
            >
              주문 완료 화면으로 이동
            </Button>
            <Button
              variant="secondary"
              size="lg"
              className="w-full"
              onClick={() => navigate("/orders")}
              disabled={confirming}
            >
              주문 내역 보기
            </Button>
          </div>
        </div>
      </section>
    </PageContainer>
  );
}
