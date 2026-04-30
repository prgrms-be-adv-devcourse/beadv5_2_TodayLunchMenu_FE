// useAuth.js : 인증 상태와 관련된 로직을 제공하는 커스텀 훅
import { useEffect, useSyncExternalStore } from "react";
import { getMyInfoApi, loginApi, logoutApi } from "./authApi";
import {
  clearAuthState,
  getAuthState,
  setAuthState,
  setAuthTokens,
  subscribeAuthStore,
} from "./authStore";

let initializePromise = null;

// 인증 상태 초기화 함수 : 토큰이 존재하면 사용자 정보를 가져와 인증 상태를 초기화
async function initializeAuth() {
  const currentState = getAuthState(); // user, isAuthenticated, loading
  const hasAccessToken = Boolean(localStorage.getItem("accessToken"));

  if (!hasAccessToken) {
    if (currentState.loading) {
      setAuthState({ loading: false });
    }
    return null;
  }

  // 이미 초기화 중인 경우 기존 Promise 반환
  if (initializePromise) {
    return initializePromise;
  }

  initializePromise = (async () => {
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
    } finally {
      initializePromise = null;
    }
  })();

  return initializePromise;
}

// 로그인 함수
async function login({ email, password }) {
  setAuthState((prev) => ({ ...prev, loading: true }));

  try {
    const authData = await loginApi({ email, password });

    setAuthTokens({
      accessToken: authData?.accessToken,
      refreshToken: authData?.refreshToken,
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

// 사용자 정보 새로고침 함수 : 토큰이 유효한지 확인하고 사용자 정보를 새로고침 (판매자 등록 후 사용자 정보 업데이트 등에 사용)
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

// 로그아웃 함수
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

// useAuth 훅 : 인증 상태와 관련된 로직을 제공
function useAuth() {
  const authState = useSyncExternalStore(
    subscribeAuthStore, // 구독 함수 (데이터가 변했을 때 실행할 콜백을 등록하는 함수)
    getAuthState, // 현재 상태를 반환하는 함수 (현재 외부 저장소의 최신 값을 반환하는 함수)
  );

  useEffect(() => {
    const hasAccessToken = Boolean(localStorage.getItem("accessToken"));

    if (hasAccessToken && !authState.user) {
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
