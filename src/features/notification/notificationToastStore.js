import { getVisibleNotificationSubtitle } from "./notificationPresentation";

const DEFAULT_TOAST_TIMEOUT_MS = 450000; // 7.5 minutes
let nextToastId = 1;
let toastState = {
  items: [],
};

const listeners = new Set();
const timers = new Map();

const emitChange = () => {
  listeners.forEach((listener) => listener());
};

const getToastState = () => toastState;

const subscribeToastStore = (listener) => {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
};

const removeToast = (toastId) => {
  const timer = timers.get(toastId);

  if (timer) {
    clearTimeout(timer);
    timers.delete(toastId);
  }

  toastState = {
    items: toastState.items.filter((toast) => toast.id !== toastId),
  };

  emitChange();
};

const pushToast = ({
  title,
  subtitle,
  message,
  elapsedTime,
  actions = [],
  referenceId = null,
  referenceType = null,
  notificationType = null,
  notificationId = null,
  createdAt = null,
  eventId = null,
  traceId = null,
  read = false,
  tone = "info",
  timeoutMs = DEFAULT_TOAST_TIMEOUT_MS,
}) => {
  const id = String(nextToastId++);
  const visibleSubtitle = getVisibleNotificationSubtitle({ subtitle, referenceId });
  const toast = {
    id,
    title: title || "새 알림",
    subtitle: visibleSubtitle,
    message: message || "",
    elapsedTime: elapsedTime || "",
    actions: Array.isArray(actions) ? actions : [],
    notificationId,
    referenceId,
    referenceType,
    notificationType,
    createdAt,
    eventId,
    traceId,
    read: Boolean(read),
    tone,
  };

  toastState = {
    items: [...toastState.items, toast].slice(-4),
  };

  emitChange();

  const timer = window.setTimeout(() => {
    removeToast(id);
  }, timeoutMs);

  timers.set(id, timer);

  return id;
};

const clearToasts = () => {
  timers.forEach((timer) => clearTimeout(timer));
  timers.clear();

  toastState = {
    items: [],
  };

  emitChange();
};

export {
  clearToasts,
  getToastState,
  pushToast,
  removeToast,
  subscribeToastStore,
};
