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
  BUYER_AUCTION_WON: {
    icon: "★",
    label: "낙찰",
    tone: "bg-amber-50 text-amber-700 ring-amber-200",
    accent: "bg-amber-600",
  },
  BUYER_AUCTION_OUTBID: {
    icon: "!",
    label: "입찰",
    tone: "bg-orange-50 text-orange-700 ring-orange-200",
    accent: "bg-orange-600",
  },
  SELLER_AUCTION_CLOSED_SOLD: {
    icon: "OK",
    label: "낙찰",
    tone: "bg-amber-50 text-amber-700 ring-amber-200",
    accent: "bg-amber-600",
  },
  SELLER_AUCTION_CLOSED_UNSOLD: {
    icon: "—",
    label: "유찰",
    tone: "bg-gray-50 text-gray-700 ring-gray-200",
    accent: "bg-gray-500",
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
  ORDER_HISTORY: "/orders",
  WALLET_TOPUP: "/deposits",
  SELLER_DASHBOARD: "/seller/products",
  SELLER_PRODUCTS: "/seller/products",
  SELLER_VERIFICATION: "/seller/account-verification",
  SELLER_ORDER_MANAGEMENT: "/seller/products",
  SELLER_AUCTION_MANAGEMENT: "/auctions",
  SELLER_AUCTION_CREATE: "/seller/products/new",
  SETTLEMENT_DETAIL: "/seller/settlements",
  SELLER_TRANSACTION_HISTORY: "/seller/settlements",
  AUCTION_LIST: "/auctions",
  AUCTION_DETAIL: ({ referenceId }) => (referenceId ? `/auctions/${referenceId}` : "/auctions"),
  AUCTION_PAYMENT: ({ referenceId }) => (referenceId ? `/auctions/${referenceId}` : "/auctions"),
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

function getVisibleNotificationSubtitle(notification) {
  const subtitle = notification?.subtitle;
  const referenceId = notification?.referenceId;

  if (typeof subtitle !== "string") {
    return "";
  }

  if (referenceId && subtitle.includes(String(referenceId))) {
    return "";
  }

  return subtitle;
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
  getVisibleNotificationSubtitle,
  getNotificationTypeMeta,
  resolveNotificationActionPath,
};
