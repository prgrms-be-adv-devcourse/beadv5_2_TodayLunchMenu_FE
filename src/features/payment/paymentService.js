import { apiClient } from "../../api/client";
import {
  getApiPayload,
  toUiCardPaymentConfirmResult,
  toUiChargeConfirmResult,
  toUiChargeCreateResult,
  toUiTransaction,
  toUiWithdrawal,
  toUiWalletSummary,
} from "./paymentMappers";
import { PAYMENT_ENDPOINTS } from "./paymentEndpoints";

async function getWalletSummaryApi() {
  const response = await apiClient(PAYMENT_ENDPOINTS.walletSummary, {
    method: "GET",
  });

  return toUiWalletSummary(getApiPayload(response.data));
}

async function getTransactionsApi(params = { page: 0, size: 20 }) {
  const response = await apiClient(PAYMENT_ENDPOINTS.transactions, {
    method: "GET",
    params,
  });

  const page = getApiPayload(response.data);
  const items = Array.isArray(page?.items) ? page.items : [];

  return {
    items: items.map(toUiTransaction),
    page: page?.page ?? 0,
    size: page?.size ?? items.length,
    totalElements: page?.totalElements ?? items.length,
    totalPages: page?.totalPages ?? 1,
    hasNext: page?.hasNext ?? false,
  };
}

async function getWithdrawalsApi(params = { page: 0, size: 20 }) {
  const response = await apiClient(PAYMENT_ENDPOINTS.withdrawals, {
    method: "GET",
    params,
  });

  const page = getApiPayload(response.data);
  const items = Array.isArray(page?.items) ? page.items : [];

  return {
    items: items.map(toUiWithdrawal),
    page: page?.page ?? 0,
    size: page?.size ?? items.length,
    totalElements: page?.totalElements ?? items.length,
    totalPages: page?.totalPages ?? 1,
    hasNext: page?.hasNext ?? false,
  };
}

async function createChargeApi(amount) {
  const response = await apiClient(PAYMENT_ENDPOINTS.charge, {
    method: "POST",
    body: { amount },
  });

  return toUiChargeCreateResult(getApiPayload(response.data));
}

async function confirmChargeApi({ chargeId, paymentKey, orderId, amount }) {
  const response = await apiClient(PAYMENT_ENDPOINTS.chargeConfirm, {
    method: "POST",
    body: {
      chargeId,
      paymentKey,
      orderId,
      amount,
    },
  });

  return toUiChargeConfirmResult(getApiPayload(response.data));
}

async function failChargeApi({ orderId, code, message }) {
  const response = await apiClient(PAYMENT_ENDPOINTS.chargeFail, {
    method: "POST",
    body: {
      orderId,
      code,
      message,
    },
  });

  return getApiPayload(response.data);
}

async function createWithdrawalApi({ amount, bankAccount, accountHolder }) {
  const response = await apiClient(PAYMENT_ENDPOINTS.withdrawals, {
    method: "POST",
    body: {
      amount,
      bankAccount,
      accountHolder,
    },
  });

  return toUiWithdrawal(getApiPayload(response.data));
}

async function createOrderForCardPaymentApi(payload) {
  const response = await apiClient("/api/orders/pg", {
    method: "POST",
    body: {
      address: payload?.address,
      addressDetail: payload?.addressDetail,
      zipCode: payload?.zipCode,
      receiver: payload?.receiver,
      receiverPhone: payload?.receiverPhone,
      orderItemRequest: Array.isArray(payload?.items)
        ? payload.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          }))
        : [],
    },
  });

  const order = getApiPayload(response.data);

  return {
    orderId: order?.orderId ?? null,
    totalPrice: order?.totalPrice ?? 0,
    status: order?.status ?? "CREATED",
    createdAt: order?.createdAt ?? null,
  };
}

async function confirmCardPaymentApi(payload) {
  const response = await apiClient(PAYMENT_ENDPOINTS.cardConfirm, {
    method: "POST",
    body: {
      orderId: payload?.orderId,
      paymentKey: payload?.paymentKey,
      amount: payload?.amount,
    },
  });

  return toUiCardPaymentConfirmResult(getApiPayload(response.data));
}

export {
  confirmChargeApi,
  confirmCardPaymentApi,
  createChargeApi,
  createOrderForCardPaymentApi,
  createWithdrawalApi,
  failChargeApi,
  getTransactionsApi,
  getWalletSummaryApi,
  getWithdrawalsApi,
};
