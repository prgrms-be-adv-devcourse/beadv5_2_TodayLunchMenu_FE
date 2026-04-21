const NOTIFICATION_UNREAD_COUNT_KEY = "notificationUnreadCount";

const readPersistedUnreadCount = () => {
  const rawValue = localStorage.getItem(NOTIFICATION_UNREAD_COUNT_KEY);
  const parsedValue = Number(rawValue);

  return Number.isFinite(parsedValue) && parsedValue >= 0 ? parsedValue : 0;
};

const persistUnreadCount = (unreadCount) => {
  localStorage.setItem(NOTIFICATION_UNREAD_COUNT_KEY, String(Math.max(0, unreadCount ?? 0)));
};

let notificationState = {
  unreadCount: readPersistedUnreadCount(),
  loading: false,
  connectionStatus: "idle",
  lastNotification: null,
};

const listeners = new Set();

const emitChange = () => {
  listeners.forEach((listener) => listener());
};

const getNotificationState = () => notificationState;

const subscribeNotificationStore = (listener) => {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
};

const setNotificationState = (updater) => {
  notificationState =
    typeof updater === "function"
      ? updater(notificationState)
      : { ...notificationState, ...updater };

  persistUnreadCount(notificationState.unreadCount);

  emitChange();
};

const resetNotificationState = () => {
  notificationState = {
    unreadCount: 0,
    loading: false,
    connectionStatus: "idle",
    lastNotification: null,
  };

  localStorage.removeItem(NOTIFICATION_UNREAD_COUNT_KEY);

  emitChange();
};

const setConnectionStatus = (connectionStatus) => {
  setNotificationState((prev) => ({
    ...prev,
    connectionStatus,
  }));
};

const registerIncomingNotification = (notification) => {
  if (!notification?.notificationId) {
    return;
  }

  setNotificationState((prev) => ({
    ...prev,
    unreadCount: prev.unreadCount + 1,
    lastNotification: notification,
  }));
};

export {
  getNotificationState,
  registerIncomingNotification,
  resetNotificationState,
  setConnectionStatus,
  setNotificationState,
  subscribeNotificationStore,
};
