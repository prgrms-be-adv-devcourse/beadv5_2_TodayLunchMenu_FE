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

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function toUiWithdrawal(withdrawal) {
  return {
    withdrawRequestId: withdrawal?.withdrawRequestId ?? null,
    amount: toNumber(withdrawal?.amount),
    fee: toNumber(withdrawal?.fee),
    actualAmount: toNumber(withdrawal?.actualAmount),
    maskedBankAccount: withdrawal?.maskedBankAccount ?? "",
    status: withdrawal?.status ?? "UNKNOWN",
    walletBalance: toNumber(withdrawal?.walletBalance),
    requestedAt: withdrawal?.requestedAt ?? null,
    processedAt: withdrawal?.processedAt ?? null,
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

function toUiCardPaymentConfirmResult(result) {
  return {
    transactionGroupId: result?.transactionGroupId ?? null,
    orderId: result?.orderId ?? null,
    buyerId: result?.buyerId ?? null,
    amount: result?.amount ?? 0,
    status: result?.status ?? "FAILED",
    approvedAt: result?.approvedAt ?? null,
  };
}

export {
  toUiCardPaymentConfirmResult,
  getApiPayload,
  toUiChargeConfirmResult,
  toUiChargeCreateResult,
  toUiTransaction,
  toUiWithdrawal,
  toUiWalletSummary,
};
