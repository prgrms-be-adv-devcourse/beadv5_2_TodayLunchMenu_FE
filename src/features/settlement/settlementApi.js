import { apiClient } from "../../api/client";

function getApiPayload(data) {
  return data?.data ?? data;
}

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function toUiPartialSettlementItem(item) {
  return {
    settlementItemId: item?.settlementItemId ?? null,
    escrowId: item?.escrowId ?? null,
    orderId: item?.orderId ?? null,
    grossAmount: toNumber(item?.grossAmount),
    feeAmount: toNumber(item?.feeAmount),
    netAmount: toNumber(item?.netAmount),
    releasedAt: item?.releasedAt ?? null,
  };
}

function toUiPartialSettlementExecution(result) {
  return {
    settlementId: result?.settlementId ?? null,
    sellerId: result?.sellerId ?? null,
    settlementType: result?.settlementType ?? "PARTIAL",
    settlementStatus: result?.settlementStatus ?? "PROCESSING",
    settlementItemCount: toNumber(result?.settlementItemCount),
    totalSalesAmount: toNumber(result?.totalSalesAmount),
    feeAmount: toNumber(result?.feeAmount),
    finalSettlementAmount: toNumber(result?.finalSettlementAmount),
  };
}

function toUiSellerSettlement(item) {
  return {
    settlementId: item?.settlementId ?? null,
    sellerId: item?.sellerId ?? null,
    settlementType: item?.settlementType ?? "MONTHLY",
    settlementYear: toNumber(item?.settlementYear, null),
    settlementMonth: toNumber(item?.settlementMonth, null),
    totalSalesAmount: toNumber(item?.totalSalesAmount),
    feeAmount: toNumber(item?.feeAmount),
    finalSettlementAmount: toNumber(item?.finalSettlementAmount),
    settledAmount: toNumber(item?.settledAmount),
    settlementStatus: item?.settlementStatus ?? "PENDING",
    settledAt: item?.settledAt ?? null,
    lastFailureReason: item?.lastFailureReason ?? null,
    requestedAt: item?.requestedAt ?? null,
    updatedAt: item?.updatedAt ?? null,
  };
}

function toPagedResult(page, mapper) {
  const items = Array.isArray(page?.items) ? page.items : [];

  return {
    items: items.map(mapper),
    page: page?.page ?? 0,
    size: page?.size ?? items.length,
    totalElements: page?.totalElements ?? items.length,
    totalPages: page?.totalPages ?? 1,
    hasNext: page?.hasNext ?? false,
  };
}

async function getPartialSettlementAvailableItemsApi() {
  const response = await apiClient(
    "/api/settlements/seller/partial-settlements/available",
    {
      method: "GET",
    }
  );

  const items = getApiPayload(response.data);
  return Array.isArray(items) ? items.map(toUiPartialSettlementItem) : [];
}

async function executePartialSettlementApi(settlementItemIds) {
  const response = await apiClient("/api/settlements/seller/partial-settlements", {
    method: "POST",
    body: {
      settlementItemIds,
    },
  });

  return toUiPartialSettlementExecution(getApiPayload(response.data));
}

async function getSellerSettlementsApi(params = {}) {
  const response = await apiClient("/api/settlements/seller", {
    method: "GET",
    params,
  });

  return toPagedResult(getApiPayload(response.data), toUiSellerSettlement);
}

export {
  executePartialSettlementApi,
  getPartialSettlementAvailableItemsApi,
  getSellerSettlementsApi,
};
