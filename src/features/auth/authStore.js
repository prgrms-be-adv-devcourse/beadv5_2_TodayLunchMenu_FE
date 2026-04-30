const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const ACCESS_TOKEN_EXPIRES_AT_KEY = "accessTokenExpiresAt";
const REFRESH_TOKEN_EXPIRES_AT_KEY = "refreshTokenExpiresAt";

const hasAccessToken = () => Boolean(localStorage.getItem(ACCESS_TOKEN_KEY));

// 초기 인증 상태
let authState = {
  user: null,
  isAuthenticated: hasAccessToken(),
  loading: hasAccessToken(),
};

const listeners = new Set();

const emitChange = () => {
  listeners.forEach((listener) => listener());
};

const getAuthState = () => authState;

const subscribeAuthStore = (listener) => {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
};

const setAuthState = (updater) => {
  authState =
    typeof updater === "function"
      ? updater(authState)
      : { ...authState, ...updater };

  emitChange();
};

const setAuthTokens = ({
  accessToken,
  refreshToken,
  accessTokenExpiresIn,
  refreshTokenExpiresIn,
}) => {
  if (accessToken) {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  }

  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }

  if (Number.isFinite(accessTokenExpiresIn) && accessTokenExpiresIn > 0) {
    localStorage.setItem(
      ACCESS_TOKEN_EXPIRES_AT_KEY,
      String(Date.now() + accessTokenExpiresIn),
    );
  }

  if (Number.isFinite(refreshTokenExpiresIn) && refreshTokenExpiresIn > 0) {
    localStorage.setItem(
      REFRESH_TOKEN_EXPIRES_AT_KEY,
      String(Date.now() + refreshTokenExpiresIn),
    );
  }
};

const clearAuthState = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(ACCESS_TOKEN_EXPIRES_AT_KEY);
  localStorage.removeItem(REFRESH_TOKEN_EXPIRES_AT_KEY);

  authState = {
    user: null,
    isAuthenticated: false,
    loading: false,
  };

  emitChange();
};

export {
  ACCESS_TOKEN_EXPIRES_AT_KEY,
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_EXPIRES_AT_KEY,
  REFRESH_TOKEN_KEY,
  clearAuthState,
  getAuthState,
  setAuthState,
  setAuthTokens,
  subscribeAuthStore,
};
