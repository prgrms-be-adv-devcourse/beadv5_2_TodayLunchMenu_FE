import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageContainer from "../../components/common/PageContainer";
import PageHeader from "../../components/common/PageHeader";
import Button from "../../components/common/Button";
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
    if (item.quantity <= 1) {
      return;
    }

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
    if (summary.availableCount === 0) {
      return;
    }

    navigate("/orders/checkout", {
      state: {
        items: cartItems.filter((item) => !isSoldOut(item)),
      },
    });
  };

  if (loading) {
    return (
      <PageContainer>
        <PageHeader title="장바구니" />
        <section className="rounded-[32px] bg-white/75 px-6 py-16 text-center shadow-sm ring-1 ring-purple-100">
          <p className="text-lg font-bold text-gray-900">
            장바구니를 불러오는 중입니다.
          </p>
        </section>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <PageHeader title="장바구니" />
        <section className="rounded-[32px] bg-red-50 px-6 py-16 text-center shadow-sm ring-1 ring-red-100">
          <p className="mb-2 text-lg font-bold text-red-700">
            장바구니를 불러오지 못했습니다.
          </p>
          <p className="text-sm text-red-500">
            {error.message || "잠시 후 다시 시도해 주세요."}
          </p>
        </section>
      </PageContainer>
    );
  }

  return (
    <>
      <PageContainer>
        <PageHeader
          title="장바구니"
          action={
            <span className="text-sm font-medium text-gray-500">
              총 {cartItems.length}개
            </span>
          }
        />

        {cartItems.length === 0 ? (
          <section className="rounded-[32px] bg-white/75 px-6 py-16 text-center shadow-sm ring-1 ring-purple-100">
            <p className="mb-2 text-lg font-bold text-gray-900">
              장바구니가 비어 있어요
            </p>
            <p className="mb-6 text-sm text-gray-500">
              상품을 담고 다시 찾아와 주세요.
            </p>
            <Button onClick={() => navigate("/products")}>상품 보러가기</Button>
          </section>
        ) : (
          <>
            <section className="space-y-4">
              {cartItems.map((item) => {
                const soldOut = isSoldOut(item);
                const isPending = pendingCartId === item.cartId;

                return (
                  <article
                    key={item.cartId}
                    className="flex gap-4 rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-purple-100"
                  >
                    <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-purple-50">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-2xl font-black text-violet-700">
                          {(item.name || "P").slice(0, 1).toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div className="flex min-h-24 flex-1 flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-base font-extrabold leading-tight text-gray-900">
                              {item.name}
                            </h3>
                            <p className="mt-1 text-xs font-medium uppercase tracking-wider text-gray-500">
                              {item.category}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => setDeleteTarget(item)}
                            className="rounded-full p-1 text-gray-400 transition hover:bg-red-50 hover:text-red-500"
                            disabled={isPending}
                          >
                            ×
                          </button>
                        </div>

                        {soldOut ? (
                          <p className="mt-2 text-sm font-semibold text-red-500">
                            품절 상품입니다.
                          </p>
                        ) : null}
                      </div>

                      <div className="flex items-end justify-between">
                        <div className="flex items-center rounded-full bg-purple-100 px-2 py-1">
                          <button
                            type="button"
                            onClick={() => handleDecrease(item)}
                            disabled={
                              soldOut || isPending || item.quantity <= 1
                            }
                            className="flex h-7 w-7 items-center justify-center rounded-full text-violet-700 transition hover:bg-white disabled:opacity-40"
                          >
                            -
                          </button>
                          <span className="min-w-10 text-center text-sm font-bold">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleIncrease(item)}
                            disabled={soldOut || isPending || item.quantity >= item.stockCount}
                            className="flex h-7 w-7 items-center justify-center rounded-full text-violet-700 transition hover:bg-white disabled:opacity-40"
                          >
                            +
                          </button>
                        </div>

                        <span className="text-lg font-extrabold text-violet-700">
                          {formatPrice(item.price * item.quantity)}원
                        </span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>

            <section className="mt-8 rounded-[28px] bg-gradient-to-br from-violet-700 to-violet-600 p-6 text-white shadow-xl shadow-violet-500/20">
              <div className="mb-2 flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-100">
                  Cart Tip
                </span>
              </div>
              <h3 className="text-xl font-extrabold tracking-tight">
                예치금으로 바로 결제할 수 있어요
              </h3>
              <p className="mt-2 text-sm leading-6 text-violet-100">
                예치금이 부족하면 먼저 충전한 뒤 주문을 진행해 보세요.
              </p>

              <div className="mt-4">
                <Button
                  variant="secondary"
                  onClick={() => navigate("/deposits")}
                  className="bg-white/15 text-white hover:bg-white/20"
                >
                  예치금 페이지로 이동
                </Button>
              </div>
            </section>

            <section className="mt-8 space-y-3 rounded-[28px] bg-white/80 p-5 shadow-sm ring-1 ring-purple-100">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">상품 금액</span>
                <span className="font-bold text-gray-900">
                  {formatPrice(summary.subtotal)}원
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">배송비</span>
                <span className="font-bold text-gray-900">
                  {summary.shippingFee === 0
                    ? "무료"
                    : `${formatPrice(summary.shippingFee)}원`}
                </span>
              </div>

              <div className="border-t border-purple-100 pt-4">
                <div className="flex items-end justify-between">
                  <span className="text-lg font-extrabold text-gray-900">
                    총 결제 금액
                  </span>
                  <span className="text-2xl font-extrabold tracking-tight text-violet-700">
                    {formatPrice(summary.total)}원
                  </span>
                </div>
              </div>

              {summary.soldOutCount > 0 ? (
                <p className="text-sm font-medium text-red-500">
                  품절 상품 {summary.soldOutCount}개는 결제 대상에서 제외됩니다.
                </p>
              ) : null}
            </section>
          </>
        )}
      </PageContainer>

      {cartItems.length > 0 ? (
        <div className="fixed bottom-20 left-0 z-40 w-full px-4 md:bottom-6">
          <div className="mx-auto max-w-3xl rounded-[32px] bg-white/80 p-4 shadow-2xl ring-1 ring-purple-100 backdrop-blur-xl">
            <Button
              size="lg"
              className="w-full"
              disabled={summary.availableCount === 0}
              onClick={proceedToCheckout}
            >
              주문하러 가기
            </Button>
          </div>
        </div>
      ) : null}

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="상품을 삭제할까요?"
        description={
          deleteTarget
            ? `${deleteTarget.name}을(를) 장바구니에서 삭제합니다.`
            : ""
        }
        confirmText="삭제"
        confirmVariant="danger"
        onConfirm={() => handleDelete(deleteTarget)}
      />
    </>
  );
}
