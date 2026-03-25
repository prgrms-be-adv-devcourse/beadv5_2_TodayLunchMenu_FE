import { useMemo, useState } from "react";
import PageContainer from "../../components/common/PageContainer";
import PageHeader from "../../components/common/PageHeader";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import ConfirmModal from "../../components/common/ConfirmModal";

const MOCK_TRANSACTIONS = [
  {
    id: 1,
    type: "CHARGE",
    amount: 50000,
    description: "예치금 충전",
    createdAt: "2026-03-24 10:30",
    status: "COMPLETED",
  },
  {
    id: 2,
    type: "PAYMENT",
    amount: -18000,
    description: "주문 결제 #10021",
    createdAt: "2026-03-23 16:12",
    status: "COMPLETED",
  },
  {
    id: 3,
    type: "REFUND",
    amount: 8000,
    description: "주문 취소 환불 #10017",
    createdAt: "2026-03-21 14:20",
    status: "COMPLETED",
  },
];

function formatPrice(value) {
  return new Intl.NumberFormat("ko-KR").format(value);
}

export default function DepositPage() {
  const [balance, setBalance] = useState(42000);
  const [transactions, setTransactions] = useState(MOCK_TRANSACTIONS);
  const [chargeAmount, setChargeAmount] = useState("");
  const [openChargeModal, setOpenChargeModal] = useState(false);

  const parsedChargeAmount = Number(chargeAmount || 0);

  const summary = useMemo(() => {
    const charged = transactions
      .filter((tx) => tx.type === "CHARGE")
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

    const used = transactions
      .filter((tx) => tx.type === "PAYMENT")
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

    return { charged, used };
  }, [transactions]);

  const quickAmounts = [10000, 30000, 50000, 100000];

  const handleQuickCharge = (amount) => {
    setChargeAmount(String(amount));
  };

  const handleChargeConfirm = () => {
    if (parsedChargeAmount <= 0) return;

    setBalance((prev) => prev + parsedChargeAmount);
    setTransactions((prev) => [
      {
        id: Date.now(),
        type: "CHARGE",
        amount: parsedChargeAmount,
        description: "예치금 충전",
        createdAt: "2026-03-24 12:00",
        status: "COMPLETED",
      },
      ...prev,
    ]);

    setChargeAmount("");
    setOpenChargeModal(false);
  };

  const canSubmit = parsedChargeAmount >= 1000;

  return (
    <>
      <PageContainer>
        <PageHeader title="예치금" />

        <section className="mb-6 overflow-hidden rounded-[32px] bg-gradient-to-br from-violet-700 to-fuchsia-600 p-6 text-white shadow-xl shadow-violet-500/20">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-violet-100">
            Available Balance
          </p>
          <h2 className="mt-3 text-4xl font-extrabold tracking-tight">
            {formatPrice(balance)}원
          </h2>
          <p className="mt-2 text-sm text-violet-100">
            주문 결제 시 이 예치금이 우선 차감됩니다.
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
              <p className="text-xs font-medium text-violet-100">누적 충전</p>
              <p className="mt-1 text-lg font-extrabold">
                {formatPrice(summary.charged)}원
              </p>
            </div>
            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
              <p className="text-xs font-medium text-violet-100">누적 사용</p>
              <p className="mt-1 text-lg font-extrabold">
                {formatPrice(summary.used)}원
              </p>
            </div>
          </div>
        </section>

        <section className="mb-8 rounded-[28px] bg-white/80 p-5 shadow-sm ring-1 ring-purple-100">
          <div className="mb-4">
            <h3 className="text-lg font-extrabold tracking-tight text-gray-900">
              예치금 충전
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              1,000원 이상부터 충전할 수 있어요.
            </p>
          </div>

          <div className="space-y-4">
            <Input
              type="number"
              placeholder="충전 금액 입력"
              value={chargeAmount}
              onChange={(e) => setChargeAmount(e.target.value)}
            />

            <div className="flex flex-wrap gap-2">
              {quickAmounts.map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => handleQuickCharge(amount)}
                  className="rounded-full bg-purple-100 px-4 py-2 text-sm font-semibold text-violet-800 transition hover:bg-purple-200"
                >
                  +{formatPrice(amount)}원
                </button>
              ))}
            </div>

            <Button
              className="w-full"
              size="lg"
              disabled={!canSubmit}
              onClick={() => setOpenChargeModal(true)}
            >
              충전하기
            </Button>
          </div>
        </section>

        <section className="rounded-[28px] bg-white/80 p-5 shadow-sm ring-1 ring-purple-100">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-extrabold tracking-tight text-gray-900">
              거래 내역
            </h3>
            <span className="text-sm font-medium text-gray-500">
              {transactions.length}건
            </span>
          </div>

          <div className="space-y-3">
            {transactions.map((tx) => {
              const positive = tx.amount > 0;

              return (
                <article
                  key={tx.id}
                  className="rounded-2xl bg-purple-50/70 px-4 py-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-bold text-gray-900">
                        {tx.description}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {tx.createdAt}
                      </p>
                    </div>

                    <div className="text-right">
                      <p
                        className={[
                          "text-sm font-extrabold",
                          positive ? "text-violet-700" : "text-gray-900",
                        ].join(" ")}
                      >
                        {positive ? "+" : ""}
                        {formatPrice(tx.amount)}원
                      </p>
                      <p className="mt-1 text-[11px] font-medium uppercase tracking-wider text-gray-400">
                        {tx.type}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </PageContainer>

      <ConfirmModal
        open={openChargeModal}
        onClose={() => setOpenChargeModal(false)}
        title="예치금을 충전할까요?"
        description={`예치금 ${formatPrice(parsedChargeAmount)}원을 충전합니다.`}
        confirmText="충전하기"
        onConfirm={handleChargeConfirm}
      />
    </>
  );
}