import { apiClient } from "../../api/client";

function toUiOrder(order) {
  return {
    orderId: order?.orderId,
    orderNumber: order?.orderNumber ?? null,
    totalPrice: order?.totalPrice ?? 0,
    status: order?.status ?? "PENDING",
    createdAt: order?.createdAt ?? null,
  };
}

function toUiOrderSummary(order) {
  return {
    orderId: order?.orderId,
    orderNumber: order?.orderNumber ?? "",
    totalAmount: order?.totalPrice ?? 0,
    status: order?.status ?? "CREATED",
    orderType: order?.orderType ?? "NORMAL",
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
    orderItemId: item?.orderItemId,
    productId: item?.productId,
    productName: item?.productName ?? "상품명 없음",
    unitPrice,
    quantity,
    status: item?.status ?? "UNKNOWN",
    thumbnailKey: item?.thumbnailKey ?? "",
    totalPrice: Number(unitPrice) * Number(quantity),
    deliveryId: item?.deliveryId ?? null,
  };
}

function toUiOrderDetail(order) {
  const items = Array.isArray(order?.items)
    ? order.items.map(toUiOrderItem)
    : [];
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
    status: order?.status ?? "UNKNOWN",
    items,
    deliveryMemo: order?.deliveryMemo ?? null,
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

async function getOrdersApi({ startDate, endDate } = {}) {
  const params = {};
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;

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

async function cancelOrderApi(orderId, { items, requesterType = "BUYER" }) {
  const response = await apiClient(`/api/orders/${orderId}/cancel`, {
    method: "POST",
    body: {
      items: Array.isArray(items)
        ? items.map((item) => ({
            orderItemId: item.orderItemId,
            reason: item.reason,
            detailReason: item.detailReason ?? null,
          }))
        : [],
      requesterType,
    },
  });

  const payload = response.data?.data ?? response.data;
  return {
    orderId: payload?.orderId,
    refundedAmount: payload?.refundedAmount ?? 0,
    canceledItemCount: payload?.canceledItemCount ?? 0,
    returnRequestedItemCount: payload?.returnRequestedItemCount ?? 0,
    processedAt: payload?.processedAt ?? null,
  };
}

async function getDeliveryTrackingApi(deliveryId) {
  const response = await apiClient(`/api/deliveries/${deliveryId}/tracking`, {
    method: "GET",
  });

  const payload = response.data?.data ?? response.data;
  return {
    courierCode: payload?.courierCode ?? "",
    invoiceNumber: payload?.invoiceNumber ?? "",
    delivered: payload?.delivered ?? false,
    details: Array.isArray(payload?.details)
      ? payload.details.map((d) => ({
          time: d?.time ?? "",
          location: d?.location ?? "",
          status: d?.status ?? "",
        }))
      : [],
  };
}

async function confirmOrderItemApi(orderId, orderItemId) {
  const response = await apiClient(`/api/orders/${orderId}/items/${orderItemId}/confirm`, {
    method: "POST",
  });

  return response.data?.data ?? response.data;
}

async function getOrderPaymentApi(orderId) {
  const response = await apiClient(`/api/payments/orders/${orderId}`, {
    method: "GET",
  });
  const payload = response.data?.data ?? response.data;
  return {
    paymentMethod: payload?.paymentMethod ?? null,
    paymentStatus: payload?.paymentStatus ?? null,
    totalAmount: payload?.totalAmount ?? null,
    paidAt: payload?.paidAt ?? null,
  };
}

async function confirmOrderApi(orderId) {
  const response = await apiClient(`/api/orders/${orderId}/confirm`, {
    method: "POST",
  });

  return response.data?.data ?? response.data;
}

async function acceptAuctionOrderApi({ orderId, method, address, addressDetail, zipCode, receiver, receiverPhone }) {
  const endpoint = method === "DEPOSIT" ? "/api/orders/auction/deposit" : "/api/orders/auction/pg";
  const response = await apiClient(endpoint, {
    method: "POST",
    body: { orderId, address, addressDetail, zipCode, receiver, receiverPhone },
  });
  return response.data?.data ?? response.data;
}

export { acceptAuctionOrderApi, cancelOrderApi, confirmOrderApi, confirmOrderItemApi, createOrderApi, getDeliveryTrackingApi, getOrderDetailApi, getOrderPaymentApi, getOrdersApi };
