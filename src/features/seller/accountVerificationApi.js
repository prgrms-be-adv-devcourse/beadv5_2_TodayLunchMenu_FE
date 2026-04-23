import { apiClient } from "../../api/client";

const unwrapResponse = (response) => response?.data?.data ?? null;

async function getCurrentAccountVerificationApi() {
  const response = await apiClient("/api/members/me/account-verifications/current", {
    method: "GET",
  });

  return unwrapResponse(response);
}

async function confirmAccountVerificationApi({ sessionId, code }) {
  const response = await apiClient(
    `/api/members/me/account-verifications/${sessionId}/confirm`,
    {
      method: "POST",
      body: { code },
    }
  );

  return unwrapResponse(response);
}

async function resendAccountVerificationApi(sessionId) {
  const response = await apiClient(
    `/api/members/me/account-verifications/${sessionId}/resend`,
    {
      method: "POST",
    }
  );

  return unwrapResponse(response);
}

async function cancelAccountVerificationApi(sessionId) {
  const response = await apiClient(
    `/api/members/me/account-verifications/${sessionId}/cancel`,
    {
      method: "POST",
    }
  );

  return unwrapResponse(response);
}

export {
  cancelAccountVerificationApi,
  confirmAccountVerificationApi,
  getCurrentAccountVerificationApi,
  resendAccountVerificationApi,
};
