const TYPE_META = {
  MEMBER_SIGNED_UP: {
    icon: "UP",
    label: "계정",
    tone: "bg-violet-50 text-violet-700 ring-violet-200",
    accent: "bg-violet-600",
  },
  AUTO_PURCHASE_CONFIRMED: {
    icon: "OK",
    label: "주문",
    tone: "bg-violet-50 text-violet-700 ring-violet-200",
    accent: "bg-violet-600",
  },
  ORDER_PAYMENT_SUCCEEDED: {
    icon: "OK",
    label: "결제",
    tone: "bg-violet-50 text-violet-700 ring-violet-200",
    accent: "bg-violet-600",
  },
  ORDER_PAYMENT_FAILED: {
    icon: "!",
    label: "결제",
    tone: "bg-violet-50 text-violet-700 ring-violet-200",
    accent: "bg-violet-600",
  },
  SELLER_SETTLEMENT_PAYOUT_SUCCEEDED: {
    icon: "OK",
    label: "정산",
    tone: "bg-violet-50 text-violet-700 ring-violet-200",
    accent: "bg-violet-600",
  },
  SELLER_SETTLEMENT_PAYOUT_FAILED: {
    icon: "!",
    label: "정산",
    tone: "bg-violet-50 text-violet-700 ring-violet-200",
    accent: "bg-violet-600",
  },
};

const ACTION_VARIANT_CLASS = {
  primary: "bg-violet-700 text-white hover:bg-violet-600",
  secondary: "bg-white/80 text-violet-700 ring-1 ring-violet-200 hover:bg-violet-50",
};

const ROUTE_KEY_PATHS = {
  LOGIN: "/login",
  MY_PROFILE: "/me",
  MY_OAUTH_ACCOUNTS: "/me/external-accounts",
  ORDER_DETAIL: ({ referenceId }) => (referenceId ? `/orders/${referenceId}` : "/orders"),
  DELIVERY_DETAIL: ({ referenceId }) => (referenceId ? `/orders/${referenceId}` : "/orders"),
  WALLET_TOPUP: "/deposits",
  SELLER_DASHBOARD: "/seller/products",
  SELLER_PRODUCTS: "/seller/products",
  SETTLEMENT_DETAIL: "/seller/products",
  SELLER_TRANSACTION_HISTORY: "/seller/products",
  SUPPORT_CONTACT: null,
};

function getNotificationTypeMeta(type) {
  return TYPE_META[type] || {
    icon: "N",
    label: "알림",
    tone: "bg-violet-50 text-violet-700 ring-violet-200",
    accent: "bg-violet-600",
  };
}

function getNotificationActionClassName(variant) {
  return (
    ACTION_VARIANT_CLASS[variant] ||
    "bg-slate-100 text-slate-700 ring-1 ring-slate-200 hover:bg-slate-200"
  );
}

function resolveNotificationActionPath(action, notification) {
  if (!action || action.actionType !== "navigate") {
    return null;
  }

  const routeResolver = ROUTE_KEY_PATHS[action.routeKey];

  if (!routeResolver) {
    return null;
  }

  return typeof routeResolver === "function"
    ? routeResolver(notification || action)
    : routeResolver;
}

function formatElapsedTime(notification) {
  if (notification?.elapsedTime) {
    return notification.elapsedTime;
  }

  const value = notification?.createdAt;
  const date = value ? new Date(value) : null;

  if (!date || Number.isNaN(date.getTime())) {
    return "";
  }

  const diff = Date.now() - date.getTime();
  const minutes = Math.max(1, Math.floor(diff / (1000 * 60)));

  if (minutes < 60) return `${minutes}분 전`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;

  const days = Math.floor(hours / 24);
  return `${days}일 전`;
}

export {
  formatElapsedTime,
  getNotificationActionClassName,
  getNotificationTypeMeta,
  resolveNotificationActionPath,
};
