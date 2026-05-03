import { useEffect, useSyncExternalStore } from "react";
import { ApiError } from "../../api/apiError";
import { isTerminalAuthError, refreshAccessToken } from "../../api/authSession";
import { getMyInfoApi, loginApi, logoutApi } from "./authApi";
import {
  clearAuthState,
  getAuthState,
  setAuthState,
  setAuthTokens,
  subscribeAuthStore,
} from "./authStore";

let initializePromise = null;

const shouldClearAuthState = (error) => {
  if (isTerminalAuthError(error)) {
    return true;
  }

  return (
    error instanceof ApiError &&
    (error.status === 401 || error.status === 403) &&
    error.code !== "UNAUTHORIZED"
  );
};

async function initializeAuth() {
  const currentState = getAuthState();
  const hasAccessToken = Boolean(localStorage.getItem("accessToken"));
  const hasRefreshToken = Boolean(localStorage.getItem("refreshToken"));

  if (!hasAccessToken && !hasRefreshToken) {
    if (currentState.loading) {
      setAuthState({ loading: false });
    }
    return null;
  }

  if (initializePromise) {
    return initializePromise;
  }

  initializePromise = (async () => {
    setAuthState((prev) => ({ ...prev, loading: true }));

    try {
      if (!hasAccessToken && hasRefreshToken) {
        await refreshAccessToken();
      }

      const user = await getMyInfoApi();

      setAuthState({
        user,
        isAuthenticated: true,
        loading: false,
      });

      return user;
    } catch (error) {
      if (shouldClearAuthState(error)) {
        clearAuthState();
      } else {
        setAuthState((prev) => ({
          ...prev,
          loading: false,
        }));
      }

      throw error;
    } finally {
      initializePromise = null;
    }
  })();

  return initializePromise;
}

async function login({ email, password }) {
  setAuthState((prev) => ({ ...prev, loading: true }));

  try {
    const authData = await loginApi({ email, password });

    setAuthTokens({
      accessToken: authData?.accessToken,
      refreshToken: authData?.refreshToken,
      accessTokenExpiresIn: authData?.accessTokenExpiresIn,
      refreshTokenExpiresIn: authData?.refreshTokenExpiresIn,
    });

    const user = await getMyInfoApi();

    setAuthState({
      user,
      isAuthenticated: true,
      loading: false,
    });

    return user;
  } catch (error) {
    clearAuthState();
    throw error;
  }
}

async function refreshUser() {
  const hasAccessToken = Boolean(localStorage.getItem("accessToken"));

  if (!hasAccessToken) {
    clearAuthState();
    return null;
  }

  setAuthState((prev) => ({ ...prev, loading: true }));

  try {
    const user = await getMyInfoApi();

    setAuthState({
      user,
      isAuthenticated: true,
      loading: false,
    });

    return user;
  } catch (error) {
    clearAuthState();
    throw error;
  }
}

async function logout() {
  const { user } = getAuthState();

  try {
    if (user?.memberId) {
      await logoutApi(user.memberId);
    }
  } finally {
    clearAuthState();
  }
}

function useAuth() {
  const authState = useSyncExternalStore(subscribeAuthStore, getAuthState);

  useEffect(() => {
    const hasAccessToken = Boolean(localStorage.getItem("accessToken"));
    const hasRefreshToken = Boolean(localStorage.getItem("refreshToken"));

    if ((hasAccessToken || hasRefreshToken) && !authState.user) {
      initializeAuth().catch(() => {});
    }
  }, [authState.loading, authState.user]);

  return {
    ...authState,
    initializeAuth,
    login,
    logout,
    refreshUser,
  };
}

export { useAuth };
