import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ApiError } from "../../api/client";
import PageContainer from "../../components/common/PageContainer";
import PageHeader from "../../components/common/PageHeader";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import ConfirmModal from "../../components/common/ConfirmModal";
import {
  createChargeApi,
  getTransactionsApi,
  getWalletSummaryApi,
  loadTossPaymentsSdk,
  savePendingCharge,
} from "../../features/payment/paymentApi";

const TOSS_CLIENT_KEY = import.meta.env.VITE_TOSS_CLIENT_KEY;
const IS_DEV = import.meta.env.DEV;

function formatPrice(value) {
  return new Intl.NumberFormat("ko-KR").format(value);
}

function formatDate(value) {
  if (!value) {
    return "거래 일시 없음";
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

function getTransactionLabel(type) {
  switch (type) {
    case "CHARGE":
      return "충전";
    case "PURCHASE":
      return "결제";
    case "REFUND":
      return "환불";
    case "SETTLEMENT":
      return "정산";
    case "WITHDRAWAL":
      return "출금";
    default:
      return type;
  }
}

function getTransactionDescription(transaction) {
  if (transaction.description) {
    return transaction.description;
  }

  switch (transaction.type) {
    case "CHARGE":
      return "예치금 충전";
    case "PURCHASE":
      return "주문 결제";
    case "REFUND":
      return "결제 환불";
    case "SETTLEMENT":
      return "판매 정산";
    case "WITHDRAWAL":
      return "출금";
    default:
      return "거래 내역";
  }
}

export default function DepositPage() {
  const navigate = useNavigate();
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [chargeAmount, setChargeAmount] = useState("");
  const [openChargeModal, setOpenChargeModal] = useState(false);
  const [isCharging, setIsCharging] = useState(false);

  const parsedChargeAmount = Number(chargeAmount || 0);
  const quickAmounts = [10000, 30000, 50000, 100000];
  const isSdkTestMode = IS_DEV && !wallet;
  useEffect(() => {
    let mounted = true;

    async function loadDepositData() {
      try {
        setLoading(true);
        setError("");

        const [walletSummary, transactionPage] = await Promise.all([
          getWalletSummaryApi(),
          getTransactionsApi(),
        ]);

        if (!mounted) {
          return;
        }

        setWallet(walletSummary);
        setTransactions(transactionPage.items);
      } catch (loadError) {
        if (!mounted) {
          return;
        }

        if (loadError instanceof ApiError && loadError.status === 401) {
          navigate("/login");
          return;
        }

        setError(
          loadError instanceof ApiError
            ? loadError.message
            : "예치금 정보를 불러오는 중 오류가 발생했습니다."
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadDepositData();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  const summary = useMemo(() => {
    const charged = transactions
      .filter((transaction) => transaction.type === "CHARGE")
      .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);

    const used = transactions
      .filter((transaction) => transaction.type === "PURCHASE")
      .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);

    return { charged, used };
  }, [transactions]);

  const handleQuickCharge = (amount) => {
    setChargeAmount(String(amount));
  };

  const handleRequestCharge = async () => {
    if (!TOSS_CLIENT_KEY) {
      setError("VITE_TOSS_CLIENT_KEY가 설정되지 않았습니다.");
      return;
    }

    if (!isSdkTestMode && !wallet?.memberId && !wallet?.walletId) {
      setError("충전용 지갑 정보를 찾을 수 없습니다.");
      return;
    }

    try {
      setIsCharging(true);
      setError("");

      const charge = await createChargeApi(parsedChargeAmount);

      savePendingCharge(charge);

      const TossPayments = await loadTossPaymentsSdk();
      const tossPayments = TossPayments(TOSS_CLIENT_KEY);
      const payment = tossPayments.payment({
        customerKey:
          wallet?.memberId || wallet?.walletId || `test-customer-${Date.now()}`,
      });

      setOpenChargeModal(false);

      await payment.requestPayment({
        method: "TRANSFER",
        amount: {
          currency: "KRW",
          value: charge.amount,
        },
        orderId: charge.pgOrderId,
        orderName: `예치금 충전 ${formatPrice(charge.amount)}원`,
        successUrl: `${window.location.origin}/payments/toss/success`,
        failUrl: `${window.location.origin}/payments/toss/fail`,
        customerName: "예치금 충전",
      });
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : requestError?.message || "충전 요청 중 오류가 발생했습니다."
      );
      setIsCharging(false);
    }
  };

  const canSubmit = parsedChargeAmount >= 1000 && (!loading || isSdkTestMode) && !isCharging;

  return (
    <>
      <PageContainer>
        <PageHeader title="예치금" />

        {error ? (
          <section className="mb-6 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
            {error}
          </section>
        ) : null}

        {isSdkTestMode ? (
          <section className="mb-6 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
            백엔드 연결 없이 토스 결제창만 테스트 중입니다. 성공 후 승인 완료 처리는 동작하지 않을 수 있습니다.
          </section>
        ) : null}

        <section className="mb-6 overflow-hidden rounded-[32px] bg-gradient-to-br from-violet-700 to-fuchsia-600 p-6 text-white shadow-xl shadow-violet-500/20">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-violet-100">
            Available Balance
          </p>
          <h2 className="mt-3 text-4xl font-extrabold tracking-tight">
            {loading ? "불러오는 중..." : `${formatPrice(wallet?.balance ?? 0)}원`}
          </h2>
          <p className="mt-2 text-sm text-violet-100">
            주문 결제 시 예치금이 우선 차감됩니다.
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

          <Link
            to="/withdrawals"
            className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-full bg-white/15 px-5 text-sm font-bold text-white transition hover:bg-white/25"
          >
            출금하기
          </Link>
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
              onChange={(event) => setChargeAmount(event.target.value)}
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
              {isCharging ? "결제창 준비 중..." : "충전하기"}
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

          {loading ? (
            <div className="rounded-2xl bg-purple-50/70 px-4 py-6 text-center text-sm font-medium text-gray-500">
              거래 내역을 불러오는 중입니다...
            </div>
          ) : transactions.length === 0 ? (
            <div className="rounded-2xl bg-purple-50/70 px-4 py-6 text-center text-sm font-medium text-gray-500">
              아직 거래 내역이 없습니다.
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction) => {
                const positive = transaction.amount > 0;

                return (
                  <article
                    key={transaction.id}
                    className="rounded-2xl bg-purple-50/70 px-4 py-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-bold text-gray-900">
                          {getTransactionDescription(transaction)}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          {formatDate(transaction.createdAt)}
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
                          {formatPrice(transaction.amount)}원
                        </p>
                        <p className="mt-1 text-[11px] font-medium uppercase tracking-wider text-gray-400">
                          {getTransactionLabel(transaction.type)}
                        </p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </PageContainer>

      <ConfirmModal
        open={openChargeModal}
        onClose={() => setOpenChargeModal(false)}
        title="토스 결제창으로 이동할까요?"
        description={`예치금 ${formatPrice(parsedChargeAmount)}원을 충전하기 위해 토스 퀵계좌이체 창으로 이동합니다.`}
        confirmText="결제창 열기"
        loading={isCharging}
        onConfirm={handleRequestCharge}
      />
    </>
  );
}


