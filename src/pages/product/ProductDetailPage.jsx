import { Link, useParams } from 'react-router-dom';
import { useState } from 'react';

import PageContainer from '../../components/common/PageContainer';
import Button from '../../components/common/Button';
import ConfirmModal from '../../components/common/ConfirmModal';

const MOCK_PRODUCTS = [
  {
    id: 1,
    name: '세라믹 머그컵',
    category: '굿즈',
    price: 8000,
    description: '따뜻한 음료와 잘 어울리는 심플한 세라믹 머그컵입니다.',
    image: 'https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=800&q=80',
    status: 'ON_SALE',
    seller: {
      memberId: '11111111-1111-1111-1111-111111111111',
      nickname: 'Celestial Seller',
    },
  },
];

function formatPrice(price) {
  return new Intl.NumberFormat('ko-KR').format(price);
}

export default function ProductDetailPage() {
  const { productId } = useParams();
  const product = MOCK_PRODUCTS.find((item) => item.id === Number(productId));
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
  const soldOut = product.status === 'SOLD_OUT';
  const reportLink = `/member-reports/new?memberId=${encodeURIComponent(product.seller.memberId)}&nickname=${encodeURIComponent(product.seller.nickname)}`;

  return (
    <>
      <PageContainer>
        <section className="mb-6 overflow-hidden rounded-[32px] bg-purple-50">
          <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
        </section>

        <section className="mb-6 space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-violet-500">{product.category}</p>
          <h1 className="text-2xl font-extrabold tracking-tight">{product.name}</h1>
          <p className="text-xl font-extrabold text-violet-700">{formatPrice(product.price)}원</p>
          <p className="text-sm leading-relaxed text-gray-600">{product.description}</p>
        </section>

        <section className="mb-6 rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-purple-100">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-500">Seller</p>
              <h2 className="mt-2 text-lg font-extrabold text-gray-900">{product.seller.nickname}</h2>
              <p className="mt-1 text-sm text-gray-500">판매자 프로필과 신고 기능으로 연결됩니다.</p>
            </div>
            <div className="flex gap-2">
              <Link to={`/members/${product.seller.memberId}`}>
                <Button variant="secondary">프로필 보기</Button>
              </Link>
              <Link to={reportLink}>
                <Button variant="ghost">신고하기</Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="mb-6">
          <QuantitySelector value={quantity} onChange={setQuantity} />
        </section>

        <section className="mb-6 flex items-center justify-between rounded-2xl bg-white/70 px-5 py-4 shadow-sm ring-1 ring-purple-100">
          <span className="text-sm text-gray-600">총 금액</span>
          <span className="text-lg font-extrabold text-violet-700">{formatPrice(totalPrice)}원</span>
        </section>

        <section className="flex gap-3">
          <Button variant="secondary" className="flex-1" disabled={soldOut} onClick={() => console.log('장바구니')}>
            장바구니
          </Button>
          <Button className="flex-1" disabled={soldOut} onClick={() => setOpenModal(true)}>
            구매하기
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
          console.log('구매 진행');
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
        <Button variant="secondary" size="sm" onClick={decrease}>-</Button>
        <span className="w-8 text-center font-bold">{value}</span>
        <Button variant="secondary" size="sm" onClick={increase}>+</Button>
      </div>
    </div>
  );
}
