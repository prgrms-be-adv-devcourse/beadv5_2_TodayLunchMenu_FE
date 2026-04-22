const PAYMENT_ENDPOINTS = {
  walletSummary: "/api/payments/wallet",
  transactions: "/api/payments/transactions",
  withdrawals: "/api/payments/withdrawals",
  charge: "/api/payments/charge",
  chargeConfirm: "/api/payments/confirm",
  cardOrderCreate: "/api/payments/order-card/create",
  cardPrepare: "/api/payments/order-card/prepare",
  cardConfirm: "/api/payments/card/confirm",
  cardFail: "/api/payments/order-card/fail",
};

export { PAYMENT_ENDPOINTS };
