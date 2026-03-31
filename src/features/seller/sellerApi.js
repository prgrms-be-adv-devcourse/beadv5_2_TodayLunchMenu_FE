import { ApiError, apiClient } from "../../api/client";

const unwrapResponse = (response) => response?.data?.data ?? null;

async function registerSellerApi({ bankName, account }) {
  const response = await apiClient("/api/sellers/register", {
    method: "POST",
    body: {
      bankName,
      account,
    },
  });

  return unwrapResponse(response);
}

async function getMySellerInfoApi() {
  try {
    const response = await apiClient("/api/sellers/me");
    return unwrapResponse(response);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }

    throw error;
  }
}

export { getMySellerInfoApi, registerSellerApi };
