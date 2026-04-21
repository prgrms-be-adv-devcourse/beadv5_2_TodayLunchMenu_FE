import { useEffect, useSyncExternalStore } from "react";

import { useAuth } from "../auth/useAuth";
import { getUnreadNotificationCountApi } from "./notificationApi";
import {
  getNotificationState,
  resetNotificationState,
  setNotificationState,
  subscribeNotificationStore,
} from "./notificationStore";

async function refreshUnreadCount() {
  setNotificationState((prev) => ({ ...prev, loading: true }));

  try {
    const result = await getUnreadNotificationCountApi();
    const unreadCount = result?.unreadCount ?? 0;

    setNotificationState({
      unreadCount,
      loading: false,
    });

    return unreadCount;
  } catch (error) {
    setNotificationState((prev) => ({ ...prev, loading: false }));
    throw error;
  }
}

function decreaseUnreadCount(amount = 1) {
  setNotificationState((prev) => ({
    ...prev,
    unreadCount: Math.max(0, prev.unreadCount - amount),
  }));
}

function setUnreadCount(unreadCount) {
  setNotificationState((prev) => ({
    ...prev,
    unreadCount: Math.max(0, unreadCount ?? 0),
  }));
}

function useNotification() {
  const notificationState = useSyncExternalStore(
    subscribeNotificationStore,
    getNotificationState
  );
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const isLoggedIn = isAuthenticated && Boolean(user);
  const hasAccessToken = Boolean(localStorage.getItem("accessToken"));

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!isLoggedIn) {
      if (!hasAccessToken) {
        resetNotificationState();
      }
      return;
    }

    refreshUnreadCount().catch(() => {
      setUnreadCount(0);
    });
  }, [authLoading, hasAccessToken, isLoggedIn]);

  return {
    ...notificationState,
    decreaseUnreadCount,
    refreshUnreadCount,
    resetNotificationState,
    setUnreadCount,
  };
}

export { refreshUnreadCount, useNotification };
