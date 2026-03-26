// authStore.js : 인증 상태 관리를 위한 간단한 스토어 구현(외부 store, 프론트엔드 메모리 상태)
const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";

// 초기 인증 상태
let authState = {
  user: null,
  isAuthenticated: Boolean(localStorage.getItem(ACCESS_TOKEN_KEY)),
  loading: false,
};

// 구독자 관리 : 인증 상태 변경을 구독하는 리스너들을 관리하는 Set
const listeners = new Set();

// 변경 알림 함수 : 인증 상태가 변경될 때 구독자들에게 알리는 함수
const emitChange = () => {
  listeners.forEach((listener) => listener());
};

// 현재 인증 상태를 반환하는 함수
const getAuthState = () => authState;

// 구독 함수 : 외부에서 인증 상태 변경을 구독할 수 있도록 하는 함수
const subscribeAuthStore = (listener) => {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
};

// 상태 업데이트 함수 : authState를 업데이트하고 변경을 알리는 함수
const setAuthState = (updater) => {
  authState =
    typeof updater === "function"
      ? updater(authState)
      : { ...authState, ...updater };

  emitChange();
};

//  토큰 저장 함수 : 로그인 성공 시 토큰을 로컬 스토리지에 저장
const setAuthTokens = ({ accessToken, refreshToken }) => {
  if (accessToken) {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  }

  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
};

// 인증 상태 초기화 함수 : 토큰을 제거하고 인증 상태를 초기화
const clearAuthState = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);

  authState = {
    user: null,
    isAuthenticated: false,
    loading: false,
  };

  emitChange();
};

export {
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  clearAuthState,
  getAuthState,
  setAuthState,
  setAuthTokens,
  subscribeAuthStore,
};
