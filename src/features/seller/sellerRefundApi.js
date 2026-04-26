import { apiClient, ApiError } from "../../api/client";

/**
 * Seller가 환불 대기 중인 반품 목록 조회
 * 반품이 도착하고 seller가 "수령 완료"를 할 준비된 항목들
 */
export async function getSellerRefundPendingListApi(sellerId, params = {}) {
  try {
    const queryParams = new URLSearchParams();
    if (params.page !== undefined) queryParams.append("page", params.page);
    if (params.size !== undefined) queryParams.append("size", params.size);
    if (params.status) queryParams.append("status", params.status);
    if (params.search) queryParams.append("search", params.search);

    const url = `/api/seller/refunds/pending${
      queryParams.toString() ? `?${queryParams}` : ""
    }`;

    const response = await apiClient(url);
    if (response.data && typeof response.data === "object") {
      return response.data;
    }
    return response;
  } catch (error) {
    console.error("Failed to fetch seller refund pending list:", error);
    throw new ApiError(
      error.status || 500,
      error.message || "환불 대기 목록 조회 실패"
    );
  }
}

/**
 * Seller가 환불 확인 - 반품을 수령했으므로 환불 처리를 요청
 * POST /api/payments/seller/refunds/confirm
 */
export async function confirmSellerRefundApi(refundRequest) {
  try {
    const response = await apiClient("/api/payments/seller/refunds/confirm", {
      method: "POST",
      body: JSON.stringify(refundRequest),
    });

    if (response.data && typeof response.data === "object") {
      return response.data;
    }
    return response;
  } catch (error) {
    console.error("Failed to confirm seller refund:", error);
    throw new ApiError(
      error.status || 500,
      error.message || "환불 확인 실패"
    );
  }
}

/**
 * 특정 order의 반품 상세 정보 조회
 */
export async function getRefundDetailApi(orderId, orderCancelRequestId) {
  try {
    const url = `/api/seller/refunds/${orderId}/${orderCancelRequestId}`;
    const response = await apiClient(url);

    if (response.data && typeof response.data === "object") {
      return response.data;
    }
    return response;
  } catch (error) {
    console.error("Failed to fetch refund detail:", error);
    throw new ApiError(
      error.status || 500,
      error.message || "환불 상세 조회 실패"
    );
  }
}

/**
 * 환불 취소 (필요시)
 */
export async function cancelRefundApi(orderId, orderCancelRequestId) {
  try {
    const url = `/api/seller/refunds/${orderId}/${orderCancelRequestId}/cancel`;
    const response = await apiClient(url, {
      method: "POST",
      body: JSON.stringify({}),
    });

    if (response.data && typeof response.data === "object") {
      return response.data;
    }
    return response;
  } catch (error) {
    console.error("Failed to cancel refund:", error);
    throw new ApiError(
      error.status || 500,
      error.message || "환불 취소 실패"
    );
  }
}
