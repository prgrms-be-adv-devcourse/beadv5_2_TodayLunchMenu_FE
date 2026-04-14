import { apiClient } from "../../api/client";

const unwrapResponse = (response) => response?.data?.data ?? null;

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

export {
  confirmEmailVerificationApi,
  getMyInfoApi,
  loginApi,
  logoutApi,
  sendEmailVerificationApi,
  signupApi,
};
