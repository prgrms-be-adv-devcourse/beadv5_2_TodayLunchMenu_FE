const PENDING_CHARGE_KEY_PREFIX = "deposit-charge:";
const PENDING_ORDER_PAYMENT_KEY_PREFIX = "order-payment:";

function savePendingCharge(charge) {
  if (!charge?.pgOrderId) {
    return;
  }

  sessionStorage.setItem(
    `${PENDING_CHARGE_KEY_PREFIX}${charge.pgOrderId}`,
    JSON.stringify({
      chargeId: charge.chargeId,
      pgOrderId: charge.pgOrderId,
      amount: charge.amount,
    })
  );
}

function getPendingCharge(pgOrderId) {
  if (!pgOrderId) {
    return null;
  }

  const raw = sessionStorage.getItem(`${PENDING_CHARGE_KEY_PREFIX}${pgOrderId}`);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function clearPendingCharge(pgOrderId) {
  if (!pgOrderId) {
    return;
  }

  sessionStorage.removeItem(`${PENDING_CHARGE_KEY_PREFIX}${pgOrderId}`);
}

function savePendingOrderPayment(payment) {
  if (!payment?.pgOrderId) {
    return;
  }

  // TODO: payment 모듈의 confirm API가 주문 PG 결제용으로 확정된 계약인지 확인 필요.
  sessionStorage.setItem(
    `${PENDING_ORDER_PAYMENT_KEY_PREFIX}${payment.pgOrderId}`,
    JSON.stringify({
      orderId: payment.orderId ?? null,
      orderNumber: payment.orderNumber ?? null,
      pgOrderId: payment.pgOrderId,
      amount: payment.amount ?? 0,
      orderName: payment.orderName ?? "",
      paymentMethod: payment.paymentMethod ?? "CARD",
      createdAt: payment.createdAt ?? new Date().toISOString(),
      items: Array.isArray(payment.items) ? payment.items : [],
      shipping: payment.shipping ?? null,
      selectedPaymentMethod: payment.selectedPaymentMethod ?? "CARD",
    })
  );
}

function getPendingOrderPayment(pgOrderId) {
  if (!pgOrderId) {
    return null;
  }

  const raw = sessionStorage.getItem(`${PENDING_ORDER_PAYMENT_KEY_PREFIX}${pgOrderId}`);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function clearPendingOrderPayment(pgOrderId) {
  if (!pgOrderId) {
    return;
  }

  sessionStorage.removeItem(`${PENDING_ORDER_PAYMENT_KEY_PREFIX}${pgOrderId}`);
}

export {
  clearPendingCharge,
  clearPendingOrderPayment,
  getPendingCharge,
  getPendingOrderPayment,
  savePendingCharge,
  savePendingOrderPayment,
};
