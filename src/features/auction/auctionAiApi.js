import { ApiError, apiClient } from "../../api/client";

function getApiPayload(body) {
  if (body && typeof body === "object" && "success" in body) {
    if (body.success === false) {
      throw new ApiError({
        status: 200,
        code: body?.error?.code || "REQUEST_FAILED",
        message: body?.error?.message || "AI 추천 요청에 실패했습니다.",
        data: body,
      });
    }

    return body?.data ?? null;
  }

  return body;
}

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function toUiAuctionPriceRecommendation(result) {
  return {
    expectedFinalPrice: toNumber(result?.expectedFinalPrice),
    recommendedBidPrice: toNumber(result?.recommendedBidPrice),
    priceReason: result?.priceReason ?? "",
    notes: result?.notes ?? "",
  };
}

async function recommendAuctionBidPriceApi(payload) {
  const response = await apiClient("/api/ai/auction-price-recommendation", {
    method: "POST",
    body: payload,
    timeout: 20000,
  });

  return toUiAuctionPriceRecommendation(getApiPayload(response.data));
}

export { recommendAuctionBidPriceApi };
