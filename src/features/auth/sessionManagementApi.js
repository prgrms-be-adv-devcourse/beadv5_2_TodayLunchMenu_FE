import { apiClient } from "../../api/client";

const unwrapResponse = (response) => response?.data?.data ?? null;

async function fetchMySessionsApi() {
  const response = await apiClient("/api/auth/sessions");
  return unwrapResponse(response);
}

async function logoutCurrentSessionApi() {
  const response = await apiClient("/api/auth/logout/current", {
    method: "POST",
  });

  return unwrapResponse(response);
}

async function logoutAllSessionsApi() {
  const response = await apiClient("/api/auth/logout/all", {
    method: "POST",
  });

  return unwrapResponse(response);
}

async function logoutSessionByIdApi(sessionId) {
  const response = await apiClient(`/api/auth/sessions/${sessionId}`, {
    method: "DELETE",
  });

  return unwrapResponse(response);
}

export {
  fetchMySessionsApi,
  logoutAllSessionsApi,
  logoutCurrentSessionApi,
  logoutSessionByIdApi,
};
