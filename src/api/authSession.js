import { clearAuthState, setAuthTokens } from "../features/auth/authStore";
import { ApiError, buildApiError } from "./apiError";
import { API_BASE } from "./apiConfig";
import { parseResponseBody } from "./apiResponse";

let refreshPromise = null;

const TERMINAL_AUTH_ERROR_CODES = new Set([
  "INVALID_TOKEN",
  "REFRESH_TOKEN_EXPIRED",
  "SESSION_NOT_FOUND",
  "SESSION_EXPIRED",
]);

const clearAuthenticatedSession = () => {
  clearAuthState();
};

const isTerminalAuthError = (error) => {
  if (!(error instanceof ApiError)) {
    return false;
  }

  return TERMINAL_AUTH_ERROR_CODES.has(error.code);
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

      if (
        response.status === 401 ||
        response.status === 403 ||
        isTerminalAuthError(error)
      ) {
        clearAuthenticatedSession();
      }

      throw error;
    }

    const authData = data?.data ?? null;

    setAuthTokens({
      accessToken: authData?.accessToken,
      refreshToken: authData?.refreshToken,
      accessTokenExpiresIn: authData?.accessTokenExpiresIn,
      refreshTokenExpiresIn: authData?.refreshTokenExpiresIn,
    });

    return authData;
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
};

export { clearAuthenticatedSession, isTerminalAuthError, refreshAccessToken };
