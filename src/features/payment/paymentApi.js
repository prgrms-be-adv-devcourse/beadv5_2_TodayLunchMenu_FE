import { apiClient } from "../../api/client";

const TOSS_SDK_SRC = "https://js.tosspayments.com/v2/standard";
const PENDING_CHARGE_KEY_PREFIX = "deposit-charge:";
// TODO: API 응답 구조가 일관되지 않아서 payload 추출 및 UI 변환 로직이 복잡해짐.
function getApiPayload(data) {
  return data?.data ?? data;
}

function toUiWalletSummary(wallet) {
  return {
    walletId: wallet?.walletId ?? null,
    memberId: wallet?.memberId ?? null,
    balance: wallet?.balance ?? 0,
    updatedAt: wallet?.updatedAt ?? null,
  };
}

function toUiTransaction(transaction) {
  return {
    id: transaction?.transactionId ?? null,
    type: transaction?.transactionType ?? "UNKNOWN",
    amount: transaction?.amount ?? 0,
    balanceAfter: transaction?.balanceAfter ?? 0,
    referenceType: transaction?.referenceType ?? "",
    referenceId: transaction?.referenceId ?? null,
    description: transaction?.description ?? "거래 내역",
    createdAt: transaction?.createdAt ?? null,
  };
}

function toUiChargeCreateResult(result) {
  return {
    chargeId: result?.chargeId ?? null,
    walletId: result?.walletId ?? null,
    pgOrderId: result?.pgOrderId ?? null,
    amount: result?.amount ?? 0,
    pgProvider: result?.pgProvider ?? "TOSS",
    chargeStatus: result?.chargeStatus ?? "PENDING",
  };
}

function toUiChargeConfirmResult(result) {
  return {
    chargeId: result?.chargeId ?? null,
    chargeStatus: result?.chargeStatus ?? "FAILED",
    approvedAmount: result?.approvedAmount ?? 0,
    walletBalance: result?.walletBalance ?? 0,
    approvedAt: result?.approvedAt ?? null,
  };
}

async function getWalletSummaryApi() {
  const response = await apiClient("/api/payments/wallet", {
    method: "GET",
  });

  return toUiWalletSummary(getApiPayload(response.data));
}

async function getTransactionsApi(params = { page: 0, size: 20 }) {
  const response = await apiClient("/api/payments/transactions", {
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
  const response = await apiClient("/api/payments/charge", {
    method: "POST",
    body: { amount },
  });

  return toUiChargeCreateResult(getApiPayload(response.data));
}

async function confirmChargeApi({ chargeId, paymentKey, orderId, amount }) {
  const response = await apiClient("/api/payments/confirm", {
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

let tossSdkPromise;

function loadTossPaymentsSdk() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("브라우저 환경에서만 토스 SDK를 로드할 수 있습니다."));
  }

  if (window.TossPayments) {
    return Promise.resolve(window.TossPayments);
  }

  if (tossSdkPromise) {
    return tossSdkPromise;
  }

  tossSdkPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector(`script[src="${TOSS_SDK_SRC}"]`);

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(window.TossPayments), {
        once: true,
      });
      existingScript.addEventListener(
        "error",
        () => reject(new Error("토스페이먼츠 SDK를 불러오지 못했습니다.")),
        { once: true }
      );
      return;
    }

    const script = document.createElement("script");
    script.src = TOSS_SDK_SRC;
    script.async = true;
    script.onload = () => resolve(window.TossPayments);
    script.onerror = () => reject(new Error("토스페이먼츠 SDK를 불러오지 못했습니다."));
    document.head.appendChild(script);
  });

  return tossSdkPromise;
}

export {
  clearPendingCharge,
  confirmChargeApi,
  createChargeApi,
  getPendingCharge,
  getTransactionsApi,
  getWalletSummaryApi,
  loadTossPaymentsSdk,
  savePendingCharge,
};
