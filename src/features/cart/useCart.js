import { useEffect, useSyncExternalStore } from "react";
import { getProductDetailApi } from "../product/productApi";
import {
  addCartItemApi,
  clearCartApi,
  deleteCartItemsApi,
  getCartApi,
  updateCartItemApi,
} from "./cartApi";
import {
  clearCartState,
  getCartState,
  setCartState,
  subscribeCartStore,
} from "./cartStore";

let initializePromise = null;

function createFallbackProduct(productId) {
  return {
    id: productId,
    name: "상품 정보를 불러올 수 없습니다.",
    description: "상품 정보를 다시 확인해 주세요.",
    price: 0,
    stockCount: 0,
    status: "UNKNOWN",
    createdAt: null,
    categoryId: null,
    category: "알 수 없음",
    image: null,
    badge: null,
    images: [],
  };
}

async function enrichCartItems(items) {
  const detailedItems = await Promise.all(
    items.map(async (item) => {
      try {
        const product = await getProductDetailApi(item.productId);

        return {
          cartId: item.cartId,
          productId: item.productId,
          quantity: item.quantity,
          addedAt: item.addedAt,
          product,
        };
      } catch {
        return {
          cartId: item.cartId,
          productId: item.productId,
          quantity: item.quantity,
          addedAt: item.addedAt,
          product: createFallbackProduct(item.productId),
        };
      }
    }),
  );

  return detailedItems.map((item) => ({
    cartId: item.cartId,
    productId: item.productId,
    quantity: item.quantity,
    addedAt: item.addedAt,
    name: item.product.name,
    description: item.product.description,
    price: item.product.price,
    image: item.product.image,
    status: item.product.status,
    stockCount: item.product.stockCount,
    category: item.product.category,
  }));
}

function buildCartModel(cart, items) {
  return {
    memberId: cart.memberId,
    itemCount: cart.itemCount ?? items.length,
    items,
    loading: false,
    error: null,
    initialized: true,
  };
}

function isSoldOut(item) {
  return item.status === "SOLD_OUT" || item.stockCount <= 0;
}

function calculateSummary(items) {
  const availableItems = items.filter((item) => !isSoldOut(item));
  const subtotal = availableItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const shippingFee = subtotal >= 30000 || subtotal === 0 ? 0 : 3000;
  const total = subtotal + shippingFee;

  return {
    subtotal,
    shippingFee,
    total,
    availableCount: availableItems.length,
    soldOutCount: items.length - availableItems.length,
  };
}

async function hydrateCart(nextCart) {
  const nextItems = await enrichCartItems(nextCart.items || []);
  return buildCartModel(nextCart, nextItems);
}

async function refreshCart() {
  const hasAccessToken = Boolean(localStorage.getItem("accessToken"));

  if (!hasAccessToken) {
    clearCartState();
    return getCartState();
  }

  if (initializePromise) {
    return initializePromise;
  }

  setCartState((prev) => ({
    ...prev,
    loading: true,
    error: null,
  }));

  initializePromise = (async () => {
    try {
      const nextCart = await getCartApi();
      const hydratedCart = await hydrateCart(nextCart);
      setCartState(hydratedCart);
      return hydratedCart;
    } catch (nextError) {
      setCartState((prev) => ({
        ...prev,
        loading: false,
        error: nextError,
        initialized: true,
      }));
      throw nextError;
    } finally {
      initializePromise = null;
    }
  })();

  return initializePromise;
}

async function addToCart({ productId, quantity = 1 }) {
  const nextCart = await addCartItemApi({ productId, quantity });
  const hydratedCart = await hydrateCart(nextCart);
  setCartState(hydratedCart);
  return hydratedCart;
}

async function updateQuantity(cartId, quantity) {
  const nextCart = await updateCartItemApi(cartId, { quantity });
  const hydratedCart = await hydrateCart(nextCart);
  setCartState(hydratedCart);
  return hydratedCart;
}

async function removeCartItems(cartIds) {
  const nextCart = await deleteCartItemsApi(cartIds);
  const hydratedCart = await hydrateCart(nextCart);
  setCartState(hydratedCart);
  return hydratedCart;
}

async function clearCart() {
  await clearCartApi();
  clearCartState();
  return getCartState();
}

function useCart(options = {}) {
  const { autoLoad = true } = options;
  const cartState = useSyncExternalStore(subscribeCartStore, getCartState);

  useEffect(() => {
    const hasAccessToken = Boolean(localStorage.getItem("accessToken"));

    if (!hasAccessToken) {
      clearCartState();
      return;
    }

    if (autoLoad && !cartState.initialized && !cartState.loading) {
      refreshCart().catch(() => {});
    }
  }, [autoLoad, cartState.initialized, cartState.loading]);

  return {
    cart: cartState,
    cartItems: cartState.items,
    cartCount: cartState.itemCount,
    summary: calculateSummary(cartState.items),
    loading: cartState.loading,
    error: cartState.error,
    refreshCart,
    addToCart,
    updateQuantity,
    removeCartItems,
    clearCart,
  };
}

export { clearCartState, isSoldOut, refreshCart, useCart };
