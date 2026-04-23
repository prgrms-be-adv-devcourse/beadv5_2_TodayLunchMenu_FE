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

export {
  executePartialSettlementApi,
  getPartialSettlementAvailableItemsApi,
};
