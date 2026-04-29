import { apiClient } from "../../api/client";

function toUiDelivery(d) {
  return {
    deliveryId: d?.deliveryId,
    orderId: d?.orderId ?? null,
    orderNumber: d?.orderNumber ?? null,
    productName: d?.productName ?? "상품명 없음",
    quantity: d?.quantity ?? 1,
    status: d?.status ?? "PREPARING",
    courierCode: d?.courierCode ?? null,
    courierName: d?.courierName ?? null,
    invoiceNumber: d?.invoiceNumber ?? null,
    receiver: d?.receiver ?? null,
    receiverPhone: d?.receiverPhone ?? null,
    address: d?.address ?? null,
    addressDetail: d?.addressDetail ?? null,
    zipCode: d?.zipCode ?? null,
    shippedAt: d?.shippedAt ?? null,
    deliveredAt: d?.deliveredAt ?? null,
    createdAt: d?.createdAt ?? null,
  };
}

async function getSellerDeliveriesApi({
  status,
  orderNumber,
  receiver,
  productName,
  courierName,
  dateFrom,
  dateTo,
  page = 0,
  size = 20,
} = {}) {
  const params = new URLSearchParams({ page, size, sort: "createdAt,desc" });
  if (status && status !== "ALL") params.set("status", status);
  if (orderNumber?.trim()) params.set("orderNumber", orderNumber.trim());
  if (receiver?.trim()) params.set("receiver", receiver.trim());
  if (productName?.trim()) params.set("productName", productName.trim());
  if (courierName && courierName !== "ALL") params.set("courierName", courierName);
  if (dateFrom) params.set("dateFrom", dateFrom);
  if (dateTo) params.set("dateTo", dateTo);

  const response = await apiClient(`/api/deliveries/seller?${params}`, { method: "GET" });
  const payload = response.data?.data ?? response.data;
  const content = Array.isArray(payload?.content) ? payload.content : [];
  return {
    content: content.map(toUiDelivery),
    totalElements: payload?.totalElements ?? content.length,
    totalPages: payload?.totalPages ?? 1,
    number: payload?.number ?? 0,
  };
}

async function getSellerDeliveryCountsApi() {
  const response = await apiClient("/api/deliveries/seller/counts", { method: "GET" });
  return response.data?.data ?? response.data;
}

async function shipDeliveryApi(deliveryId, { courier, invoiceNumber }) {
  const response = await apiClient(`/api/deliveries/${deliveryId}/ship`, {
    method: "POST",
    body: { courier, invoiceNumber },
  });
  return response.data?.data ?? response.data;
}

export { getSellerDeliveriesApi, getSellerDeliveryCountsApi, shipDeliveryApi };
