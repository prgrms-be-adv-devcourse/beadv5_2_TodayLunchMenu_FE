import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import PageContainer from "../../components/common/PageContainer";
import Button from "../../components/common/Button";
import ConfirmModal from "../../components/common/ConfirmModal";

const MOCK_ORDERS = [
  {
    id: 10031,
    orderNumber: "ZM-10031",
    status: "CONFIRMED",
    createdAt: "2026-03-24 12:10",
    estimatedDelivery: "2026-03-26 ~ 2026-03-28",
    email: "user@example.com",
    receiverName: "홍길동",
    receiverPhone: "010-1234-5678",
    shippingAddress: "서울특별시 강남구 테헤란로 123 101동 1001호",
    memo: "문 앞에 놓아주세요.",
    subtotal: 28000,
    shippingFee: 0,
    totalAmount: 28000,
    items: [
      {
        id: 1,
        name: "보라 머그컵",
        quantity: 1,
        price: 12000,
        image:
          "https://images.unsplash.com/photo-1514228742587-6b1558fcf93a?auto=format&fit=crop&w=800&q=80",
      },
      {
        id: 2,
        name: "제로마켓 키링",
        quantity: 2,
        price: 8000,
        image:
          "https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=800&q=80",
      },
    ],
  },
  {
    id: 10027,
    orderNumber: "ZM-10027",
    status: "COMPLETED",
    createdAt: "2026-03-22 18:20",
    estimatedDelivery: "배송 완료",
    email: "user@example.com",
    receiverName: "홍길동",
    receiverPhone: "010-1234-5678",
    shippingAddress: "서울특별시 서초구 서초대로 45 202호",
    memo: "",
    subtotal: 39000,
    shippingFee: 0,
    totalAmount: 39000,
    items: [
      {
        id: 3,
        name: "무드 조명",
        quantity: 1,
        price: 39000,
        image:
          "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80",
      },
    ],
  },
];

function formatPrice(value) {
  return new Intl.NumberFormat("ko-KR").format(value);
}

function getStatusMeta(status) {
  switch (status) {
    case "CONFIRMED":
      return {
        title: "주문이 완료되었어요",
        label: "주문완료",
        badgeClass: "bg-violet-100 text-violet-700",
      };
    case "COMPLETED":
      return {
        title: "구매가 확정되었어요",
        label: "구매확정",
        badgeClass: "bg-emerald-100 text-emerald-700",
      };
    case "CANCELLED":
      return {
        title: "주문이 취소되었어요",
        label: "취소됨",
        badgeClass: "bg-red-100 text-red-600",
      };
    default:
      return {
        title: "주문 상세",
        label: status,
        badgeClass: "bg-gray-100 text-gray-700",
      };
  }
}

export default function OrderDetailPage() {
  const { orderId } = useParams();
  const order = useMemo(
    () => MOCK_ORDERS.find((item) => item.id === Number(orderId)),
    [orderId]
  );

  const [openConfirmModal, setOpenConfirmModal] = useState(false);

  if (!order) {
    return (
      <PageContainer>
        <section className="rounded-[32px] bg-white/75 px-6 py-16 text-center shadow-sm ring-1 ring-purple-100">
          <p className="mb-2 text-lg font-bold text-gray-900">
            주문 정보를 찾을 수 없어요
          </p>
          <Link
            to="/orders"
            className="text-sm font-bold text-violet-700 hover:underline"
          >
            주문 목록으로 돌아가기
          </Link>
        </section>
      </PageContainer>
    );
  }

  const statusMeta = getStatusMeta(order.status);
  const canConfirmPurchase = order.status === "CONFIRMED";

  return (
    <>
      <PageContainer>
        <section className="mb-10 flex flex-col items-center text-center">
          <div className="relative mb-6">
            <div className="absolute inset-0 scale-150 rounded-full bg-violet-300/30 blur-3xl" />
            <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-violet-700 to-fuchsia-600 shadow-2xl shadow-violet-500/20">
              <span className="text-5xl text-white">✓</span>
            </div>
          </div>

          <h1 className="mb-3 text-3xl font-extrabold tracking-tight text-gray-900 md:text-5xl">
            {statusMeta.title}
          </h1>
          <p className="max-w-lg text-base font-medium text-gray-500 md:text-lg">
            주문번호 <span className="font-bold text-violet-700">{order.orderNumber}</span>
            로 주문이 접수되었고, 알림은{" "}
            <span className="font-bold text-violet-700">{order.email}</span>
            로 발송됩니다.
          </p>
        </section>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
          <section className="relative overflow-hidden rounded-[28px] bg-white/85 p-6 shadow-sm ring-1 ring-purple-100 md:col-span-7">
            <div className="absolute right-0 top-0 h-24 w-24 rounded-bl-full bg-violet-100/40" />

            <div className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-gray-400">
                    Order Status
                  </p>
                  <span
                    className={[
                      "inline-flex rounded-full px-3 py-1 text-sm font-bold",
                      statusMeta.badgeClass,
                    ].join(" ")}
                  >
                    {statusMeta.label}
                  </span>
                </div>

                <div className="sm:text-right">
                  <p className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-gray-400">
                    Order ID
                  </p>
                  <p className="text-lg font-extrabold text-gray-900">
                    {order.orderNumber}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 rounded-2xl bg-purple-50/70 p-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                  🚚
                </div>
                <div>
                  <p className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-gray-400">
                    Estimated Delivery
                  </p>
                  <p className="text-lg font-extrabold text-gray-900">
                    {order.estimatedDelivery}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl bg-white p-5 ring-1 ring-purple-100">
                <p className="mb-3 text-lg font-extrabold tracking-tight text-gray-900">
                  배송 정보
                </p>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-500">수령인</span>
                    <span className="font-semibold text-gray-900">
                      {order.receiverName}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-500">연락처</span>
                    <span className="font-semibold text-gray-900">
                      {order.receiverPhone}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-500">배송지</span>
                    <span className="max-w-[70%] text-right font-semibold text-gray-900">
                      {order.shippingAddress}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-500">배송 메모</span>
                    <span className="max-w-[70%] text-right font-semibold text-gray-900">
                      {order.memo || "-"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-t border-purple-100 pt-6">
                <div className="mb-2 flex justify-between text-sm">
                  <span className="font-medium text-gray-500">상품 금액</span>
                  <span className="font-semibold text-gray-900">
                    {formatPrice(order.subtotal)}원
                  </span>
                </div>
                <div className="mb-4 flex justify-between text-sm">
                  <span className="font-medium text-gray-500">배송비</span>
                  <span className="font-bold text-violet-700">
                    {order.shippingFee === 0
                      ? "무료"
                      : `${formatPrice(order.shippingFee)}원`}
                  </span>
                </div>
                <div className="flex justify-between border-t border-purple-100 pt-4">
                  <span className="text-xl font-extrabold text-gray-900">
                    총 결제 금액
                  </span>
                  <span className="text-2xl font-extrabold tracking-tight text-violet-700">
                    {formatPrice(order.totalAmount)}원
                  </span>
                </div>
              </div>
            </div>
          </section>

          <section className="flex flex-col gap-6 md:col-span-5">
            <h2 className="px-1 text-xl font-extrabold tracking-tight text-gray-900">
              주문 상품
            </h2>

            <div className="space-y-4">
              {order.items.map((item) => (
                <article
                  key={item.id}
                  className="flex items-center gap-4 rounded-2xl bg-white/85 p-4 shadow-sm ring-1 ring-purple-100 transition hover:bg-purple-50/50"
                >
                  <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-white">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="flex-1">
                    <p className="font-bold leading-tight text-gray-900">
                      {item.name}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      수량: {item.quantity}개
                    </p>
                    <p className="mt-1 font-bold text-violet-700">
                      {formatPrice(item.price * item.quantity)}원
                    </p>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-2 flex flex-col gap-3">
              <Link to="/products">
                <Button size="lg" className="w-full">
                  계속 쇼핑하기
                </Button>
              </Link>

              <Link to="/orders">
                <Button
                  size="lg"
                  variant="secondary"
                  className="w-full"
                >
                  주문 목록 보기
                </Button>
              </Link>

              {canConfirmPurchase ? (
                <Button
                  size="lg"
                  variant="ghost"
                  className="w-full border border-violet-200 bg-white text-violet-700 hover:bg-violet-50"
                  onClick={() => setOpenConfirmModal(true)}
                >
                  구매 확정하기
                </Button>
              ) : null}
            </div>
          </section>
        </div>

        <div className="pointer-events-none mt-16 flex justify-center opacity-30">
          <span className="text-7xl text-violet-200">✦</span>
        </div>
      </PageContainer>

      <ConfirmModal
        open={openConfirmModal}
        onClose={() => setOpenConfirmModal(false)}
        title="구매를 확정할까요?"
        description="구매 확정 후에는 판매자 정산 대상에 포함됩니다."
        confirmText="구매 확정"
        onConfirm={() => {
          console.log("구매 확정", order.id);
          setOpenConfirmModal(false);
        }}
      />
    </>
  );
}