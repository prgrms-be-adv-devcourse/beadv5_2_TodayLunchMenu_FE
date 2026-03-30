let notificationState = {
  unreadCount: 0,
  loading: false,
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

  emitChange();
};

const resetNotificationState = () => {
  notificationState = {
    unreadCount: 0,
    loading: false,
  };

  emitChange();
};

export {
  getNotificationState,
  resetNotificationState,
  setNotificationState,
  subscribeNotificationStore,
};
