import { useParams } from "react-router-dom";
import { useState } from "react";
import PageContainer from "../../components/common/PageContainer";
import Button from "../../components/common/Button";
// import QuantitySelector from "../../components/product/QuantitySelector";
import ConfirmModal from "../../components/common/ConfirmModal";

const MOCK_PRODUCTS = [
//   {
//     id: 1,
//     name: "보라 머그컵",
//     category: "리빙",
//     price: 12000,
//     description:
//       "부드러운 곡선과 감성적인 컬러가 돋보이는 머그컵입니다.",
//     image:
//       "https://images.unsplash.com/photo-1514228742587-6b1558fcf93a?auto=format&fit=crop&w=800&q=80",
//     status: "ON_SALE",
//   },
  {
    id: 1,
    name: "제로마켓 키링",
    category: "굿즈",
    price: 8000,
    description: "귀엽고 가벼운 키링으로 일상에 포인트를 더해보세요.",
    image:
      "https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=800&q=80",
    status: "ON_SALE",
  },
];

function formatPrice(price) {
  return new Intl.NumberFormat("ko-KR").format(price);
}

export default function ProductDetailPage() {
  const { productId } = useParams();
  const product = MOCK_PRODUCTS.find(
    (p) => p.id === Number(productId)
  );

    // 필요한 상태들
    // product
    // quantity
    // addToCartLoading
  const [quantity, setQuantity] = useState(1);
  const [openModal, setOpenModal] = useState(false);

  if (!product) {
    return (
      <PageContainer>
        <p>상품을 찾을 수 없습니다.</p>
      </PageContainer>
    );
  }

  const totalPrice = product.price * quantity;
  const soldOut = product.status === "SOLD_OUT";

  return (
    <>
      <PageContainer>
        {/* 이미지 */}
        <section className="mb-6 overflow-hidden rounded-[32px] bg-purple-50">
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        </section>

        {/* 상품 정보 */}
        <section className="mb-6 space-y-3">
            {/* 카테고리 */}
          <p className="text-xs font-bold uppercase tracking-widest text-violet-500">
            {product.category}
          </p>

              {/* 상품명 */}
          <h1 className="text-2xl font-extrabold tracking-tight">
            {product.name}
          </h1>

              {/* 가격 */}
          <p className="text-xl font-extrabold text-violet-700">
            {formatPrice(product.price)}원
          </p>

              {/* 설명 */}
          <p className="text-sm text-gray-600 leading-relaxed">
            {product.description}
          </p>
        </section>

        {/* 수량 선택 */}
        <section className="mb-6">
          <QuantitySelector
            value={quantity}
            onChange={setQuantity}
          />
        </section>

        {/* 총 금액 */}
        <section className="mb-6 flex justify-between items-center rounded-2xl bg-white/70 px-5 py-4 shadow-sm ring-1 ring-purple-100">
          <span className="text-sm text-gray-600">총 금액</span>
          <span className="text-lg font-extrabold text-violet-700">
            {formatPrice(totalPrice)}원
          </span>
        </section>

        {/* CTA 버튼 */}
        <section className="flex gap-3">
          <Button
            variant="secondary"
            className="flex-1"
            disabled={soldOut}
            onClick={() => console.log("장바구니")}
          >
            장바구니
          </Button>

          <Button
            className="flex-1"
            disabled={soldOut}
            onClick={() => setOpenModal(true)}
          >
            구매하기
          </Button>
        </section>
      </PageContainer>

      {/* 구매 확인 모달 */}
      <ConfirmModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        title="구매하시겠어요?"
        description={`${product.name} ${quantity}개를 구매합니다.`}
        confirmText="구매하기"
        onConfirm={() => {
          console.log("구매 진행");
          setOpenModal(false);
        }}
      />
    </>
  );
}

function QuantitySelector({ value, onChange }) {
  const increase = () => onChange(value + 1);
  const decrease = () => {
    if (value > 1) onChange(value - 1);
  };

  return (
    <div className="flex items-center justify-between rounded-2xl bg-white/70 px-4 py-3 shadow-sm ring-1 ring-purple-100">
      <span className="text-sm font-medium text-gray-600">수량</span>

      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" onClick={decrease}>
          -
        </Button>

        <span className="w-8 text-center font-bold">{value}</span>

        <Button variant="secondary" size="sm" onClick={increase}>
          +
        </Button>
      </div>
    </div>
  );
}