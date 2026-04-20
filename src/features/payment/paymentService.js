import { ApiError, apiClient } from "../../api/client";
import {
  getApiPayload,
  toUiCardPaymentConfirmResult,
  toUiChargeConfirmResult,
  toUiChargeCreateResult,
  toUiTransaction,
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

function createCardPaymentNotImplementedError(step) {
  return new ApiError({
    status: 501,
    code: "NOT_IMPLEMENTED",
    message: `${step} API is not implemented yet.`,
    data: { step },
  });
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

async function prepareCardPaymentApi(payload) {
  void payload;
  void PAYMENT_ENDPOINTS.cardPrepare;
  throw createCardPaymentNotImplementedError("prepareCardPayment");
}

async function confirmCardPaymentApi(payload) {
  // TODO: payment 모듈 confirm API가 주문 PG 결제용으로 최종 확정됐는지 확인 필요.
  const response = await apiClient("/api/payments/card/confirm", {
    method: "POST",
    body: {
      orderId: payload?.orderId,
      paymentKey: payload?.paymentKey,
      amount: payload?.amount,
    },
  });

  return toUiCardPaymentConfirmResult(getApiPayload(response.data));
}

async function failCardPaymentApi(payload) {
  // TODO: 주문 PG fail 처리용 API가 필요하면 payment 모듈 기준으로 다시 확인 필요.
  void payload;
  void PAYMENT_ENDPOINTS.cardFail;
  throw createCardPaymentNotImplementedError("failCardPayment");
}

export {
  confirmChargeApi,
  confirmCardPaymentApi,
  createChargeApi,
  createOrderForCardPaymentApi,
  failCardPaymentApi,
  getTransactionsApi,
  getWalletSummaryApi,
  prepareCardPaymentApi,
};
