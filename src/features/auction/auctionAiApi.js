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
  // TODO: 백엔드 경매 모듈의 공개 API 경로가 확정되면 엔드포인트를 맞춘다.
  // AI 모듈의 /internal/ai/auction-price-recommendation은 경매 모듈 내부 호출용이므로
  // 프론트에서는 AI 서비스가 아니라 경매 모듈 API를 호출한다.
  const response = await apiClient(
    `/api/auctions/${payload.auctionId}/bid-price-recommendation`,
    {
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
    }
  );

  return toUiAuctionPriceRecommendation(getApiPayload(response.data));
}

export { recommendAuctionBidPriceApi };
