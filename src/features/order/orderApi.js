import { apiClient } from "../../api/client";

function toUiOrder(order) {
  return {
    orderId: order?.orderId,
    totalPrice: order?.totalPrice ?? 0,
    status: order?.status ?? "PENDING",
    createdAt: order?.createdAt ?? null,
  };
}

function toUiOrderSummary(order) {
  return {
    orderId: order?.orderId,
    totalAmount: order?.totalPrice ?? 0,
    status: order?.status ?? "CREATED",
    createdAt: order?.createdAt ?? null,
    representativeProductName:
      order?.representativeProductName ?? "상품명 없음",
    representativeThumbnailKey: order?.representativeThumbnailKey ?? "",
    itemCount: order?.itemCount ?? 0,
  };
}

function toUiOrderItem(item) {
  const unitPrice = item?.unitPrice ?? 0;
  const quantity = item?.quantity ?? 0;

  return {
    productId: item?.productId,
    productName: item?.productName ?? "상품명 없음",
    unitPrice,
    quantity,
    status: item?.status ?? "UNKNOWN",
    thumbnailKey: item?.thumbnailKey ?? "",
    totalPrice: Number(unitPrice) * Number(quantity),
  };
}

function toUiOrderDetail(order) {
  const items = Array.isArray(order?.items)
    ? order.items.map(toUiOrderItem)
    : [];
  const itemStatuses = items.map((item) => item.status).filter(Boolean);
  const firstStatus = itemStatuses[0] ?? "UNKNOWN";
  const hasMixedStatuses = itemStatuses.some((status) => status !== firstStatus);
  const totalFromItems = items.reduce(
    (sum, item) => sum + Number(item.totalPrice ?? 0),
    0
  );

  return {
    orderId: order?.orderId,
    totalPrice: order?.totalPrice ?? totalFromItems,
    createdAt: order?.createdAt ?? null,
    address: order?.address ?? "",
    addressDetail: order?.addressDetail ?? "",
    zipCode: order?.zipCode ?? "",
    receiver: order?.receiver ?? "",
    receiverPhone: order?.receiverPhone ?? "",
    itemCount: order?.itemCount ?? items.length,
    items,
    status: hasMixedStatuses ? "MIXED" : firstStatus,
    hasMixedStatuses,
  };
}

async function createOrderApi({
  address,
  addressDetail,
  zipCode,
  receiver,
  receiverPhone,
  items,
}) {
  const response = await apiClient("/api/orders/deposit", {
    method: "POST",
    body: {
      address,
      addressDetail,
      zipCode,
      receiver,
      receiverPhone,
      orderItemRequest: items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
    },
  });

  return toUiOrder(response.data?.data ?? response.data);
}

async function getOrdersApi(params = {}) {
  const response = await apiClient("/api/orders", {
    method: "GET",
    params,
  });

  const page = response.data?.content ? response.data : response.data?.data;
  const content = Array.isArray(page?.content) ? page.content : [];

  return {
    content: content.map(toUiOrderSummary),
    totalElements: page?.totalElements ?? content.length,
    totalPages: page?.totalPages ?? 1,
    number: page?.number ?? 0,
    size: page?.size ?? content.length,
    first: page?.first ?? true,
    last: page?.last ?? true,
  };
}

async function getOrderDetailApi(orderId) {
  const response = await apiClient(`/api/orders/${orderId}`, {
    method: "GET",
  });

  const payload = response.data?.data ?? response.data;
  return toUiOrderDetail(payload);
}

async function cancelOrderApi(orderId, { reason, detailReason }) {
  const response = await apiClient(`/api/orders/${orderId}/cancel`, {
    method: "POST",
    body: {
      reason,
      detailReason: detailReason ?? null,
      requesterType: "BUYER",
    },
  });

  const payload = response.data?.data ?? response.data;
  return {
    orderId: payload?.orderId,
    refundedAmount: payload?.refundedAmount ?? 0,
    canceledAt: payload?.canceledAt ?? null,
  };
}

export { cancelOrderApi, createOrderApi, getOrderDetailApi, getOrdersApi };
