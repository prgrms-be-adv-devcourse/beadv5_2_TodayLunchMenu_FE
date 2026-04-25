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

/**
 * 현재 로그인한 사용자의 장바구니 정보를 가져옵니다.
 * @returns {Promise<Object>} The normalized response for the user's shopping cart.
 */
async function getCartApi() {
  const response = await apiClient("/api/carts");
  return normalizeCartResponse(response.data);
}

/**
 * 장바구니에 아이템을 추가합니다.
 * @param {Object} param0 - 추가할 아이템 정보
 * @param {string} param0.productId - 제품 ID
 * @param {number} param0.quantity - 수량
 * @returns {Promise<Object>} The normalized response for the updated cart.
 */
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

/**
 * 장바구니 아이템을 업데이트합니다.
 * @param {string} cartId - 업데이트할 장바구니 아이템의 ID
 * @param {Object} param1 - 업데이트할 속성들
 * @param {number} param1.quantity - 새로운 수량
 * @returns {Promise<Object>} The normalized response for the updated cart item.
 */
async function updateCartItemApi(cartId, { quantity }) {
  const response = await apiClient(`/api/carts/items/${cartId}`, {
    method: "PATCH",
    body: {
      quantity,
    },
  });

  return normalizeCartResponse(response.data);
}
/**
 * 장바구니에서 특정 아이템들을 삭제합니다.
 * @param {string[]} cartIds - 삭제할 장바구니 아이템들의 ID 배열
 * @returns {Promise<Object>} The normalized response for the updated cart.
 */
async function deleteCartItemsApi(cartIds) {
  const response = await apiClient("/api/carts/items", {
    method: "DELETE",
    body: {
      cartIds: cartIds,
    },
  });

  return normalizeCartResponse(response.data);
}

/**
 * 장바구니 전체를 비웁니다.
 * @returns {Promise<Object>} The normalized response for the cleared cart.
 */
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
