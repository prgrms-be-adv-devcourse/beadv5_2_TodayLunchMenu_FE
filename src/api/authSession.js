import { clearAuthState, setAuthTokens } from "../features/auth/authStore";
import { ApiError, buildApiError } from "./apiError";
import { API_BASE } from "./apiConfig";
import { parseResponseBody } from "./apiResponse";

let refreshPromise = null;

const clearAuthenticatedSession = () => {
  clearAuthState();
};

const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem("refreshToken");

  if (!refreshToken) {
    clearAuthenticatedSession();
    throw new ApiError({
      status: 401,
      code: "UNAUTHORIZED",
      message: "다시 로그인해 주세요.",
    });
  }

  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const response = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
      credentials: "include",
    });

    const data = await parseResponseBody(response);

    if (!response.ok) {
      const error = buildApiError({ response, data });
      clearAuthenticatedSession();
      throw error;
    }

    const authData = data?.data ?? null;

    setAuthTokens({
      accessToken: authData?.accessToken,
      refreshToken: authData?.refreshToken,
    });

    return authData;
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
};

export { clearAuthenticatedSession, refreshAccessToken };
