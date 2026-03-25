import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageContainer from "../../components/common/PageContainer";
import PageHeader from "../../components/common/PageHeader";
import Button from "../../components/common/Button";
import ConfirmModal from "../../components/common/ConfirmModal";

const INITIAL_CART_ITEMS = [
  {
    id: 1,
    productId: 101,
    name: "보라 머그컵",
    optionLabel: "리빙 · 라벤더",
    quantity: 1,
    price: 12000,
    image:
      "https://images.unsplash.com/photo-1514228742587-6b1558fcf93a?auto=format&fit=crop&w=800&q=80",
    status: "ON_SALE",
  },
  {
    id: 2,
    productId: 102,
    name: "제로마켓 키링",
    optionLabel: "굿즈 · 실버",
    quantity: 2,
    price: 8000,
    image:
      "https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=800&q=80",
    status: "ON_SALE",
  },
  {
    id: 3,
    productId: 103,
    name: "무드 조명",
    optionLabel: "리빙 · Warm",
    quantity: 1,
    price: 39000,
    image:
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80",
    status: "SOLD_OUT",
  },
];

function formatPrice(value) {
  return new Intl.NumberFormat("ko-KR").format(value);
}

export default function CartPage() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState(INITIAL_CART_ITEMS);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const handleIncrease = (itemId) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  };

  const handleDecrease = (itemId) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? { ...item, quantity: Math.max(1, item.quantity - 1) }
          : item
      )
    );
  };

  const handleDelete = (itemId) => {
    setCartItems((prev) => prev.filter((item) => item.id !== itemId));
    setDeleteTarget(null);
  };

  const summary = useMemo(() => {
    const availableItems = cartItems.filter((item) => item.status === "ON_SALE");
    const subtotal = availableItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const shippingFee = subtotal >= 30000 || subtotal === 0 ? 0 : 3000;
    const total = subtotal + shippingFee;

    return {
      subtotal,
      shippingFee,
      total,
      availableCount: availableItems.length,
      soldOutCount: cartItems.filter((item) => item.status === "SOLD_OUT").length,
    };
  }, [cartItems]);

  const proceedToCheckout = () => {
    if (summary.availableCount === 0) return;
    navigate("/orders/checkout");
  };

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
              상품을 담고 다시 돌아와 주세요.
            </p>
            <Button onClick={() => navigate("/products")}>상품 보러가기</Button>
          </section>
        ) : (
          <>
            <section className="space-y-4">
              {cartItems.map((item) => {
                const soldOut = item.status === "SOLD_OUT";

                return (
                  <article
                    key={item.id}
                    className="flex gap-4 rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-purple-100"
                  >
                    <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-purple-50">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div className="flex min-h-24 flex-1 flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-base font-extrabold leading-tight text-gray-900">
                              {item.name}
                            </h3>
                            <p className="mt-1 text-xs font-medium uppercase tracking-wider text-gray-500">
                              {item.optionLabel}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => setDeleteTarget(item)}
                            className="rounded-full p-1 text-gray-400 transition hover:bg-red-50 hover:text-red-500"
                          >
                            ✕
                          </button>
                        </div>

                        {soldOut ? (
                          <p className="mt-2 text-sm font-semibold text-red-500">
                            품절된 상품입니다.
                          </p>
                        ) : null}
                      </div>

                      <div className="flex items-end justify-between">
                        <div className="flex items-center rounded-full bg-purple-100 px-2 py-1">
                          <button
                            type="button"
                            onClick={() => handleDecrease(item.id)}
                            disabled={soldOut}
                            className="flex h-7 w-7 items-center justify-center rounded-full text-violet-700 transition hover:bg-white disabled:opacity-40"
                          >
                            −
                          </button>
                          <span className="min-w-10 text-center text-sm font-bold">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleIncrease(item.id)}
                            disabled={soldOut}
                            className="flex h-7 w-7 items-center justify-center rounded-full text-violet-700 transition hover:bg-white disabled:opacity-40"
                          >
                            ＋
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
                <span className="text-sm">✦</span>
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
        onConfirm={() => handleDelete(deleteTarget.id)}
      />
    </>
  );
}