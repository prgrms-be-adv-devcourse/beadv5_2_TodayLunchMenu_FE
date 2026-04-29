import { useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Button from "../../components/common/Button";
import PageContainer from "../../components/common/PageContainer";

const MOCK_SUCCESS_PAYMENT = {
  orderId: "COL-2024-001",
  totalPrice: 1240000,
  paymentMethod: "Vivid Pay (예치금)",
  paidAt: "2026.04.01 09:40",
  items: [
    {
      productId: "sample-product-1",
      name: "네온 컬렉터 재킷",
      price: 1240000,
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuCO_aBPymMQN3nMdz-8JKHMXMdwlrMY0PP_2hfEHrUBkQK05RMWyqHHwChU32gPj2MtOloV5WsHHRLqVjaxg6TJxG3MUuuDijUFR7Y4yAYd38GuyG-tJo-4rrN4dwEuQF-SslA3_LeBVzOWYLjG_wwFYmjSR4tVxnEqjXwd7eMctOk8-RvjM2_VQ1HXADKGxG1ilRgGDCL2yXEaHE-BpY3bSz1yr0l_QmcSbgvEEDB1PDeUVg_38c1aaPcszgi9iusQKqKWLJkxOOD_",
    },
  ],
  shipping: {
    receiver: "홍길동",
    receiverPhone: "010-1234-5678",
    address: "서울특별시 강남구 테헤란로 123",
    addressDetail: "101동 1001호",
  },
};

function formatPrice(value) {
  return `${new Intl.NumberFormat("ko-KR").format(value)}원`;
}

function buildSuccessModel(orderId, state) {
  const source = state ?? MOCK_SUCCESS_PAYMENT;
  const items = Array.isArray(source.items) && source.items.length > 0 ? source.items : MOCK_SUCCESS_PAYMENT.items;

  return {
    orderId: source.orderId || orderId || MOCK_SUCCESS_PAYMENT.orderId,
    totalPrice: source.totalPrice ?? MOCK_SUCCESS_PAYMENT.totalPrice,
    paymentMethod: source.paymentMethod || source.depositLabel || MOCK_SUCCESS_PAYMENT.paymentMethod,
    paidAt: source.paidAt || MOCK_SUCCESS_PAYMENT.paidAt,
    items,
    shipping: {
      ...MOCK_SUCCESS_PAYMENT.shipping,
      ...(source.shipping || {}),
    },
  };
}

export default function PaymentSuccessPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { orderId } = useParams();

  const payment = useMemo(
    () => buildSuccessModel(orderId, location.state),
    [location.state, orderId]
  );

  const primaryItem = payment.items[0];

  return (
    <PageContainer>
      <section className="mx-auto max-w-2xl pb-16 pt-4">

        <div className="mb-8 flex flex-col items-center text-center">
          <div className="relative mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-blue-100">
            <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping" />
            <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-blue-700 text-4xl text-white shadow-[0_10px_30px_-5px_rgba(29,78,216,0.4)]">
              ✓
            </div>
          </div>
          <h2 className="mb-2 text-3xl font-black tracking-tight text-gray-900">결제가 완료되었습니다</h2>
          <p className="font-medium text-gray-500">주문이 정상적으로 접수되었습니다.</p>
        </div>

        <div className="mb-8 text-center">
          <span className="inline-flex rounded-full bg-blue-100 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.24em] text-blue-700">
            #{payment.orderId}
          </span>
        </div>

        <section className="mb-6 bg-white p-6 shadow-[0_40px_40px_-10px_rgba(56,39,76,0.06)]">
          <div className="flex flex-col gap-6">
            <div className="border-b border-gray-200 pb-6 text-center">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-gray-500">
                Total Amount
              </p>
              <p className="text-4xl font-black tracking-tight text-gray-900">
                {formatPrice(payment.totalPrice)}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="bg-blue-50/80 p-4">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.22em] text-gray-500">
                  Payment Method
                </p>
                <p className="text-sm font-semibold text-gray-900">{payment.paymentMethod}</p>
              </div>
              <div className="bg-blue-50/80 p-4">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.22em] text-gray-500">
                  Paid At
                </p>
                <p className="text-sm font-semibold text-gray-900">{payment.paidAt}</p>
              </div>
            </div>

            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-gray-500">
                Order Summary
              </p>
              <div className="flex items-center gap-4 bg-blue-50/60 p-3">
                <div className="h-16 w-16 flex-shrink-0 overflow-hidden bg-blue-100">
                  <img className="h-full w-full object-cover" src={primaryItem.image} alt={primaryItem.name} />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-gray-900">{primaryItem.name}</h3>
                  <p className="mt-1 text-sm font-semibold text-blue-700">
                    {formatPrice(primaryItem.price || payment.totalPrice)}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-gray-500">
                Delivery Address
              </p>
              <div className="space-y-1 bg-blue-50/60 p-4">
                <p className="text-sm font-bold text-gray-900">{payment.shipping.receiver}</p>
                <p className="text-xs font-medium text-gray-500">{payment.shipping.receiverPhone}</p>
                <p className="text-xs font-medium text-gray-500">{payment.shipping.address}</p>
                <p className="text-xs font-medium text-gray-500">{payment.shipping.addressDetail}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <Button
            size="lg"
            className="h-14 w-full rounded-full text-base font-extrabold shadow-[0_15px_30px_-10px_rgba(29,78,216,0.5)]"
            onClick={() => navigate(`/orders/${payment.orderId}`)}
          >
            주문 상세 보기
          </Button>
          <Button
            variant="secondary"
            size="lg"
            className="h-14 w-full rounded-full text-base font-extrabold"
            onClick={() => navigate("/orders")}
          >
            주문 내역 보기
          </Button>
          <button
            type="button"
            className="w-full rounded-full py-3 text-sm font-extrabold text-blue-700 transition hover:bg-blue-50"
            onClick={() => navigate("/products")}
          >
            쇼핑 계속하기
          </button>
        </section>
      </section>
    </PageContainer>
  );
}
