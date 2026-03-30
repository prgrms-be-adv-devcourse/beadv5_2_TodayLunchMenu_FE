import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import Button from "../../components/common/Button";
import PageContainer from "../../components/common/PageContainer";
import { useAuth } from "../../features/auth/useAuth";
import { getNotificationsApi, markNotificationReadApi } from "../../features/notification/notificationApi";

const SAMPLE_NOTIFICATIONS = [
  {
    notificationId: "sample-auto-confirmed",
    type: "AUTO_PURCHASE_CONFIRMED",
    title: "구매가 자동 확정되었어요",
    content: "주문이 자동으로 구매 확정 처리되었어요.",
    referenceId: "order-1001",
    referenceType: "ORDER",
    read: false,
    createdAt: new Date().toISOString(),
  },
  {
    notificationId: "sample-payment-success",
    type: "ORDER_PAYMENT_SUCCEEDED",
    title: "결제가 완료되었어요",
    content: "주문 결제가 정상적으로 완료되었어요.",
    referenceId: "order-1002",
    referenceType: "ORDER",
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
  },
  {
    notificationId: "sample-payment-failed",
    type: "ORDER_PAYMENT_FAILED",
    title: "결제에 실패했어요",
    content: "잔액이 부족해 결제가 실패했어요.",
    referenceId: "order-1003",
    referenceType: "ORDER",
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
  },
  {
    notificationId: "sample-settlement-success",
    type: "SELLER_SETTLEMENT_PAYOUT_SUCCEEDED",
    title: "정산 지급이 완료되었어요",
    content: "정산금이 정상적으로 지급되었어요.",
    referenceId: "settlement-2001",
    referenceType: "SETTLEMENT",
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 40).toISOString(),
  },
];

const TYPE_META = {
  AUTO_PURCHASE_CONFIRMED: {
    icon: "✓",
    tone: "bg-violet-100 text-violet-700",
  },
  ORDER_PAYMENT_SUCCEEDED: {
    icon: "₩",
    tone: "bg-emerald-100 text-emerald-700",
  },
  ORDER_PAYMENT_FAILED: {
    icon: "!",
    tone: "bg-rose-100 text-rose-700",
  },
  SELLER_SETTLEMENT_PAYOUT_SUCCEEDED: {
    icon: "₩",
    tone: "bg-sky-100 text-sky-700",
  },
  SELLER_SETTLEMENT_PAYOUT_FAILED: {
    icon: "!",
    tone: "bg-amber-100 text-amber-700",
  },
};

function getSectionLabel(date) {
  const target = new Date(date);
  const today = new Date();

  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfTarget = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const diffDays = Math.floor((startOfToday - startOfTarget) / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return "오늘";
  if (diffDays === 1) return "어제";
  return `${target.getMonth() + 1}월 ${target.getDate()}일`;
}

function formatRelativeTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const diff = Date.now() - date.getTime();
  const minutes = Math.max(1, Math.floor(diff / (1000 * 60)));
  if (minutes < 60) return `${minutes}분 전`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;

  const days = Math.floor(hours / 24);
  return `${days}일 전`;
}

export default function NotificationListPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [usingSampleData, setUsingSampleData] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadNotifications() {
      if (authLoading) {
        return;
      }

      if (!isAuthenticated) {
        if (!mounted) return;
        setNotifications(SAMPLE_NOTIFICATIONS);
        setUsingSampleData(true);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");
        const result = await getNotificationsApi();
        const items = result?.items ?? [];

        if (!mounted) return;
        setNotifications(items.length > 0 ? items : SAMPLE_NOTIFICATIONS);
        setUsingSampleData(items.length === 0);
      } catch {
        if (!mounted) return;
        setNotifications(SAMPLE_NOTIFICATIONS);
        setUsingSampleData(true);
        setError("알림을 불러오지 못해 예시 데이터를 표시하고 있어요.");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadNotifications();

    return () => {
      mounted = false;
    };
  }, [authLoading, isAuthenticated]);

  const sections = useMemo(() => {
    return notifications.reduce((acc, notification) => {
      const label = getSectionLabel(notification.createdAt);
      if (!acc[label]) {
        acc[label] = [];
      }
      acc[label].push(notification);
      return acc;
    }, {});
  }, [notifications]);

  const unreadCount = notifications.filter((item) => !item.read).length;

  async function handleMarkRead(notificationId) {
    setNotifications((current) =>
      current.map((item) =>
        item.notificationId === notificationId ? { ...item, read: true } : item
      )
    );

    if (String(notificationId).startsWith("sample-")) {
      return;
    }

    try {
      await markNotificationReadApi(notificationId);
    } catch {
      setError("읽음 처리 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.");
    }
  }

  function handleMarkAllRead() {
    setNotifications((current) => current.map((item) => ({ ...item, read: true })));
  }

  return (
    <PageContainer>
      <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-violet-700 via-violet-600 to-fuchsia-600 p-6 text-white shadow-[0_20px_70px_rgba(91,33,182,0.25)]">
        <div className="absolute -right-10 -top-8 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-16 left-8 h-28 w-28 rounded-full bg-fuchsia-300/20 blur-2xl" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-white/70">Notifications</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white">알림 보관함</h1>
            <p className="mt-2 max-w-xl text-sm text-white/75">
              자동 주문 확정, 결제 결과, 정산 결과처럼 중요한 상태 변화만 한눈에 모아볼 수 있어요.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white">
              읽지 않음 {unreadCount}개
            </div>
            <Button
              variant="secondary"
              className="bg-white text-violet-700 hover:bg-violet-50"
              onClick={handleMarkAllRead}
            >
              모두 읽음
            </Button>
          </div>
        </div>
      </section>

      {usingSampleData ? (
        <section className="mt-5 rounded-2xl border border-dashed border-violet-200 bg-violet-50/70 px-4 py-3 text-left text-sm text-violet-700">
          서버 데이터가 아직 없거나 연결되지 않아 예시 알림을 보여주고 있어요.
        </section>
      ) : null}

      {error ? (
        <section className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-left text-sm text-amber-700">
          {error}
        </section>
      ) : null}

      {loading ? (
        <section className="mt-8 grid gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-28 animate-pulse rounded-[28px] bg-white/80 shadow-sm ring-1 ring-purple-100"
            />
          ))}
        </section>
      ) : notifications.length === 0 ? (
        <section className="mt-8 rounded-[32px] bg-white/80 px-6 py-16 text-center shadow-sm ring-1 ring-purple-100">
          <p className="text-lg font-bold text-gray-900">도착한 알림이 아직 없어요</p>
          <p className="mt-2 text-sm text-gray-500">주문과 결제, 정산 상태가 바뀌면 여기에서 바로 확인할 수 있어요.</p>
        </section>
      ) : (
        <section className="mt-8 space-y-8">
          {Object.entries(sections).map(([sectionLabel, items]) => (
            <div key={sectionLabel}>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xs font-extrabold uppercase tracking-[0.25em] text-violet-700/70">
                  {sectionLabel}
                </h2>
                <span className="text-xs font-medium text-gray-400">{items.length}개</span>
              </div>

              <div className="space-y-4">
                {items.map((notification) => {
                  const meta = TYPE_META[notification.type] ?? {
                    icon: "•",
                    tone: "bg-gray-100 text-gray-700",
                  };

                  return (
                    <article
                      key={notification.notificationId}
                      className="group rounded-[28px] bg-white/85 p-5 shadow-sm ring-1 ring-purple-100 transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={[
                            "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-lg font-extrabold",
                            meta.tone,
                          ].join(" ")}
                        >
                          {meta.icon}
                        </div>

                        <div className="min-w-0 flex-1 text-left">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <h3 className="text-base font-extrabold tracking-tight text-gray-900">
                                {notification.title}
                              </h3>
                              <p className="mt-2 text-sm leading-6 text-gray-600">{notification.content}</p>
                            </div>

                            <div className="flex items-center gap-2 self-start">
                              {!notification.read ? (
                                <span className="inline-flex h-2.5 w-2.5 rounded-full bg-violet-600" />
                              ) : null}
                              <span className="text-xs font-medium text-gray-400">
                                {formatRelativeTime(notification.createdAt)}
                              </span>
                            </div>
                          </div>

                          <div className="mt-4 flex flex-wrap items-center gap-3">
                            <span className="rounded-full bg-gray-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.15em] text-gray-500">
                              {notification.referenceType}
                            </span>

                            {!notification.read ? (
                              <button
                                type="button"
                                onClick={() => handleMarkRead(notification.notificationId)}
                                className="rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-700 transition hover:bg-violet-200"
                              >
                                읽음 처리
                              </button>
                            ) : (
                              <span className="text-xs font-semibold text-gray-400">읽음 완료</span>
                            )}

                            {notification.referenceType === "ORDER" ? (
                              <Link
                                to="/orders"
                                className="text-xs font-bold text-violet-700 transition hover:text-violet-800"
                              >
                                주문 보기
                              </Link>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          ))}
        </section>
      )}
    </PageContainer>
  );
}
