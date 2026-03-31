import { apiClient } from "../../api/client";

const unwrapResponse = (response) => response?.data?.data ?? null;

async function loginApi({ email, password }) {
  const response = await apiClient("/api/v1/auth/login", {
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
  const response = await apiClient("/api/v1/auth", {
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

async function getMyInfoApi() {
  const response = await apiClient("/api/members/me");

  return unwrapResponse(response);
}

async function logoutApi(memberId) {
  if (!memberId) {
    return null;
  }

  const response = await apiClient(`/api/v1/auth/logout/${memberId}`, {
    method: "POST",
  });

  return unwrapResponse(response);
}

export { getMyInfoApi, loginApi, logoutApi, signupApi };
