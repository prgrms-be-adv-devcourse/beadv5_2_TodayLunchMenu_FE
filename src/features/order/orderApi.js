import { apiClient } from "../../api/client";

function toUiOrder(order) {
  return {
    orderId: order?.orderId,
    totalPrice: order?.totalPrice ?? 0,
    status: order?.status ?? "PENDING",
    createdAt: order?.createdAt ?? null,
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
  const response = await apiClient("/api/orders", {
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

export { createOrderApi };
