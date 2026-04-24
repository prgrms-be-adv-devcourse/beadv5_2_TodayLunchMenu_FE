import { apiClient } from "../../api/client";

function getApiPayload(data) {
  return data?.data ?? data;
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
    body: {
      auctionId: payload.auctionId,
      productId: payload.productId,
      currentBidPrice: payload.currentBidPrice,
      startPrice: payload.startPrice,
      productName: payload.productName,
      bidCount: payload.bidCount,
      remainingSeconds: payload.remainingSeconds,
    },
    timeout: 20000,
  });

  return toUiAuctionPriceRecommendation(getApiPayload(response.data));
}

export { recommendAuctionBidPriceApi };
