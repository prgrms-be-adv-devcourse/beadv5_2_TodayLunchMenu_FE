import { apiClient } from "../../api/client";

function normalizeCartResponse(payload) {
  const cart = payload?.data ?? payload ?? {};
  const items = Array.isArray(cart.items) ? cart.items : [];

  return {
    memberId: cart.memberId ?? null,
    itemCount: cart.itemCount ?? items.length,
    items: items.map((item) => ({
      cartId: item.cartId,
      productId: item.productId,
      quantity: item.quantity ?? 0,
      addedAt: item.addedAt ?? null,
    })),
  };
}

async function getCartApi() {
  const response = await apiClient("/api/carts");
  return normalizeCartResponse(response.data);
}

async function addCartItemApi({ productId, quantity }) {
  const response = await apiClient("/api/carts/items", {
    method: "POST",
    body: {
      productId,
      quantity,
    },
  });

  return normalizeCartResponse(response.data);
}

async function updateCartItemApi(cartId, { quantity }) {
  const response = await apiClient(`/api/carts/items/${cartId}`, {
    method: "PATCH",
    body: {
      quantity,
    },
  });

  return normalizeCartResponse(response.data);
}

async function deleteCartItemsApi(cartIds) {
  const response = await apiClient("/api/carts/items", {
    method: "DELETE",
    body: {
      cartItemIds: cartIds,
    },
  });

  return normalizeCartResponse(response.data);
}

async function clearCartApi() {
  await apiClient("/api/carts", {
    method: "DELETE",
  });

  return {
    memberId: null,
    itemCount: 0,
    items: [],
  };
}

export {
  addCartItemApi,
  clearCartApi,
  deleteCartItemsApi,
  getCartApi,
  updateCartItemApi,
};
