import { useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Button from "../../components/common/Button";
import PageContainer from "../../components/common/PageContainer";

const MOCK_SUCCESS_PAYMENT = {
  orderId: "COL-2024-001",
  orderNumber: null,
  totalPrice: 1240000,
  paymentMethod: "예치금 결제",
  paidAt: "2026-04-01T09:40:00",
  items: [
    {
      productId: "sample-product-1",
      name: "네온 컬렉터 재킷",
      quantity: 1,
      price: 1240000,
      image: null,
    },
  ],
  shipping: {
    receiver: "홍길동",
    receiverPhone: "010-1234-5678",
    address: "서울특별시 강남구 테헤란로 123",
    addressDetail: "101동 1001호",
    zipCode: "06234",
  },
};

function formatPrice(value) {
  return `${new Intl.NumberFormat("ko-KR").format(value)}원`;
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function buildSuccessModel(orderId, state) {
  const source = state ?? MOCK_SUCCESS_PAYMENT;
  const items =
    Array.isArray(source.items) && source.items.length > 0
      ? source.items
      : MOCK_SUCCESS_PAYMENT.items;

  return {
    orderId: source.orderId || orderId || MOCK_SUCCESS_PAYMENT.orderId,
    orderNumber: source.orderNumber ?? null,
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
      <div className="mx-auto max-w-2xl pb-16 pt-8 text-left">

        {/* 완료 표시 */}
        <div className="mb-10 flex flex-col items-center text-center">
          <div className="relative mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-blue-100">
            <div className="absolute inset-0 animate-ping rounded-full bg-blue-500/20" />
            <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-blue-700 text-4xl text-white shadow-[0_10px_30px_-5px_rgba(29,78,216,0.4)]">
              ✓
            </div>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-gray-900">결제가 완료되었습니다</h1>
          <p className="mt-2 text-sm text-gray-500">주문이 정상적으로 접수되었습니다</p>
          <span className="mt-4 inline-flex rounded-full bg-blue-100 px-4 py-1.5 text-xs font-bold text-blue-700">
            주문번호 {payment.orderNumber || payment.orderId}
          </span>
        </div>

        <div className="space-y-7">

          {/* 주문 상품 */}
          <div>
            <h2 className="text-lg font-extrabold text-gray-900" style={{ marginBottom: "0.875rem" }}>주문 상품</h2>
            <div className="rounded-[20px] bg-white p-6 shadow-sm ring-1 ring-purple-100">
              <div className="flex items-start gap-4">
                <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-violet-50">
                  {primaryItem?.image ? (
                    <img src={primaryItem.image} alt={primaryItem.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-2xl font-black text-violet-700">
                      {(primaryItem?.name || "P").slice(0, 1).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900">
                    {primaryItem?.name || "상품 정보 없음"}
                    {payment.items.length > 1 ? ` 외 ${payment.items.length - 1}건` : ""}
                  </p>
                  <p className="mt-1.5 text-sm text-gray-500">수량 {primaryItem?.quantity || 1}개</p>
                </div>
              </div>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* 배송지 정보 */}
          <div>
            <h2 className="text-lg font-extrabold text-gray-900" style={{ marginBottom: "0.875rem" }}>배송지 정보</h2>
            <div className="rounded-[20px] bg-white p-6 shadow-sm ring-1 ring-purple-100 space-y-4 text-sm">
              <div>
                <p className="text-gray-400">받는 분</p>
                <p className="mt-1 font-semibold text-gray-900">{payment.shipping.receiver || "-"}</p>
              </div>
              <div>
                <p className="text-gray-400">연락처</p>
                <p className="mt-1 font-semibold text-gray-900">{payment.shipping.receiverPhone || "-"}</p>
              </div>
              <div>
                <p className="text-gray-400">배송 주소</p>
                <p className="mt-1 font-semibold text-gray-900">
                  {[payment.shipping.address, payment.shipping.addressDetail].filter(Boolean).join(" ") || "-"}
                </p>
                {payment.shipping.zipCode && (
                  <p className="mt-0.5 text-gray-500">({payment.shipping.zipCode})</p>
                )}
              </div>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* 결제 정보 */}
          <div>
            <h2 className="text-lg font-extrabold text-gray-900" style={{ marginBottom: "0.875rem" }}>결제 정보</h2>
            <div className="rounded-[20px] bg-white p-6 shadow-sm ring-1 ring-purple-100 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">결제 수단</span>
                <span className="font-semibold text-gray-900">{payment.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">결제 일시</span>
                <span className="font-semibold text-gray-900">{formatDate(payment.paidAt)}</span>
              </div>
              <div className="flex justify-between border-t border-gray-100 pt-3">
                <span className="font-bold text-gray-900">총 결제 금액</span>
                <span className="text-base font-extrabold text-violet-700">{formatPrice(payment.totalPrice)}</span>
              </div>
            </div>
          </div>

          {/* 버튼 */}
          <div className="space-y-3 pt-2">
            <Button
              size="lg"
              className="w-full"
              onClick={() => navigate(`/orders/${payment.orderId}`)}
            >
              주문 상세 보기
            </Button>
            <Button
              variant="secondary"
              size="lg"
              className="w-full"
              onClick={() => navigate("/products")}
            >
              쇼핑 계속하기
            </Button>
          </div>

        </div>
      </div>
    </PageContainer>
  );
}
