import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { ApiError } from "../../api/client";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Modal from "../../components/common/Modal";
import PageContainer from "../../components/common/PageContainer";
import PageHeader from "../../components/common/PageHeader";
import {
  createWithdrawalApi,
  getWalletSummaryApi,
  getWithdrawalsApi,
} from "../../features/payment/paymentApi";

const MIN_WITHDRAW_AMOUNT = 5000;
const WITHDRAW_FEE = 1000;
const quickAmounts = [5000, 10000, 30000, 50000];

function formatPrice(value) {
  return new Intl.NumberFormat("ko-KR").format(value);
}

function formatDate(value) {
  if (!value) {
    return "처리 일시 없음";
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

function normalizeBankAccount(value) {
  return value.trim().replaceAll("-", "").replaceAll(" ", "");
}

function getWithdrawalStatusLabel(status) {
  switch (status) {
    case "REQUESTED":
      return "요청됨";
    case "PROCESSING":
      return "처리 중";
    case "COMPLETED":
      return "완료";
    case "FAILED":
      return "실패";
    case "CANCELLED":
      return "취소";
    default:
      return status || "상태 없음";
  }
}

function getWithdrawalStatusClass(status) {
  switch (status) {
    case "COMPLETED":
      return "bg-emerald-50 text-emerald-700 ring-emerald-100";
    case "FAILED":
    case "CANCELLED":
      return "bg-red-50 text-red-700 ring-red-100";
    case "PROCESSING":
      return "bg-amber-50 text-amber-700 ring-amber-100";
    default:
      return "bg-blue-50 text-blue-700 ring-gray-200";
  }
}

export default function WithdrawalPage() {
  const navigate = useNavigate();
  const [wallet, setWallet] = useState(null);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [amount, setAmount] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [openConfirmModal, setOpenConfirmModal] = useState(false);

  const parsedAmount = Number(amount || 0);
  const normalizedBankAccount = normalizeBankAccount(bankAccount);
  const actualAmount = Math.max(parsedAmount - WITHDRAW_FEE, 0);
  const balance = wallet?.balance ?? 0;

  const formError = useMemo(() => {
    if (!parsedAmount) {
      return "출금 금액을 입력해 주세요.";
    }

    if (parsedAmount < MIN_WITHDRAW_AMOUNT) {
      return `최소 ${formatPrice(MIN_WITHDRAW_AMOUNT)}원부터 출금할 수 있습니다.`;
    }

    if (parsedAmount > balance) {
      return "출금 금액이 현재 예치금보다 큽니다.";
    }

    if (!/^\d{6,20}$/.test(normalizedBankAccount)) {
      return "계좌번호는 숫자 6~20자리로 입력해 주세요.";
    }

    if (!accountHolder.trim()) {
      return "예금주를 입력해 주세요.";
    }

    return "";
  }, [accountHolder, balance, normalizedBankAccount, parsedAmount]);

  const canSubmit = !loading && !submitting && !formError;

  const loadWithdrawalData = async () => {
    try {
      setLoading(true);
      setError("");

      const [walletSummary, withdrawalPage] = await Promise.all([
        getWalletSummaryApi(),
        getWithdrawalsApi(),
      ]);

      setWallet(walletSummary);
      setWithdrawals(withdrawalPage.items);
    } catch (loadError) {
      if (loadError instanceof ApiError && loadError.status === 401) {
        navigate("/login");
        return;
      }

      setError(
        loadError instanceof ApiError
          ? loadError.message
          : "출금 정보를 불러오는 중 오류가 발생했습니다."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        setError("");

        const [walletSummary, withdrawalPage] = await Promise.all([
          getWalletSummaryApi(),
          getWithdrawalsApi(),
        ]);

        if (!mounted) {
          return;
        }

        setWallet(walletSummary);
        setWithdrawals(withdrawalPage.items);
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
            : "출금 정보를 불러오는 중 오류가 발생했습니다."
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  const handleQuickAmount = (quickAmount) => {
    setAmount((prevAmount) => {
      const currentAmount = Number(prevAmount || 0);
      const nextAmount = Number.isFinite(currentAmount)
        ? currentAmount + quickAmount
        : quickAmount;

      return String(nextAmount);
    });
  };

  const handleOpenConfirm = () => {
    setNotice("");
    setError("");

    if (formError) {
      setError(formError);
      return;
    }

    setOpenConfirmModal(true);
  };

  const handleCreateWithdrawal = async () => {
    try {
      setSubmitting(true);
      setError("");
      setNotice("");

      const withdrawal = await createWithdrawalApi({
        amount: parsedAmount,
        bankAccount: normalizedBankAccount,
        accountHolder: accountHolder.trim(),
      });

      setWallet((prev) => ({
        ...(prev ?? {}),
        balance: withdrawal.walletBalance,
      }));
      setWithdrawals((prev) => [withdrawal, ...prev]);
      setAmount("");
      setBankAccount("");
      setAccountHolder("");
      setOpenConfirmModal(false);
      setNotice(
        `${formatPrice(withdrawal.actualAmount)}원 출금 요청이 완료되었습니다.`
      );

      loadWithdrawalData();
    } catch (submitError) {
      setError(
        submitError instanceof ApiError
          ? submitError.message
          : "출금 요청 중 오류가 발생했습니다."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageContainer>
        <PageHeader title="예치금 출금" />

        {error ? (
          <section className="mb-6 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
            {error}
          </section>
        ) : null}

        {notice ? (
          <section className="mb-6 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            {notice}
          </section>
        ) : null}

        <section className="mb-6 overflow-hidden bg-blue-700 p-6 text-white shadow-xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-100">
            Withdrawable Balance
          </p>
          <h2 className="mt-3 text-4xl font-extrabold tracking-tight">
            {loading ? "불러오는 중..." : `${formatPrice(balance)}원`}
          </h2>
          <p className="mt-2 text-sm text-blue-100">
            출금 수수료 {formatPrice(WITHDRAW_FEE)}원이 차감됩니다.
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="bg-white/10 p-4 backdrop-blur">
              <p className="text-xs font-medium text-blue-100">최소 출금</p>
              <p className="mt-1 text-lg font-extrabold">
                {formatPrice(MIN_WITHDRAW_AMOUNT)}원
              </p>
            </div>
            <div className="bg-white/10 p-4 backdrop-blur">
              <p className="text-xs font-medium text-blue-100">입금 예정</p>
              <p className="mt-1 text-lg font-extrabold">
                {formatPrice(actualAmount)}원
              </p>
            </div>
          </div>
        </section>

        <section className="mb-8 bg-white/80 p-5 shadow-sm ring-1 ring-gray-200">
          <div className="mb-4">
            <h3 className="text-lg font-extrabold tracking-tight text-gray-900">
              출금 요청
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              계좌번호와 예금주를 확인한 뒤 출금을 요청해 주세요.
            </p>
          </div>

          <div className="space-y-4">
            <Input
              type="number"
              min={MIN_WITHDRAW_AMOUNT}
              step="100"
              placeholder="출금 금액 입력"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />

            <div className="flex flex-wrap gap-2">
              {quickAmounts.map((quickAmount) => (
                <button
                  key={quickAmount}
                  type="button"
                  onClick={() => handleQuickAmount(quickAmount)}
                  className="rounded-full bg-gray-100 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-200"
                >
                  {formatPrice(quickAmount)}원
                </button>
              ))}
            </div>

            <Input
              inputMode="numeric"
              placeholder="계좌번호 입력"
              value={bankAccount}
              onChange={(event) => setBankAccount(event.target.value)}
            />

            <Input
              placeholder="예금주 입력"
              value={accountHolder}
              onChange={(event) => setAccountHolder(event.target.value)}
            />

            <div className="bg-blue-50/80 px-4 py-4 text-sm text-gray-700">
              <div className="flex items-center justify-between">
                <span>출금 요청 금액</span>
                <strong>{formatPrice(parsedAmount)}원</strong>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span>수수료</span>
                <strong>-{formatPrice(WITHDRAW_FEE)}원</strong>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-blue-200 pt-3 text-blue-700">
                <span className="font-bold">입금 예정 금액</span>
                <strong>{formatPrice(actualAmount)}원</strong>
              </div>
            </div>

            <Button
              className="w-full"
              size="lg"
              disabled={!canSubmit}
              onClick={handleOpenConfirm}
            >
              {submitting ? "출금 요청 중..." : "출금 요청하기"}
            </Button>
          </div>
        </section>

        <section className="bg-white/80 p-5 shadow-sm ring-1 ring-gray-200">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-extrabold tracking-tight text-gray-900">
              출금 내역
            </h3>
            <span className="text-sm font-medium text-gray-500">
              {withdrawals.length}건
            </span>
          </div>

          {loading ? (
            <div className="bg-blue-50/70 px-4 py-6 text-center text-sm font-medium text-gray-500">
              출금 내역을 불러오는 중입니다...
            </div>
          ) : withdrawals.length === 0 ? (
            <div className="bg-blue-50/70 px-4 py-6 text-center text-sm font-medium text-gray-500">
              아직 출금 내역이 없습니다.
            </div>
          ) : (
            <div className="space-y-3">
              {withdrawals.map((withdrawal, index) => (
                <article
                  key={withdrawal.withdrawRequestId ?? index}
                  className="bg-blue-50/70 px-4 py-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-bold text-gray-900">
                        {withdrawal.maskedBankAccount || "출금 계좌"}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {formatDate(withdrawal.requestedAt)}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-extrabold text-gray-900">
                        -{formatPrice(withdrawal.amount)}원
                      </p>
                      <span
                        className={[
                          "mt-2 inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ring-1",
                          getWithdrawalStatusClass(withdrawal.status),
                        ].join(" ")}
                      >
                        {getWithdrawalStatusLabel(withdrawal.status)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-3 border-t border-gray-200 pt-3 text-xs text-gray-500">
                    <p>수수료 {formatPrice(withdrawal.fee)}원</p>
                    <p className="text-right">
                      입금 {formatPrice(withdrawal.actualAmount)}원
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </PageContainer>

      <Modal
        open={openConfirmModal}
        onClose={() => {
          if (!submitting) {
            setOpenConfirmModal(false);
          }
        }}
        title="출금을 요청할까요?"
        description={`${formatPrice(parsedAmount)}원을 출금 요청하면 수수료 ${formatPrice(
          WITHDRAW_FEE
        )}원이 차감되고 ${formatPrice(actualAmount)}원이 입금 예정 금액으로 기록됩니다.`}
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              disabled={submitting}
              onClick={() => setOpenConfirmModal(false)}
            >
              취소
            </Button>
            <Button
              type="button"
              disabled={submitting}
              onClick={handleCreateWithdrawal}
            >
              {submitting ? "요청 중..." : "출금 요청"}
            </Button>
          </>
        }
      >
        <div className="bg-blue-50/80 px-4 py-4 text-sm text-gray-700">
          <div className="flex items-center justify-between">
            <span>계좌번호</span>
            <strong>{normalizedBankAccount}</strong>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span>예금주</span>
            <strong>{accountHolder.trim()}</strong>
          </div>
        </div>
      </Modal>
    </>
  );
}
