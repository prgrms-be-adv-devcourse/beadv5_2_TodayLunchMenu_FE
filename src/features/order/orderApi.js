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
    representativeProductName: order?.representativeProductName ?? "상품명 없음",
    representativeThumbnailKey: order?.representativeThumbnailKey ?? "",
    itemCount: order?.itemCount ?? 0,
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

  return toUiOrder(response.data);
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

export { createOrderApi, getOrdersApi };