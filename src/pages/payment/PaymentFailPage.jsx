import { useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Button from "../../components/common/Button";
import PageContainer from "../../components/common/PageContainer";

const MOCK_FAILED_PAYMENT = {
  orderId: "COL-8829-XP",
  totalPrice: 1240000,
  paymentMethod: "Vivid Pay (예치금)",
  errorCode: "INSUFFICIENT_BALANCE",
  errorTitle: "잔액 부족",
  errorMessage:
    "현재 보유한 예치금이 결제 금액보다 부족합니다. 예치금을 충전한 뒤 다시 결제를 시도해 주세요.",
};

function formatPrice(value) {
  return `${new Intl.NumberFormat("ko-KR").format(value)}원`;
}

function buildFailureModel(orderId, state) {
  const source = state ?? MOCK_FAILED_PAYMENT;

  return {
    orderId: source.orderId || orderId || MOCK_FAILED_PAYMENT.orderId,
    totalPrice: source.totalPrice ?? MOCK_FAILED_PAYMENT.totalPrice,
    paymentMethod: source.paymentMethod || source.depositLabel || MOCK_FAILED_PAYMENT.paymentMethod,
    errorCode: source.errorCode || MOCK_FAILED_PAYMENT.errorCode,
    errorTitle: source.errorTitle || MOCK_FAILED_PAYMENT.errorTitle,
    errorMessage: source.errorMessage || MOCK_FAILED_PAYMENT.errorMessage,
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

  return (
    <PageContainer>
      <section className="mx-auto flex min-h-[calc(100vh-9rem)] max-w-lg flex-col justify-center pb-12 pt-4">
        <div className="mb-8 flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-full p-2 text-violet-700 transition hover:bg-violet-100/60"
            aria-label="뒤로 가기"
          >
            ←
          </button>
          <span className="text-lg font-black tracking-tight text-violet-900">The Collector</span>
        </div>

        <div className="space-y-12">
          <div className="relative flex justify-center">
            <div className="absolute inset-0 scale-150 rounded-full bg-rose-400/10 blur-3xl" />
            <div className="relative flex h-48 w-48 items-center justify-center rounded-full bg-white shadow-[0_40px_40px_-10px_rgba(56,39,76,0.06)]">
              <div className="flex h-32 w-32 items-center justify-center rounded-full bg-rose-100 text-6xl text-rose-600">
                !
              </div>
            </div>
          </div>

          <div className="space-y-6 text-center">
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-rose-500">
                Transaction Failed
              </span>
              <h1 className="text-4xl font-black tracking-tight text-gray-900">결제가 중단되었습니다</h1>
            </div>

            <section className="space-y-4 rounded-[28px] bg-purple-50/80 p-6 text-left ring-1 ring-purple-100">
              <div className="flex items-start gap-4">
                <div className="mt-1 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-purple-100">
                  <span className="text-xl text-violet-700">원</span>
                </div>
                <div>
                  <p className="text-lg font-extrabold text-gray-900">{payment.errorTitle}</p>
                  <p className="mt-2 text-sm leading-6 text-gray-500">{payment.errorMessage}</p>
                </div>
              </div>
              <div className="h-px bg-purple-100" />
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold uppercase tracking-[0.2em] text-gray-500">Transaction ID</span>
                <span className="font-mono font-semibold text-violet-700">#{payment.orderId}</span>
              </div>
            </section>
          </div>

          <div className="flex flex-col gap-4">
            <Button
              size="lg"
              className="h-14 w-full rounded-full text-base font-extrabold shadow-[0_15px_30px_-10px_rgba(93,63,211,0.5)]"
              onClick={() => navigate(`/payments`, { state: payment })}
            >
              다시 시도하기
            </Button>
            <Button
              variant="secondary"
              size="lg"
              className="h-14 w-full rounded-full text-base font-extrabold"
              onClick={() => navigate("/deposits")}
            >
              예치금 충전하기
            </Button>
          </div>

          <p className="px-4 text-center text-xs leading-6 text-gray-500">
            문제가 계속되면 네트워크 상태를 확인하거나 고객센터에 문의해 주세요.
          </p>
        </div>

        <footer className="mt-12 rounded-[28px] bg-white p-6 shadow-[0_40px_40px_-10px_rgba(56,39,76,0.06)]">
          <div className="flex items-center gap-5">
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-purple-100 text-2xl text-violet-700">
              🔒
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-gray-900">Secure Acquisition</h4>
              <p className="mt-1 text-xs leading-5 text-gray-500">
                결제 정보는 암호화되어 전송되며, 갤러리 서버에 저장되지 않습니다.
              </p>
            </div>
          </div>
        </footer>
      </section>
    </PageContainer>
  );
}
