import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import Button from "../../components/common/Button";
import PageContainer from "../../components/common/PageContainer";
import { useAuth } from "../../features/auth/useAuth";
import { useNotification } from "../../features/notification/useNotification";
import {
  formatElapsedTime,
  getNotificationActionClassName,
  getNotificationTypeMeta,
  resolveNotificationActionPath,
} from "../../features/notification/notificationPresentation";
import {
  getNotificationsApi,
  markNotificationReadApi,
} from "../../features/notification/notificationApi";

function NotificationActionButtons({ notification, onAction }) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      {(notification.actions || []).map((action) => {
        const path = resolveNotificationActionPath(action, notification);
        const isClickable = Boolean(path);

        return (
          <button
            key={`${notification.notificationId}-${action.routeKey}-${action.label}`}
            type="button"
            disabled={!isClickable}
            onClick={() => onAction(path)}
            className={[
              "rounded-full px-3 py-1.5 text-xs font-bold transition",
              getNotificationActionClassName(action.variant),
              !isClickable ? "cursor-not-allowed opacity-40" : "",
            ].join(" ")}
          >
            {action.label}
          </button>
        );
      })}

      <div className="ml-auto">
        {!notification.read ? (
          <button
            type="button"
            onClick={() => onAction("__mark_read__")}
            className="rounded-full bg-violet-100 px-3 py-1.5 text-[11px] font-bold text-violet-700 transition hover:bg-violet-200"
          >
            읽음 처리
          </button>
        ) : (
          <span className="inline-flex px-1 text-xs font-semibold text-gray-400">읽음 완료</span>
        )}
      </div>
    </div>
  );
}

export default function NotificationListPage() {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const {
    unreadCount: unreadTotalCount,
    decreaseUnreadCount,
    refreshUnreadCount,
    setUnreadCount,
    lastNotification,
  } = useNotification();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadNotifications() {
      if (authLoading) {
        return;
      }

      if (!isAuthenticated) {
        if (!mounted) return;
        setNotifications([]);
        setUnreadCount(0);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const result = await getNotificationsApi();
        const items = result?.items ?? [];

        if (!mounted) return;
        setNotifications((current) => {
          if (current.length === 0) {
            return items;
          }

          const next = [...current];

          for (const item of items) {
            if (!next.some((currentItem) => currentItem.notificationId === item.notificationId)) {
              next.push(item);
            }
          }

          return next;
        });
        refreshUnreadCount().catch(() => {});
      } catch {
        if (!mounted) return;
        setNotifications([]);
        setError("알림을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.");
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
  }, [authLoading, isAuthenticated, refreshUnreadCount, setUnreadCount]);

  useEffect(() => {
    if (!lastNotification?.notificationId) {
      return;
    }

    setNotifications((current) => {
      if (current.some((item) => item.notificationId === lastNotification.notificationId)) {
        return current;
      }

      return [lastNotification, ...current];
    });
  }, [lastNotification]);

  const sections = useMemo(() => {
    return notifications.reduce((acc, notification) => {
      const label = notification.createdAt ? new Date(notification.createdAt) : null;
      const sectionLabel = label ? `${label.getMonth() + 1}월 ${label.getDate()}일` : "오늘";

      if (!acc[sectionLabel]) {
        acc[sectionLabel] = [];
      }
      acc[sectionLabel].push(notification);
      return acc;
    }, {});
  }, [notifications]);

  async function handleMarkRead(notificationId) {
    const target = notifications.find((item) => item.notificationId === notificationId);
    if (!target || target.read) {
      return;
    }

    setNotifications((current) =>
      current.map((item) =>
        item.notificationId === notificationId ? { ...item, read: true } : item
      )
    );
    decreaseUnreadCount(1);

    try {
      await markNotificationReadApi(notificationId);
    } catch {
      refreshUnreadCount().catch(() => {});
      setError("읽음 처리 중 문제가 발생했어요. 잠시 후 다시 시도해 주세요.");
    }
  }

  async function handleMarkAllRead() {
    const unreadItems = notifications.filter((item) => !item.read);

    if (unreadItems.length === 0) {
      return;
    }

    setNotifications((current) => current.map((item) => ({ ...item, read: true })));
    decreaseUnreadCount(unreadItems.length);

    const results = await Promise.allSettled(
      unreadItems.map((item) => markNotificationReadApi(item.notificationId))
    );

    if (results.some((result) => result.status === "rejected")) {
      refreshUnreadCount().catch(() => {});
      setError("일부 알림을 읽음 처리하지 못했어요. 다시 시도해 주세요.");
      return;
    }

    refreshUnreadCount().catch(() => {});
  }

  const handleAction = (path) => {
    if (path === "__mark_read__") {
      return;
    }

    if (!path) {
      return;
    }

    navigate(path);
  };

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
              주문, 결제, 정산과 관련된 알림을 한곳에서 확인할 수 있어요.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white">
              읽지 않음 {unreadTotalCount}개
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
          <p className="mt-2 text-sm text-gray-500">
            주문, 결제, 정산 상태가 바뀌면 여기에서 바로 확인할 수 있어요.
          </p>
          {!isAuthenticated ? (
            <Link
              to="/login"
              className="mt-6 inline-flex text-sm font-bold text-violet-700 hover:underline"
            >
              로그인하고 알림 확인하기
            </Link>
          ) : null}
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
                  const meta = getNotificationTypeMeta(notification.type);
                  const elapsedTime = formatElapsedTime(notification);
                  const shouldHideSubtitle =
                    Boolean(notification.referenceId) &&
                    typeof notification.subtitle === "string" &&
                    notification.subtitle.includes(String(notification.referenceId));
                  const visibleSubtitle = shouldHideSubtitle ? "" : notification.subtitle;

                  return (
                    <article
                      key={notification.notificationId}
                      className="group relative overflow-hidden rounded-[24px] border border-violet-100 bg-white p-5 text-left shadow-[0_16px_40px_rgba(93,63,211,0.12)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_56px_rgba(93,63,211,0.16)]"
                    >
                      <div className="absolute inset-y-0 left-0 w-1.5 rounded-l-[24px] bg-violet-600/90" />

                      <div className="flex items-start gap-4 pl-2">
                        <div
                          className={[
                            "mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-extrabold ring-1",
                            meta.tone,
                          ].join(" ")}
                        >
                          {meta.icon}
                        </div>

                        <div className="min-w-0 flex-1 text-left">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h3 className="text-base font-extrabold tracking-tight text-gray-900">
                                {notification.title}
                              </h3>
                              {visibleSubtitle ? (
                                <p className="mt-1 text-sm font-semibold text-violet-700/80">
                                  {visibleSubtitle}
                                </p>
                              ) : null}
                              <p className="mt-2 text-sm leading-6 text-gray-600">
                                {notification.content}
                              </p>
                            </div>

                            <div className="flex shrink-0 items-center gap-2">
                              <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-semibold text-violet-700/75">
                                {elapsedTime}
                              </span>
                            </div>
                          </div>

                          <NotificationActionButtons
                            notification={notification}
                            onAction={(path) => {
                              if (path === "__mark_read__") {
                                handleMarkRead(notification.notificationId);
                                return;
                              }

                              handleAction(path);
                            }}
                          />
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
