import { apiClient, ApiError } from "../../api/client";

function adaptReturnRequest(be) {
  if (!be) return null;
  const quantity = Number(be.quantity ?? 1) || 1;
  const refundable = Number(be.refundableAmount ?? 0);
  const unitPrice = quantity > 0 ? refundable / quantity : refundable;
  const fullReason = be.detailReason
    ? `${be.reason || ""} - ${be.detailReason}`.trim()
    : be.reason || "";

  return {
    returnRequestId: be.returnRequestId,
    orderId: be.orderId,
    buyerName: be.receiver || "구매자",
    status: be.status,
    createdAt: be.requestedAt,
    processedAt: be.processedAt,
    reason: fullReason,
    responsibilityType: be.responsibilityType,
    refundedAmount: be.refundedAmount,
    rejectReason: be.rejectReason,
    items: [
      {
        orderItemId: be.orderItemId,
        productName: be.productName,
        thumbnailKey: be.thumbnailKey,
        quantity,
        price: unitPrice,
      },
    ],
  };
}

/**
 * Seller의 반품 요청 목록 조회 (상태별)
 * GET /api/return-requests/seller?status=...
 *
 * status: "RECEIVED" (검수 대기) | "COMPLETED" (검수 완료) | "FAILED" (거절)
 */
export async function getSellerReturnRequestsApi(params = {}) {
  try {
    const queryParams = new URLSearchParams();
    if (params.status) queryParams.append("status", params.status);
    if (params.page !== undefined) queryParams.append("page", params.page);
    if (params.size !== undefined) queryParams.append("size", params.size);

    const url = `/api/return-requests/seller${
      queryParams.toString() ? `?${queryParams}` : ""
    }`;

    const response = await apiClient(url);
    const payload = response.data?.data ?? response.data ?? response;
    const content = Array.isArray(payload?.content) ? payload.content : Array.isArray(payload) ? payload : [];
    return content.map(adaptReturnRequest).filter(Boolean);
  } catch (error) {
    console.error("Failed to fetch seller return requests:", error);
    throw new ApiError(
      error.status || 500,
      error.message || "반품 목록 조회 실패"
    );
  }
}

/**
 * Seller가 반품 검수 결과 제출 (PASS/FAIL)
 * POST /api/return-requests/{returnRequestId}/inspect
 *
 * payload:
 *   - inspectionResult: "PASS" | "FAIL"
 *   - responsibilityType: "BUYER" | "SELLER" (PASS 시 필수)
 *   - rejectReason: string (FAIL 시 필수)
 */
export async function inspectReturnRequestApi(returnRequestId, payload) {
  try {
    const response = await apiClient(`/api/return-requests/${returnRequestId}/inspect`, {
      method: "POST",
      body: payload,
    });

    return response.data?.data ?? response.data ?? response;
  } catch (error) {
    console.error("Failed to inspect return request:", error);
    throw new ApiError(
      error.status || 500,
      error.message || "반품 검수 실패"
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
