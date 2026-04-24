import { apiClient } from "../../api/client";

const unwrapResponse = (response) => response?.data?.data ?? null;

const API_BASE = import.meta.env.VITE_SERVER_URL ?? "";

async function fetchKakaoAuthorizeUrlApi() {
  const response = await apiClient("/api/auth/oauth/kakao/authorize");
  return unwrapResponse(response);
}

async function fetchKakaoLinkAuthorizeUrlApi() {
  const response = await apiClient("/api/auth/oauth/kakao/link/authorize-url");
  return unwrapResponse(response);
}

async function fetchKakaoOAuthResultApi({ resultKey }) {
  const response = await apiClient("/api/auth/oauth/kakao/result", {
    params: { resultKey },
  });

  return unwrapResponse(response);
}

async function loginApi({ email, password }) {
  const response = await apiClient("/api/auth/login", {
    method: "POST",
    body: { email, password },
  });

  return unwrapResponse(response);
}

async function signupApi({
  email,
  password,
  nickname,
  phone = null,
  address = null,
  profileImageKey = null,
  role = "USER",
}) {
  const response = await apiClient("/api/auth", {
    method: "POST",
    body: {
      email,
      password,
      nickname,
      phone,
      address,
      profileImageKey,
      role,
    },
  });

  return unwrapResponse(response);
}

async function sendEmailVerificationApi({ email }) {
  const response = await apiClient("/api/auth/email-verifications", {
    method: "POST",
    body: { email },
  });

  return unwrapResponse(response);
}

async function confirmEmailVerificationApi({ token }) {
  const response = await apiClient("/api/auth/email-verifications/confirm", {
    method: "POST",
    body: { token },
  });

  return unwrapResponse(response);
}

async function getMyInfoApi() {
  const response = await apiClient("/api/members/me");

  return unwrapResponse(response);
}

async function logoutApi(memberId) {
  if (!memberId) {
    return null;
  }

  const response = await apiClient(`/api/auth/logout/${memberId}`, {
    method: "POST",
  });

  return unwrapResponse(response);
}

async function linkKakaoAccountApi({ linkToken }) {
  const response = await apiClient("/api/auth/oauth/kakao/link", {
    method: "POST",
    body: { linkToken },
  });

  return unwrapResponse(response);
}

export {
  confirmEmailVerificationApi,
  fetchKakaoAuthorizeUrlApi,
  fetchKakaoLinkAuthorizeUrlApi,
  fetchKakaoOAuthResultApi,
  getMyInfoApi,
  linkKakaoAccountApi,
  loginApi,
  logoutApi,
  sendEmailVerificationApi,
  signupApi,
};
