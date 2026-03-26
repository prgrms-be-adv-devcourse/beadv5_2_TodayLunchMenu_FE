import { apiClient } from "../../api/client";

const unwrapResponse = (response) => response?.data?.data ?? null;

// 로그인
async function loginApi({ email, password }) {
  const response = await apiClient("/api/v1/auth/login", {
    method: "POST",
    body: { email, password },
  });

  return unwrapResponse(response);
}

// 내 정보 조회
async function getMyInfoApi() {
  const response = await apiClient("/api/v1/members/me");

  return unwrapResponse(response);
}

// 로그아웃
async function logoutApi(memberId) {
  if (!memberId) {
    return null;
  }

  const response = await apiClient(`/api/v1/auth/logout/${memberId}`, {
    method: "POST",
  });

  return unwrapResponse(response);
}

export { getMyInfoApi, loginApi, logoutApi };
