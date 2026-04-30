import { buildApiError, buildNetworkError, ApiError } from "./apiError";
import { API_BASE, defaultOptions } from "./apiConfig";
import { parseResponseBody } from "./apiResponse";
import { clearAuthenticatedSession, refreshAccessToken } from "./authSession";

const apiClient = async (
  url,
  {
    method = "GET",
    headers = {},
    body,
    params,
    timeout = defaultOptions.timeout,
  } = {},
  retry = defaultOptions.retry
) => {
  const accessToken = localStorage.getItem("accessToken");
  const normalizedMethod = method.toUpperCase();

  const hasBody =
    body !== undefined &&
    body !== null &&
    normalizedMethod !== "GET" &&
    normalizedMethod !== "HEAD";

  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  const queryString = params
    ? `?${new URLSearchParams(params).toString()}`
    : "";

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  let response;

  try {
    response = await fetch(`${API_BASE}${url}${queryString}`, {
      method: normalizedMethod,
      headers: {
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        ...(!isFormData && hasBody ? { "Content-Type": "application/json" } : {}),
        ...headers,
      },
      body: hasBody ? (isFormData ? body : JSON.stringify(body)) : undefined,
      signal: controller.signal,
      credentials: "include",
    });
  } catch (error) {
    clearTimeout(timer);
    throw buildNetworkError(error);
  }

  clearTimeout(timer);

  const data = await parseResponseBody(response);

  if (!response.ok) {
    const error = buildApiError({ response, data });
    const isRefreshRequest = url === "/api/auth/refresh";

    if (response.status === 401 && error.code === "TOKEN_EXPIRED" && !retry && !isRefreshRequest) {
      try {
        await refreshAccessToken();

        return apiClient(
          url,
          {
            method: normalizedMethod,
            headers,
            body,
            params,
            timeout,
          },
          true
        );
      } catch (refreshError) {
        clearAuthenticatedSession();
        throw refreshError;
      }
    }

    if (response.status === 401 && (error.code === "INVALID_TOKEN" || error.code === "UNAUTHORIZED")) {
      clearAuthenticatedSession();
    }

    throw error;
  }

  return {
    status: response.status,
    headers: response.headers,
    data,
  };
};

export { ApiError, apiClient };
