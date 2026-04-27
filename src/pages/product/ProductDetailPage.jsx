import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ConfirmModal from "../../components/common/ConfirmModal";
import ProductRecommendationSection from "../../components/product/ProductRecommendationSection";
import { useProductRecommendations } from "../../features/ai/useProductRecommendations";
import { useCart } from "../../features/cart/useCart";
import { useProduct } from "../../features/product/useProducts";

function formatPrice(price) {
  return new Intl.NumberFormat("ko-KR").format(price);
}

function formatDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(value));
}

export default function ProductDetailPage() {
  const navigate = useNavigate();
  const { productId } = useParams();
  const { product, loading, error } = useProduct(productId);
  const { recommendations, loading: recommendationsLoading, error: recommendationsError } =
    useProductRecommendations(product?.id);
  const { addToCart } = useCart({ autoLoad: false });

  const [selectedIdx, setSelectedIdx] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [openModal, setOpenModal] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  async function handleAddToCart() {
    if (!product) return;
    try {
      setIsAddingToCart(true);
      await addToCart({ productId: product.id, quantity });
      window.alert("장바구니에 담았습니다.");
    } catch (err) {
      if (err?.status === 401) { navigate("/login"); return; }
      window.alert(err?.message || "장바구니에 담지 못했습니다.");
    } finally {
      setIsAddingToCart(false);
    }
  }

  if (loading) {
    return (
      <div className="py-24 text-center text-sm text-gray-400">
        상품을 불러오는 중입니다.
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="py-24 text-center text-sm text-gray-400">
        {error?.message || "상품을 찾을 수 없습니다."}
      </div>
    );
  }

  const images =
    Array.isArray(product.images) && product.images.length > 0
      ? product.images
      : product.image
        ? [{ id: "main", url: product.image, isThumbnail: true }]
        : [];

  const selectedUrl = images[selectedIdx]?.url ?? null;
  const soldOut = product.status === "SOLD_OUT" || product.stockCount <= 0;
  const totalPrice = product.price * quantity;

  return (
    <>
      <div className="py-2">
        {/* Breadcrumb */}
        <nav className="mb-4 flex items-center gap-1 text-sm text-gray-500">
          <button
            type="button"
            onClick={() => navigate("/products")}
            className="hover:text-blue-600 hover:underline"
          >
            상품 목록
          </button>
          {product.category && (
            <>
              <span className="text-gray-300">›</span>
              <span className="text-gray-500">{product.category}</span>
            </>
          )}
          <span className="text-gray-300">›</span>
          <span className="max-w-xs truncate font-medium text-gray-800">
            {product.name}
          </span>
        </nav>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_400px] md:items-start">
          {/* ── LEFT: Image Gallery ── */}
          <div className="md:sticky md:top-6">
            <div className="overflow-hidden border border-gray-200 bg-gray-50">
              {selectedUrl ? (
                <img
                  src={selectedUrl}
                  alt={product.name}
                  className="aspect-square w-full object-cover"
                />
              ) : (
                <div className="flex aspect-square w-full items-center justify-center text-8xl font-black text-gray-200">
                  {(product.name || "P").slice(0, 1).toUpperCase()}
                </div>
              )}
            </div>

            {images.length > 1 && (
              <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                {images.map((img, idx) => (
                  <button
                    key={img.id ?? idx}
                    type="button"
                    onClick={() => setSelectedIdx(idx)}
                    className={[
                      "h-14 w-14 shrink-0 overflow-hidden border-2 transition",
                      idx === selectedIdx
                        ? "border-blue-600"
                        : "border-gray-200 opacity-60 hover:opacity-90",
                    ].join(" ")}
                  >
                    {img.url ? (
                      <img src={img.url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gray-100 text-xs text-gray-300">
                        없음
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── RIGHT: Product Info ── */}
          <div className="flex flex-col gap-4">
            {/* Title */}
            <div>
              <p className="mb-1 text-xs text-gray-500">{product.category}</p>
              <h1 className="text-xl font-bold leading-snug text-gray-900">
                {product.name}
              </h1>
            </div>

            {/* Price */}
            <div className="border-b border-gray-200 pb-4">
              <p className="text-xs text-gray-500">판매가</p>
              <p className="mt-1 tabular-nums text-3xl font-bold text-gray-900">
                {formatPrice(product.price)}
                <span className="ml-1 text-xl font-medium text-gray-600">원</span>
              </p>
            </div>

            {/* Item Details */}
            <div className="border border-gray-200 bg-white">
              <dl className="divide-y divide-gray-100">
                <div className="flex items-center justify-between px-4 py-2.5 text-sm">
                  <dt className="text-gray-500">판매 상태</dt>
                  <dd
                    className={
                      soldOut
                        ? "font-semibold text-red-500"
                        : "font-semibold text-green-600"
                    }
                  >
                    {soldOut ? "품절" : "판매중"}
                  </dd>
                </div>
                <div className="flex items-center justify-between px-4 py-2.5 text-sm">
                  <dt className="text-gray-500">남은 재고</dt>
                  <dd
                    className={`font-semibold ${product.stockCount === 0 ? "text-red-500" : "text-gray-800"}`}
                  >
                    {product.stockCount}개
                  </dd>
                </div>
                <div className="flex items-center justify-between px-4 py-2.5 text-sm">
                  <dt className="text-gray-500">등록일</dt>
                  <dd className="text-gray-700">{formatDate(product.createdAt)}</dd>
                </div>
              </dl>
            </div>

            {/* Quantity */}
            {!soldOut && (
              <div>
                <p className="mb-2 text-xs font-semibold text-gray-600">수량</p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => quantity > 1 && setQuantity(quantity - 1)}
                    disabled={quantity <= 1}
                    className="flex h-9 w-9 items-center justify-center border border-gray-300 text-lg font-bold text-gray-600 transition hover:bg-gray-100 disabled:opacity-30"
                  >
                    −
                  </button>
                  <span className="w-10 text-center font-bold text-gray-900">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      quantity < product.stockCount && setQuantity(quantity + 1)
                    }
                    disabled={quantity >= product.stockCount}
                    className="flex h-9 w-9 items-center justify-center border border-gray-300 text-lg font-bold text-gray-600 transition hover:bg-gray-100 disabled:opacity-30"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {/* Total */}
            {!soldOut && (
              <div className="flex items-baseline justify-between border border-gray-200 bg-gray-50 px-4 py-3">
                <span className="text-sm text-gray-600">합계</span>
                <span className="tabular-nums text-2xl font-bold text-gray-900">
                  {formatPrice(totalPrice)}
                  <span className="ml-1 text-base font-medium text-gray-600">원</span>
                </span>
              </div>
            )}

            {/* Buttons */}
            <div className="flex flex-col gap-2">
              <button
                type="button"
                disabled={soldOut || isAddingToCart}
                onClick={handleAddToCart}
                className="h-12 w-full border border-blue-600 text-sm font-bold text-blue-600 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isAddingToCart ? "담는 중..." : "장바구니 담기"}
              </button>
              <button
                type="button"
                disabled={soldOut}
                onClick={() => setOpenModal(true)}
                className="h-12 w-full bg-blue-600 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                구매하기
              </button>
            </div>

            {soldOut && (
              <p className="text-center text-sm font-semibold text-red-500">
                현재 품절된 상품입니다.
              </p>
            )}
          </div>
        </div>

        {/* Description */}
        {product.description && (
          <div className="mt-6 border border-gray-200 bg-white">
            <div className="border-b border-gray-200 px-5 py-3">
              <h2 className="text-sm font-bold text-gray-700">상품 설명</h2>
            </div>
            <div className="px-5 py-4">
              <p className="whitespace-pre-line text-sm leading-relaxed text-gray-600">
                {product.description}
              </p>
            </div>
          </div>
        )}

        {/* AI Recommendations */}
        <ProductRecommendationSection
          recommendations={recommendations}
          loading={recommendationsLoading}
          error={recommendationsError}
        />
      </div>

      <ConfirmModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        title="구매하시겠어요?"
        description={`${product.name} ${quantity}개를 구매합니다.`}
        confirmText="구매하기"
        onConfirm={() => {
          setOpenModal(false);
          navigate("/orders/checkout", {
            state: {
              items: [
                {
                  productId: product.id,
                  name: product.name,
                  category: product.category,
                  quantity,
                  price: product.price,
                  image: product.image,
                  status: product.status,
                  stockCount: product.stockCount,
                },
              ],
            },
          });
        }}
      />
    </>
  );
}
