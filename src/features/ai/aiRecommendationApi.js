import { apiClient } from "../../api/client";
import { getProductDetailApi } from "../product/productApi";

function getApiPayload(data) {
  return data?.data ?? data;
}

function toUiRecommendation(recommendation) {
  return {
    productId: recommendation?.productId ?? null,
    similarityScore: Number(recommendation?.similarityScore ?? 0),
  };
}

async function getRecommendedProductRefsApi(productId) {
  const response = await apiClient(
    `/api/ai/recommendations/products/${productId}`
  );
  const payload = getApiPayload(response.data);
  const recommendations = Array.isArray(payload) ? payload : [];

  return recommendations.map(toUiRecommendation).filter((item) => item.productId);
}

async function getRecommendedProductsApi(productId) {
  const recommendations = await getRecommendedProductRefsApi(productId);
  const uniqueRecommendations = recommendations
    .filter((item) => item.productId !== productId)
    .filter(
      (item, index, items) =>
        items.findIndex((nextItem) => nextItem.productId === item.productId) ===
        index
    )
    .slice(0, 5);

  const productResults = await Promise.allSettled(
    uniqueRecommendations.map(async (recommendation) => {
      const product = await getProductDetailApi(recommendation.productId);

      return {
        product,
        similarityScore: recommendation.similarityScore,
      };
    })
  );

  return productResults
    .filter((result) => result.status === "fulfilled")
    .map((result) => result.value);
}

async function getMyRecommendedProductRefsApi() {
  const response = await apiClient(`/api/ai/recommendations/me`);
  const payload = getApiPayload(response.data);
  const recommendations = Array.isArray(payload) ? payload : [];

  return recommendations.map(toUiRecommendation).filter((item) => item.productId);
}

async function getMyRecommendedProductsApi() {
  const recommendations = await getMyRecommendedProductRefsApi();

  const productResults = await Promise.allSettled(
    recommendations.map(async (recommendation) => {
      const product = await getProductDetailApi(recommendation.productId);

      return {
        product,
        similarityScore: recommendation.similarityScore,
      };
    })
  );

  return productResults
    .filter((result) => result.status === "fulfilled")
    .map((result) => result.value);
}

export {
  getRecommendedProductRefsApi,
  getRecommendedProductsApi,
  getMyRecommendedProductRefsApi,
  getMyRecommendedProductsApi,
};
