import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ApiError } from "../../api/client";
import PageContainer from "../../components/common/PageContainer";
import {
  clearPendingCharge,
  confirmChargeApi,
  getPendingCharge,
} from "../../features/payment/paymentApi";

function parseAmount(value) {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : 0;
}

export default function DepositConfirmPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function confirmCharge() {
      const searchParams = new URLSearchParams(location.search);
      const paymentKey = searchParams.get("paymentKey");
      const orderId = searchParams.get("orderId");
      const amount = parseAmount(searchParams.get("amount"));

      if (!paymentKey || !orderId || !amount) {
        navigate("/payments/toss/fail", {
          replace: true,
          state: {
            errorTitle: "승인 정보 누락",
            errorMessage: "결제 승인에 필요한 정보가 누락되었습니다.",
            errorCode: "INVALID_CONFIRM_PARAMS",
            orderId,
            amount,
          },
        });
        return;
      }

      const pendingCharge = getPendingCharge(orderId);
      if (!pendingCharge?.chargeId) {
        navigate("/payments/toss/fail", {
          replace: true,
          state: {
            errorTitle: "충전 요청 정보 없음",
            errorMessage: "충전 요청 정보를 찾을 수 없습니다. 다시 시도해 주세요.",
            errorCode: "CHARGE_NOT_FOUND",
            orderId,
            amount,
          },
        });
        return;
      }

      if (pendingCharge.amount !== amount) {
        clearPendingCharge(orderId);
        navigate("/payments/toss/fail", {
          replace: true,
          state: {
            errorTitle: "승인 금액 불일치",
            errorMessage: "결제 승인 금액이 요청 금액과 일치하지 않습니다.",
            errorCode: "AMOUNT_MISMATCH",
            orderId,
            amount,
          },
        });
        return;
      }

      try {
        setMessage("결제 승인 요청을 확인하고 있습니다...");

        const result = await confirmChargeApi({
          chargeId: pendingCharge.chargeId,
          paymentKey,
          orderId,
          amount,
        });

        if (cancelled) {
          return;
        }

        clearPendingCharge(orderId);
        navigate("/deposits/success", {
          replace: true,
          state: {
            chargeId: result.chargeId,
            approvedAmount: result.approvedAmount,
            walletBalance: result.walletBalance,
            approvedAt: result.approvedAt,
          },
        });
      } catch (error) {
        if (cancelled) {
          return;
        }

        navigate("/payments/toss/fail", {
          replace: true,
          state: {
            errorTitle: "충전 승인 실패",
            errorMessage:
              error instanceof ApiError
                ? error.message
                : "결제 승인 처리 중 오류가 발생했습니다.",
            errorCode:
              error instanceof ApiError ? error.code : "CHARGE_CONFIRM_FAILED",
            orderId,
            amount,
          },
        });
      }
    }

    confirmCharge();

    return () => {
      cancelled = true;
    };
  }, [location.search, navigate]);

  return (
    <PageContainer>
      <section className="mx-auto flex min-h-[calc(100vh-9rem)] w-full max-w-md flex-col items-center justify-center overflow-hidden px-8 text-center">
        <div className="relative mb-12">
          <div className="absolute inset-0 scale-150 rounded-full bg-violet-200/30 blur-3xl" />

          <div className="relative flex h-24 w-24 items-center justify-center">
            <div className="absolute inset-0 rounded-full border-4 border-violet-200/40" />
            <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-violet-700 border-r-fuchsia-500" />
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-xl ring-1 ring-purple-100">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-100 text-xl font-black text-violet-700">
                ₩
              </div>
            </div>
          </div>
        </div>

        <h1 className="mb-4 text-2xl font-extrabold tracking-tight text-gray-900">
          충전 승인 처리 중입니다
        </h1>

        <p className="mb-12 leading-relaxed text-gray-500">
          잠시만 기다려 주세요. 결제가 완료되면
          <br />
          자동으로 결과 페이지로 이동합니다.
        </p>

        <div className="mb-4 h-1 w-12 rounded-full bg-purple-100" />
        <p className="text-sm font-medium text-violet-700">{message || "승인 정보를 확인하고 있습니다..."}</p>

        <footer className="fixed bottom-12 w-full max-w-xs px-6 text-center">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-gray-400">
            너무 오래 걸릴 경우 새로고침을 하지 마시고
            <br />
            잠시만 더 기다려 주세요.
          </p>
        </footer>
      </section>
    </PageContainer>
  );
}
