import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ConfirmModal from "../../components/common/ConfirmModal";
import { isSoldOut, useCart } from "../../features/cart/useCart";

function formatPrice(value) {
  return new Intl.NumberFormat("ko-KR").format(value);
}

export default function CartPage() {
  const navigate = useNavigate();
  const {
    cartItems,
    summary,
    loading,
    error,
    updateQuantity,
    removeCartItems,
  } = useCart();
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [pendingCartId, setPendingCartId] = useState(null);

  const handleIncrease = async (item) => {
    try {
      setPendingCartId(item.cartId);
      await updateQuantity(item.cartId, item.quantity + 1);
    } finally {
      setPendingCartId(null);
    }
  };

  const handleDecrease = async (item) => {
    if (item.quantity <= 1) return;
    try {
      setPendingCartId(item.cartId);
      await updateQuantity(item.cartId, item.quantity - 1);
    } finally {
      setPendingCartId(null);
    }
  };

  const handleDelete = async (item) => {
    try {
      setPendingCartId(item.cartId);
      await removeCartItems([item.cartId]);
      setDeleteTarget(null);
    } finally {
      setPendingCartId(null);
    }
  };

  const proceedToCheckout = () => {
    if (summary.availableCount === 0) return;
    navigate("/orders/checkout", {
      state: { items: cartItems.filter((item) => !isSoldOut(item)) },
    });
  };

  if (loading) {
    return (
      <div className="py-16 text-center text-sm text-gray-400">
        장바구니를 불러오는 중입니다.
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm font-semibold text-red-600">
          {error.message || "장바구니를 불러오지 못했습니다."}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="pb-32 text-left">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-xl font-black text-gray-900">장바구니</h1>
          <p className="mt-0.5 text-sm text-gray-500">총 {cartItems.length}개 상품</p>
        </div>

        {cartItems.length === 0 ? (
          <div className="border border-gray-200 bg-white py-20 text-center">
            <p className="text-base font-bold text-gray-900">장바구니가 비어 있어요</p>
            <p className="mt-2 text-sm text-gray-500">상품을 담고 다시 찾아와 주세요.</p>
            <button
              type="button"
              onClick={() => navigate("/products")}
              className="mt-6 border border-blue-600 px-6 py-2 text-sm font-bold text-blue-600 transition hover:bg-blue-50"
            >
              상품 보러가기
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Sold-out Cleanup Banner */}
            {summary.soldOutCount > 0 && (
              <div className="flex items-center justify-between border border-red-100 bg-red-50 px-4 py-3">
                <p className="text-sm text-red-700">
                  품절 상품 <span className="font-bold">{summary.soldOutCount}개</span>는 주문에서 제외됩니다.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    const soldOutIds = cartItems
                      .filter((item) => isSoldOut(item))
                      .map((item) => item.cartId);
                    removeCartItems(soldOutIds);
                  }}
                  className="ml-4 shrink-0 border border-red-300 px-3 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-100"
                >
                  품절 상품 모두 삭제
                </button>
              </div>
            )}

            {/* Cart Items */}
            <section className="space-y-2">
              {cartItems.map((item) => {
                const soldOut = isSoldOut(item);
                const isPending = pendingCartId === item.cartId;

                return (
                  <article
                    key={item.cartId}
                    className={[
                      "flex gap-4 border bg-white p-4 transition",
                      soldOut ? "border-gray-100 opacity-60" : "border-gray-200",
                    ].join(" ")}
                  >
                    {/* Image */}
                    <div className="h-20 w-20 flex-shrink-0 overflow-hidden border border-gray-100 bg-gray-50">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-2xl font-black text-gray-300">
                          {(item.name || "P").slice(0, 1).toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex min-w-0 flex-1 flex-col justify-between">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-bold text-gray-900">
                            {item.name}
                          </h3>
                          <p className="mt-0.5 text-xs text-gray-400">{item.category}</p>
                          {soldOut && (
                            <p className="mt-1 text-xs font-semibold text-red-500">품절</p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(item)}
                          disabled={isPending}
                          className="flex-shrink-0 p-1 text-gray-300 transition hover:text-red-400 disabled:opacity-40"
                        >
                          ×
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        {/* Quantity */}
                        <div className="flex items-center border border-gray-200">
                          <button
                            type="button"
                            onClick={() => handleDecrease(item)}
                            disabled={soldOut || isPending || item.quantity <= 1}
                            className="flex h-7 w-7 items-center justify-center text-gray-500 transition hover:bg-gray-100 disabled:opacity-30"
                          >
                            −
                          </button>
                          <span className="min-w-8 text-center text-sm font-bold text-gray-900">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleIncrease(item)}
                            disabled={soldOut || isPending || item.quantity >= item.stockCount}
                            className="flex h-7 w-7 items-center justify-center text-gray-500 transition hover:bg-gray-100 disabled:opacity-30"
                          >
                            +
                          </button>
                        </div>

                        {/* Price */}
                        <span className="text-base font-bold text-gray-900 tabular-nums">
                          {formatPrice(item.price * item.quantity)}원
                        </span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>

            {/* Info Banner */}
            <section className="border border-blue-100 bg-blue-50 p-4">
              <p className="text-sm font-bold text-blue-900">예치금으로 바로 결제</p>
              <p className="mt-1 text-xs leading-relaxed text-blue-700">
                예치금이 부족하면 먼저 충전한 뒤 주문을 진행해 보세요.
              </p>
              <button
                type="button"
                onClick={() => navigate("/deposits")}
                className="mt-3 border border-blue-300 px-4 py-1.5 text-xs font-semibold text-blue-600 transition hover:bg-blue-100"
              >
                예치금 페이지로 이동 →
              </button>
            </section>

            {/* Order Summary */}
            <section className="border border-gray-200 bg-white p-5">
              <h2 className="mb-3 text-sm font-black text-gray-900">결제 금액</h2>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">상품 금액</span>
                  <span className="font-semibold text-gray-900">
                    {formatPrice(summary.subtotal)}원
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">배송비</span>
                  <span className="font-semibold text-gray-900">
                    {summary.shippingFee === 0 ? "무료" : `${formatPrice(summary.shippingFee)}원`}
                  </span>
                </div>
              </div>
              <div className="mt-4 border-t border-gray-100 pt-4">
                <div className="flex items-end justify-between">
                  <span className="text-sm font-bold text-gray-900">총 결제 금액</span>
                  <span className="text-xl font-black tabular-nums text-blue-600">
                    {formatPrice(summary.total)}원
                  </span>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>

      {/* Sticky Checkout Button */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-0 left-0 z-40 w-full border-t border-gray-200 bg-white p-4">
          <div className="mx-auto max-w-7xl">
            <button
              type="button"
              disabled={summary.availableCount === 0}
              onClick={proceedToCheckout}
              className="h-12 w-full bg-blue-600 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {summary.availableCount === 0
                ? "구매 가능한 상품이 없습니다"
                : `주문하러 가기 · ${formatPrice(summary.total)}원`}
            </button>
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="상품을 삭제할까요?"
        description={deleteTarget ? `${deleteTarget.name}을(를) 장바구니에서 삭제합니다.` : ""}
        confirmText="삭제"
        confirmVariant="danger"
        onConfirm={() => handleDelete(deleteTarget)}
      />
    </>
  );
}
