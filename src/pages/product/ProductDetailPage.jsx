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
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(value));
}

function ProductHero({ product }) {
  const initial = (product.name || "P").slice(0, 1).toUpperCase();

  if (!product.image) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-violet-100 via-fuchsia-50 to-amber-50 text-8xl font-black text-violet-700">
        {initial}
      </div>
    );
  }

  return <img src={product.image} alt={product.name} className="h-full w-full object-cover" />;
}

export default function ProductDetailPage() {
  const navigate = useNavigate();
  const { productId } = useParams();
  const { product, loading, error } = useProduct(productId);
  const {
    recommendations,
    loading: recommendationsLoading,
    error: recommendationsError,
  } = useProductRecommendations(product?.id);
  const { addToCart } = useCart({ autoLoad: false });
  const [quantity, setQuantity] = useState(1);
  const [openModal, setOpenModal] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  async function handleAddToCart() {
    if (!product) {
      return;
    }

    try {
      setIsAddingToCart(true);
      await addToCart({ productId: product.id, quantity });
      window.alert("장바구니에 담았습니다.");
    } catch (nextError) {
      if (nextError?.status === 401) {
        navigate("/login");
        return;
      }

      window.alert(nextError?.message || "장바구니에 담지 못했습니다.");
    } finally {
      setIsAddingToCart(false);
    }
  }

  if (loading) {
    return (
      <PageContainer>
        <p>상품을 불러오는 중입니다.</p>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <p>{error.message || "상품 정보를 불러오지 못했습니다."}</p>
      </PageContainer>
    );
  }

  if (!product) {
    return (
      <PageContainer>
        <p>상품을 찾을 수 없습니다.</p>
      </PageContainer>
    );
  }

  const totalPrice = product.price * quantity;
  const soldOut = product.status === "SOLD_OUT" || product.stockCount <= 0;

  return (
    <>
      <PageContainer>
        <section className="mb-6 overflow-hidden rounded-[32px] bg-purple-50">
          <ProductHero product={product} />
        </section>

        <section className="mb-6 space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-violet-500">{product.category}</p>
          <h1 className="text-2xl font-extrabold tracking-tight">{product.name}</h1>
          <p className="text-xl font-extrabold text-violet-700">{formatPrice(product.price)}원</p>
          <p className="text-sm leading-relaxed text-gray-600">{product.description}</p>
        </section>

        <section className="mb-6 rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-purple-100">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-500">상태</p>
              <p className="mt-2 text-lg font-extrabold text-gray-900">{soldOut ? "품절" : "판매중"}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-500">재고</p>
              <p className="mt-2 text-lg font-extrabold text-gray-900">{product.stockCount}개</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-500">등록일</p>
              <p className="mt-2 text-lg font-extrabold text-gray-900">{formatDate(product.createdAt)}</p>
            </div>
          </div>
        </section>

        <section className="mb-6">
          <QuantitySelector
            value={quantity}
            max={Math.max(product.stockCount, 1)}
            onChange={setQuantity}
          />
        </section>

        <section className="mb-6 flex items-center justify-between rounded-2xl bg-white/70 px-5 py-4 shadow-sm ring-1 ring-purple-100">
          <span className="text-sm text-gray-600">총 금액</span>
          <span className="text-lg font-extrabold text-violet-700">{formatPrice(totalPrice)}원</span>
        </section>

        <section className="flex gap-3">
          <Button
            variant="secondary"
            className="flex-1"
            disabled={soldOut || isAddingToCart}
            onClick={handleAddToCart}
          >
            {isAddingToCart ? "담는 중..." : "장바구니"}
          </Button>
          <Button className="flex-1" disabled={soldOut} onClick={() => setOpenModal(true)}>
            구매하기
          </Button>
        </section>

        <ProductRecommendationSection
          recommendations={recommendations}
          loading={recommendationsLoading}
          error={recommendationsError}
        />

        <section className="mt-4">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            목록으로 돌아가기
          </Button>
        </section>
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

function QuantitySelector({ value, onChange, max }) {
  const increase = () => {
    if (value < max) {
      onChange(value + 1);
    }
  };

  const decrease = () => {
    if (value > 1) {
      onChange(value - 1);
    }
  };

  return (
    <div className="flex items-center justify-between rounded-2xl bg-white/70 px-4 py-3 shadow-sm ring-1 ring-purple-100">
      <span className="text-sm font-medium text-gray-600">수량</span>
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" onClick={decrease}>-</Button>
        <span className="w-8 text-center font-bold">{value}</span>
        <Button variant="secondary" size="sm" onClick={increase} disabled={value >= max}>+</Button>
      </div>
    </div>
  );
}
