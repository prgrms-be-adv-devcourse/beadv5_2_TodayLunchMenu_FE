import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Button from "../../components/common/Button";
import PageContainer from "../../components/common/PageContainer";

const MOCK_DEPOSIT_SUCCESS = {
  chargeId: "CHG-8829-XP",
  approvedAmount: 100000,
  walletBalance: 1240000,
  approvedAt: "2026-04-01T14:30:00",
};

function formatPrice(value) {
  return `₩ ${new Intl.NumberFormat("ko-KR").format(value ?? 0)}`;
}

function formatDate(value) {
  if (!value) {
    return "승인 일시 없음";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function buildSuccessModel(state) {
  const source = state ?? MOCK_DEPOSIT_SUCCESS;

  return {
    chargeId: source.chargeId || MOCK_DEPOSIT_SUCCESS.chargeId,
    approvedAmount: source.approvedAmount ?? MOCK_DEPOSIT_SUCCESS.approvedAmount,
    walletBalance: source.walletBalance ?? MOCK_DEPOSIT_SUCCESS.walletBalance,
    approvedAt: source.approvedAt || MOCK_DEPOSIT_SUCCESS.approvedAt,
  };
}

export default function DepositSuccessPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const result = useMemo(() => buildSuccessModel(location.state), [location.state]);

  return (
    <PageContainer>
      <section className="mx-auto flex min-h-[calc(100vh-9rem)] max-w-lg flex-col pb-24 pt-6">
        <header className="mb-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex h-10 w-10 items-center justify-center rounded-full text-violet-700 transition hover:bg-violet-100/60"
              aria-label="뒤로 가기"
            >
              ←
            </button>
            <h1 className="font-headline text-base font-bold tracking-tight text-violet-700">
              Transaction Details
            </h1>
          </div>
          <div className="text-lg font-extrabold tracking-tight text-violet-900">
            VIVID ARTIFACT
          </div>
        </header>

        <main className="flex-1">
          <div className="mb-12 flex flex-col items-center text-center">
            <div className="relative mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-violet-700 text-white shadow-[0_0_20px_rgba(93,63,211,0.2)]">
              <span className="text-5xl">✓</span>
              <div className="absolute -inset-2 rounded-full border-2 border-violet-700/20 animate-pulse" />
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">충전 완료</h2>
            <p className="mt-2 font-medium text-gray-500">예치금이 성공적으로 충전되었습니다.</p>
          </div>

          <section className="relative overflow-hidden rounded-[28px] bg-white px-8 py-8 shadow-[0_40px_60px_-20px_rgba(56,39,76,0.08)] ring-1 ring-purple-100">
            <div className="pointer-events-none absolute right-0 top-0 h-32 w-32 rounded-bl-full bg-violet-700/5" />

            <div className="relative z-10 space-y-8">
              <div className="flex items-end justify-between border-b border-purple-100 pb-6">
                <div>
                  <p className="mb-1 text-xs font-medium uppercase tracking-[0.18em] text-gray-500">
                    Approved Amount
                  </p>
                  <h3 className="text-2xl font-extrabold tracking-tight text-violet-700">
                    {formatPrice(result.approvedAmount)}
                  </h3>
                </div>
                <span className="text-3xl text-violet-300">₩</span>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-gray-500">충전 후 잔액</span>
                  <span className="font-headline text-base font-bold text-gray-900">
                    {formatPrice(result.walletBalance)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-gray-500">충전 일시</span>
                  <span className="text-sm font-medium text-gray-700">
                    {formatDate(result.approvedAt)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-gray-500">충전 ID</span>
                  <span className="rounded bg-purple-100 px-2 py-1 font-mono text-xs font-semibold text-violet-700">
                    {result.chargeId}
                  </span>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-12 flex flex-col gap-4">
            <Button
              size="lg"
              className="h-14 w-full rounded-full text-base font-extrabold shadow-lg shadow-violet-500/20"
              onClick={() => navigate("/deposits")}
            >
              거래내역 보기
            </Button>
            <Button
              size="lg"
              variant="secondary"
              className="h-14 w-full rounded-full text-base font-extrabold"
              onClick={() => navigate("/deposits")}
            >
              예치금 페이지로 돌아가기
            </Button>
          </section>
        </main>
      </section>
    </PageContainer>
  );
}
