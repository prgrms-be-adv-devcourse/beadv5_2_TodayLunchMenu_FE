import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";

import { ApiError } from "../../api/client";
import EscrowTransactionDrawer from "../../components/seller/settlement/EscrowTransactionDrawer";
import PartialSettlementTable from "../../components/seller/settlement/PartialSettlementTable";
import PendingEscrowTable from "../../components/seller/settlement/PendingEscrowTable";
import SellerSettlementSummary from "../../components/seller/settlement/SellerSettlementSummary";
import PageContainer from "../../components/common/PageContainer";
import SellerNav from "../../components/seller/SellerNav";
import {
  getPendingSellerIncomesApi,
  getSellerOrderEscrowTransactionsApi,
  getSellerTransactionsApi,
  getSellerWalletSummaryApi,
} from "../../features/payment/sellerPaymentApi";
import {
  executePartialSettlementApi,
  getPartialSettlementAvailableItemsApi,
} from "../../features/settlement/settlementApi";
import { useAuth } from "../../features/auth/useAuth";

const TABS = [
  { value: "escrow", label: "정산 대기" },
  { value: "partial", label: "부분 정산 가능" },
  { value: "transactions", label: "거래 내역" },
];

function formatKRW(value) {
  return `${new Intl.NumberFormat("ko-KR").format(Number(value) || 0)}원`;
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getErrorMessage(error, fallback) {
  return error instanceof ApiError ? error.message : fallback;
}

function getTransactionLabel(transaction) {
  if (transaction.referenceType === "PARTIAL_SETTLEMENT") {
    return "부분 정산";
  }
  if (transaction.referenceType === "MONTHLY_SETTLEMENT") {
    return "월 정산";
  }
  switch (transaction.type) {
    case "WITHDRAWAL":
      return "출금";
    case "CHARGE":
      return "충전";
    case "ORDER_PAYMENT":
      return "주문 결제";
    case "ORDER_REFUND":
      return "주문 환불";
    default:
      return transaction.description || transaction.type || "거래";
  }
}

function TransactionHistory({ items, loading, error }) {
  if (loading) {
    return <p className="py-12 text-center text-sm text-gray-500">거래 내역을 불러오는 중입니다...</p>;
  }

  if (error) {
    return <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{error}</p>;
  }

  if (items.length === 0) {
    return <p className="py-12 text-center text-sm text-gray-500">표시할 거래 내역이 없습니다.</p>;
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <article
          key={item.id || `${item.referenceId}-${item.createdAt}`}
          className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-purple-100 md:flex-row md:items-center md:justify-between"
        >
          <div>
            <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-violet-700">
              {getTransactionLabel(item)}
            </span>
            <p className="mt-2 text-sm text-gray-500">{item.description}</p>
            <p className="mt-1 text-xs text-gray-400">{formatDate(item.createdAt)}</p>
          </div>
          <div className="text-left md:text-right">
            <p className="text-lg font-black text-gray-900">{formatKRW(item.amount)}</p>
            <p className="text-xs text-gray-500">잔액 {formatKRW(item.balanceAfter)}</p>
          </div>
        </article>
      ))}
    </div>
  );
}

export default function SellerSettlementPage() {
  const { user, loading: authLoading } = useAuth();
  const isSeller = user?.role === "SELLER";
  const [activeTab, setActiveTab] = useState("escrow");
  const [wallet, setWallet] = useState(null);
  const [pendingIncomes, setPendingIncomes] = useState([]);
  const [partialItems, setPartialItems] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState({
    wallet: true,
    pending: true,
    partial: true,
    transactions: true,
  });
  const [errors, setErrors] = useState({
    pending: "",
    partial: "",
    transactions: "",
  });
  const [submitState, setSubmitState] = useState({
    loading: false,
    message: "",
    error: "",
  });
  const [drawer, setDrawer] = useState({
    open: false,
    orderId: null,
    loading: false,
    error: "",
    items: [],
  });

  const loadSettlementData = useCallback(async () => {
    setLoading({
      wallet: true,
      pending: true,
      partial: true,
      transactions: true,
    });
    setErrors({ pending: "", partial: "", transactions: "" });

    const [walletResult, pendingResult, partialResult, transactionResult] =
      await Promise.allSettled([
        getSellerWalletSummaryApi(),
        getPendingSellerIncomesApi({ page: 0, size: 50 }),
        getPartialSettlementAvailableItemsApi(),
        getSellerTransactionsApi({ page: 0, size: 30 }),
      ]);

    if (walletResult.status === "fulfilled") {
      setWallet(walletResult.value);
    }

    if (pendingResult.status === "fulfilled") {
      setPendingIncomes(pendingResult.value.items);
    } else {
      setErrors((prev) => ({
        ...prev,
        pending: getErrorMessage(
          pendingResult.reason,
          "정산 대기 내역을 불러오지 못했습니다."
        ),
      }));
    }

    if (partialResult.status === "fulfilled") {
      setPartialItems(partialResult.value);
      setSelectedIds((prev) =>
        prev.filter((id) =>
          partialResult.value.some((item) => item.settlementItemId === id)
        )
      );
    } else {
      setErrors((prev) => ({
        ...prev,
        partial: getErrorMessage(
          partialResult.reason,
          "부분 정산 가능 항목을 불러오지 못했습니다."
        ),
      }));
    }

    if (transactionResult.status === "fulfilled") {
      setTransactions(transactionResult.value.items);
    } else {
      setErrors((prev) => ({
        ...prev,
        transactions: getErrorMessage(
          transactionResult.reason,
          "거래 내역을 불러오지 못했습니다."
        ),
      }));
    }

    setLoading({
      wallet: false,
      pending: false,
      partial: false,
      transactions: false,
    });
  }, []);

  useEffect(() => {
    if (!isSeller) {
      return;
    }

    let cancelled = false;

    async function run() {
      if (!cancelled) {
        await loadSettlementData();
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [isSeller, loadSettlementData]);

  const pendingEscrowAmount = useMemo(
    () => pendingIncomes.reduce((sum, item) => sum + item.amount, 0),
    [pendingIncomes]
  );
  const availableSettlementAmount = useMemo(
    () => partialItems.reduce((sum, item) => sum + item.netAmount, 0),
    [partialItems]
  );
  const selectedSettlementAmount = useMemo(
    () =>
      partialItems
        .filter((item) => selectedIds.includes(item.settlementItemId))
        .reduce((sum, item) => sum + item.netAmount, 0),
    [partialItems, selectedIds]
  );

  if (authLoading) {
    return (
      <PageContainer>
        <section className="py-16 text-center">
          <p className="text-sm font-medium text-gray-500">
            판매자 권한을 확인하고 있습니다.
          </p>
        </section>
      </PageContainer>
    );
  }

  if (!isSeller) {
    return <Navigate to="/seller/register" replace />;
  }

  const handleToggleSettlement = (settlementItemId) => {
    setSelectedIds((prev) =>
      prev.includes(settlementItemId)
        ? prev.filter((id) => id !== settlementItemId)
        : [...prev, settlementItemId]
    );
  };

  const handleToggleAll = () => {
    setSelectedIds((prev) =>
      prev.length === partialItems.length
        ? []
        : partialItems.map((item) => item.settlementItemId)
    );
  };

  const handleExecutePartialSettlement = async () => {
    if (selectedIds.length === 0) {
      return;
    }

    try {
      setSubmitState({ loading: true, message: "", error: "" });
      const result = await executePartialSettlementApi(selectedIds);
      setSubmitState({
        loading: false,
        message: `${result.settlementItemCount}건, ${formatKRW(
          result.finalSettlementAmount
        )} 부분 정산을 요청했습니다.`,
        error: "",
      });
      setSelectedIds([]);
      await loadSettlementData();
    } catch (error) {
      setSubmitState({
        loading: false,
        message: "",
        error: getErrorMessage(error, "부분 정산 요청에 실패했습니다."),
      });
    }
  };

  const handleOpenTransactions = async (orderId) => {
    setDrawer({
      open: true,
      orderId,
      loading: true,
      error: "",
      items: [],
    });

    try {
      const items = await getSellerOrderEscrowTransactionsApi(orderId);
      setDrawer({
        open: true,
        orderId,
        loading: false,
        error: "",
        items,
      });
    } catch (error) {
      setDrawer({
        open: true,
        orderId,
        loading: false,
        error: getErrorMessage(error, "에스크로 거래 내역을 불러오지 못했습니다."),
        items: [],
      });
    }
  };

  return (
    <>
      <SellerNav currentPage="settlements" />
      <PageContainer>
        <section className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-700">
            Seller Settlement
          </p>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
            정산 관리
          </h1>
          <p className="text-sm leading-6 text-gray-500">
            정산 대기 금액과 지금 정산 가능한 금액을 한곳에서 확인하세요.
          </p>
        </section>

        <section className="mt-6">
          <SellerSettlementSummary
            walletBalance={wallet?.balance ?? 0}
            pendingEscrowAmount={pendingEscrowAmount}
            availableSettlementAmount={availableSettlementAmount}
            selectedSettlementAmount={selectedSettlementAmount}
          />
        </section>

        {submitState.message ? (
          <section className="mt-5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            {submitState.message}
          </section>
        ) : null}

        {submitState.error ? (
          <section className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
            {submitState.error}
          </section>
        ) : null}

        <section className="-mx-4 mt-6 overflow-x-auto px-4">
          <div className="flex min-w-max gap-2">
            {TABS.map((tab) => {
              const active = activeTab === tab.value;
              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setActiveTab(tab.value)}
                  className={[
                    "rounded-full px-5 py-2 text-sm font-bold transition",
                    active
                      ? "bg-violet-700 text-white shadow-md shadow-violet-500/20"
                      : "bg-purple-100 text-gray-500 hover:bg-purple-200",
                  ].join(" ")}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-6">
          {activeTab === "escrow" ? (
            <PendingEscrowTable
              items={pendingIncomes}
              loading={loading.pending}
              error={errors.pending}
              onOpenTransactions={handleOpenTransactions}
            />
          ) : null}

          {activeTab === "partial" ? (
            <PartialSettlementTable
              items={partialItems}
              selectedIds={selectedIds}
              loading={loading.partial}
              error={errors.partial}
              submitting={submitState.loading}
              onToggle={handleToggleSettlement}
              onToggleAll={handleToggleAll}
              onSubmit={handleExecutePartialSettlement}
            />
          ) : null}

          {activeTab === "transactions" ? (
            <TransactionHistory
              items={transactions}
              loading={loading.transactions}
              error={errors.transactions}
            />
          ) : null}
        </section>
      </PageContainer>

      <EscrowTransactionDrawer
        open={drawer.open}
        orderId={drawer.orderId}
        items={drawer.items}
        loading={drawer.loading}
        error={drawer.error}
        onClose={() =>
          setDrawer({
            open: false,
            orderId: null,
            loading: false,
            error: "",
            items: [],
          })
        }
      />
    </>
  );
}
