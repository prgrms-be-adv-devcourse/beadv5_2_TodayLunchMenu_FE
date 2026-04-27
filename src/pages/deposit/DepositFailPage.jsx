import { useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Button from "../../components/common/Button";
import PageContainer from "../../components/common/PageContainer";
import {
  clearPendingCharge,
  failChargeApi,
  getPendingCharge,
} from "../../features/payment/paymentApi";

function getChargeFailureReportKey(orderId) {
  return `charge-failure-reported:${orderId}`;
}

const MOCK_DEPOSIT_FAILURE = {
  errorTitle: "결제 한도 초과",
  errorMessage:
    "죄송합니다. 요청하신 예치금 충전 처리에 실패했습니다. 입력하신 정보를 확인해 주세요.",
  amount: 1000000,
  errorCode: "ERR_LIMIT_EXCEEDED",
  orderId: "ORD-9912-TK",
};

function formatPrice(value) {
  return `₩${new Intl.NumberFormat("ko-KR").format(value ?? 0)}`;
}

function buildFailureModel(search, state) {
  const searchParams = new URLSearchParams(search);
  const orderIdFromQuery = searchParams.get("orderId");
  const pendingCharge = orderIdFromQuery ? getPendingCharge(orderIdFromQuery) : null;
  const source = state ?? {};

  return {
    errorTitle: source.errorTitle || searchParams.get("code") || MOCK_DEPOSIT_FAILURE.errorTitle,
    errorMessage: source.errorMessage || searchParams.get("message") || MOCK_DEPOSIT_FAILURE.errorMessage,
    amount:
      source.amount ??
      source.approvedAmount ??
      pendingCharge?.amount ??
      Number(searchParams.get("amount") || 0) ??
      MOCK_DEPOSIT_FAILURE.amount,
    errorCode: source.errorCode || searchParams.get("code") || MOCK_DEPOSIT_FAILURE.errorCode,
    orderId: source.orderId || orderIdFromQuery || source.pgOrderId || MOCK_DEPOSIT_FAILURE.orderId,
  };
}

function canReportChargeFailure(result) {
  return Boolean(result.orderId && result.errorMessage);
}

export default function DepositFailPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const result = useMemo(
    () => buildFailureModel(location.search, location.state),
    [location.search, location.state]
  );

  useEffect(() => {
    let cancelled = false;

    async function reportFailure() {
      if (!canReportChargeFailure(result)) {
        return;
      }

      const key = getChargeFailureReportKey(result.orderId);
      if (window.sessionStorage.getItem(key) === "1") {
        return;
      }

      try {
        await failChargeApi({
          orderId: result.orderId,
          code: result.errorCode,
          message: result.errorMessage,
        });

        if (!cancelled) {
          window.sessionStorage.setItem(key, "1");
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error("[DepositFailPage] failed to report charge failure", error);
        }
      }
    }

    reportFailure();

    if (result.orderId) {
      clearPendingCharge(result.orderId);
    }

    return () => {
      cancelled = true;
    };
  }, [result]);

  return (
    <PageContainer>
      <section className="mx-auto flex min-h-[calc(100vh-9rem)] max-w-md flex-col items-center justify-center px-2 pb-24 pt-6">
        <header className="mb-10 flex w-full items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex h-10 w-10 items-center justify-center rounded-full p-2 text-blue-700 transition hover:bg-blue-100/50"
              aria-label="뒤로 가기"
            >
              ←
            </button>
            <h1 className="text-lg font-extrabold tracking-tight text-gray-900">
              Transaction Details
            </h1>
          </div>
          <div className="w-10" />
        </header>

        <main className="w-full space-y-8">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="mb-2 flex h-20 w-20 items-center justify-center rounded-full bg-rose-100">
              <span className="text-5xl text-rose-600">!</span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">충전 실패</h2>
            <p className="leading-relaxed text-gray-500">{result.errorMessage}</p>
          </div>

          <section className="space-y-6 bg-white px-8 py-8 shadow-[0_40px_40px_-10px_rgba(0,0,0,0.06)] ring-1 ring-gray-200">
            <div className="space-y-4">
              <div className="flex items-start justify-between border-b border-blue-200 pb-4">
                <span className="text-xs font-medium uppercase tracking-[0.16em] text-gray-500">
                  실패 사유
                </span>
                <span className="max-w-[60%] text-right font-semibold text-rose-600">
                  {result.errorTitle}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-[0.16em] text-gray-500">
                  시도 금액
                </span>
                <span className="text-lg font-extrabold text-blue-700">
                  {formatPrice(result.amount)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs font-medium uppercase tracking-[0.16em] text-gray-500">
                  에러 코드
                </span>
                <span className="rounded bg-gray-100 px-2 py-1 font-mono text-xs text-gray-900">
                  {result.errorCode}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs font-medium uppercase tracking-[0.16em] text-gray-500">
                  주문 ID
                </span>
                <span className="text-sm font-medium text-gray-900">
                  {result.orderId}
                </span>
              </div>
            </div>
          </section>

          <section className="flex flex-col space-y-4 pt-4">
            <Button
              size="lg"
              className="h-14 w-full rounded-full text-base font-extrabold shadow-lg"
              onClick={() => navigate("/deposits")}
            >
              다시 시도하기
            </Button>

            <div className="flex flex-col items-center space-y-4 pt-2">
              <button
                type="button"
                className="text-sm font-semibold text-blue-700 transition hover:underline"
                onClick={() => navigate("/deposits")}
              >
                충전 페이지로 돌아가기
              </button>
              <a
                className="flex items-center gap-1 text-sm font-medium text-gray-500 transition hover:text-gray-900"
                href="mailto:support@example.com"
              >
                고객센터 문의하기
                <span className="text-xs">↗</span>
              </a>
            </div>
          </section>
        </main>
      </section>
    </PageContainer>
  );
}
