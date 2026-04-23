import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "../../components/common/Button";
import ConfirmModal from "../../components/common/ConfirmModal";
import PageContainer from "../../components/common/PageContainer";
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
      <PageContainer>
        <p className="py-24 text-center text-sm text-gray-400">상품을 불러오는 중입니다.</p>
      </PageContainer>
    );
  }

  if (error || !product) {
    return (
      <PageContainer>
        <p className="py-24 text-center text-sm text-gray-400">
          {error?.message || "상품을 찾을 수 없습니다."}
        </p>
      </PageContainer>
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
      <PageContainer>
        {/* 뒤로가기 */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-5 flex items-center gap-1 text-sm text-gray-400 transition hover:text-gray-700"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          목록으로
        </button>

        {/* ── 메인 콘텐츠 (2열 그리드) ── */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:items-start">

          {/* ── 좌측: 이미지 갤러리 ── */}
          <div className="md:sticky md:top-6">
            {/* 메인 이미지 */}
            <div className="overflow-hidden rounded-2xl bg-gray-50">
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

            {/* 썸네일 스트립 */}
            {images.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {images.map((img, idx) => (
                  <button
                    key={img.id ?? idx}
                    type="button"
                    onClick={() => setSelectedIdx(idx)}
                    className={[
                      "h-[72px] w-[72px] flex-shrink-0 overflow-hidden rounded-xl transition",
                      idx === selectedIdx
                        ? "ring-2 ring-violet-500"
                        : "ring-1 ring-gray-200 opacity-50 hover:opacity-90",
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

          {/* ── 우측: 상품 정보 ── */}
          <div className="flex flex-col gap-5">
            {/* 카테고리 + 상품명 + 가격 */}
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-violet-400">
                {product.category}
              </p>
              <h1 className="text-2xl font-extrabold leading-snug tracking-tight text-gray-900">
                {product.name}
              </h1>
              <p className="mt-3 text-3xl font-black text-violet-700">
                {formatPrice(product.price)}
                <span className="ml-1 text-lg font-bold">원</span>
              </p>
            </div>

            {/* 상태 / 재고 / 등록일 */}
            <div className="rounded-xl bg-gray-50 px-4 py-3">
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500">판매 상태</dt>
                  <dd className={soldOut ? "font-semibold text-red-500" : "font-semibold text-emerald-600"}>
                    {soldOut ? "품절" : "판매중"}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">남은 재고</dt>
                  <dd className={`font-semibold ${product.stockCount === 0 ? "text-red-500" : "text-gray-800"}`}>
                    {product.stockCount}개
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">등록일</dt>
                  <dd className="text-gray-800">{formatDate(product.createdAt)}</dd>
                </div>
              </dl>
            </div>

            <hr className="border-gray-100" />

            {/* 수량 선택 */}
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-gray-400">수량</p>
              <div className="inline-flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2">
                <button
                  type="button"
                  onClick={() => quantity > 1 && setQuantity(quantity - 1)}
                  disabled={quantity <= 1}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-lg font-bold text-gray-600 transition hover:bg-gray-100 disabled:opacity-30"
                >
                  −
                </button>
                <span className="w-8 text-center text-base font-bold text-gray-900">{quantity}</span>
                <button
                  type="button"
                  onClick={() => quantity < product.stockCount && setQuantity(quantity + 1)}
                  disabled={quantity >= product.stockCount}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-lg font-bold text-gray-600 transition hover:bg-gray-100 disabled:opacity-30"
                >
                  +
                </button>
              </div>
            </div>

            {/* 총 금액 */}
            <div className="flex items-baseline justify-between rounded-xl bg-violet-50 px-4 py-3">
              <span className="text-sm font-semibold text-gray-600">총 금액</span>
              <span className="text-2xl font-black text-violet-700">
                {formatPrice(totalPrice)}
                <span className="ml-1 text-base font-bold">원</span>
              </span>
            </div>

            {/* 구매 버튼 */}
            <div className="flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                disabled={soldOut || isAddingToCart}
                onClick={handleAddToCart}
              >
                {isAddingToCart ? "담는 중..." : "장바구니"}
              </Button>
              <Button
                className="flex-1"
                disabled={soldOut}
                onClick={() => setOpenModal(true)}
              >
                구매하기
              </Button>
            </div>

            {soldOut && (
              <p className="text-center text-sm font-semibold text-red-400">
                현재 품절된 상품입니다.
              </p>
            )}
          </div>
        </div>

        {/* ── 상품 설명 (이미지 아래 전체 너비) ── */}
        {product.description && (
          <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-gray-400">
              상품 설명
            </h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-gray-700">
              {product.description}
            </p>
          </section>
        )}

        {/* ── 하단: AI 추천 ── */}
        <ProductRecommendationSection
          recommendations={recommendations}
          loading={recommendationsLoading}
          error={recommendationsError}
        />
      </PageContainer>

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
