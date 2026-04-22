import { apiClient } from "../../api/client";
import { getApiPayload, toUiTransaction, toUiWalletSummary } from "./paymentMappers";

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function toPagedResult(page, mapper) {
  const items = Array.isArray(page?.items) ? page.items : [];

  return {
    items: items.map(mapper),
    page: page?.page ?? 0,
    size: page?.size ?? items.length,
    totalElements: page?.totalElements ?? items.length,
    totalPages: page?.totalPages ?? 1,
    hasNext: page?.hasNext ?? false,
  };
}

function toUiPendingSellerIncome(item) {
  return {
    escrowId: item?.escrowId ?? null,
    orderId: item?.orderId ?? null,
    amount: toNumber(item?.amount),
    escrowStatus: item?.escrowStatus ?? "UNKNOWN",
    createdAt: item?.createdAt ?? null,
    updatedAt: item?.updatedAt ?? null,
  };
}

function toUiEscrowTransaction(item) {
  return {
    escrowTransactionId: item?.escrowTransactionId ?? null,
    escrowId: item?.escrowId ?? null,
    orderId: item?.orderId ?? null,
    orderItemId: item?.orderItemId ?? null,
    sellerMemberId: item?.sellerMemberId ?? null,
    buyerMemberId: item?.buyerMemberId ?? null,
    transactionType: item?.transactionType ?? "UNKNOWN",
    amount: toNumber(item?.amount),
    beforeAmount: toNumber(item?.beforeAmount),
    afterAmount: toNumber(item?.afterAmount),
    referenceId: item?.referenceId ?? null,
    referenceType: item?.referenceType ?? "",
    description: item?.description ?? "",
    occurredAt: item?.occurredAt ?? null,
    createdAt: item?.createdAt ?? null,
  };
}

async function getSellerWalletSummaryApi() {
  const response = await apiClient("/api/payments/wallet", {
    method: "GET",
  });

  return toUiWalletSummary(getApiPayload(response.data));
}

async function getSellerTransactionsApi(params = { page: 0, size: 20 }) {
  const response = await apiClient("/api/payments/transactions", {
    method: "GET",
    params,
  });

  return toPagedResult(getApiPayload(response.data), toUiTransaction);
}

async function getPendingSellerIncomesApi(params = { page: 0, size: 20 }) {
  const response = await apiClient("/api/payments/seller/pending-incomes", {
    method: "GET",
    params,
  });

  return toPagedResult(getApiPayload(response.data), toUiPendingSellerIncome);
}

async function getSellerOrderEscrowTransactionsApi(orderId) {
  const response = await apiClient(
    `/api/payments/seller/orders/${orderId}/escrow-transactions`,
    {
      method: "GET",
    }
  );

  const items = getApiPayload(response.data);
  return Array.isArray(items) ? items.map(toUiEscrowTransaction) : [];
}

export {
  getPendingSellerIncomesApi,
  getSellerOrderEscrowTransactionsApi,
  getSellerTransactionsApi,
  getSellerWalletSummaryApi,
};
