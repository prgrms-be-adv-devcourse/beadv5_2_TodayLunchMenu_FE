import { apiClient } from "../../api/client";

const unwrapResponse = (response) => response?.data?.data ?? null;

async function getNotificationsApi({ page = 0, size = 20 } = {}) {
  const response = await apiClient("/api/notifications", {
    params: { page, size },
  });

  return unwrapResponse(response);
}

async function markNotificationReadApi(notificationId) {
  if (!notificationId) {
    throw new Error("notificationId is required.");
  }

  const response = await apiClient(`/api/notifications/${notificationId}/read`, {
    method: "PATCH",
  });

  return unwrapResponse(response);
}

export { getNotificationsApi, markNotificationReadApi };
