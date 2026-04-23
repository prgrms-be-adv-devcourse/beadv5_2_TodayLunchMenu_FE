const PENDING_SELLER_VERIFICATION_KEY = "seller-account-verification";

function savePendingSellerVerification(verification) {
  if (!verification?.sessionId) {
    return;
  }

  sessionStorage.setItem(
    PENDING_SELLER_VERIFICATION_KEY,
    JSON.stringify({
      sessionId: verification.sessionId,
      status: verification.status ?? "PENDING",
      bankName: verification.bankName ?? "",
      maskedAccountNumber: verification.maskedAccountNumber ?? "",
      verificationCode: verification.verificationCode ?? "",
      expiresAt: verification.expiresAt ?? null,
      attemptCount: verification.attemptCount ?? 0,
      resendCount: verification.resendCount ?? 0,
    })
  );
}

function getPendingSellerVerification() {
  const raw = sessionStorage.getItem(PENDING_SELLER_VERIFICATION_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function clearPendingSellerVerification() {
  sessionStorage.removeItem(PENDING_SELLER_VERIFICATION_KEY);
}

export {
  clearPendingSellerVerification,
  getPendingSellerVerification,
  savePendingSellerVerification,
};
