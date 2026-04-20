import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ApiError } from "../../api/client";
import { getOrderDetailApi } from "../../features/order/orderApi";
import PageContainer from "../../components/common/PageContainer";
import Button from "../../components/common/Button";

function formatPrice(value) {
  return new Intl.NumberFormat("ko-KR").format(Number(value ?? 0));
}

function formatDate(value) {
  if (!value) {
    return "주문 일시 없음";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatAddress(order) {
  const parts = [order?.address, order?.addressDetail].filter(Boolean);
  const address = parts.join(" ");
  const zipCode = order?.zipCode ? `(${order.zipCode})` : "";

  return [zipCode, address].filter(Boolean).join(" ");
}

function getThumbnailSrc(thumbnailKey) {
  if (typeof thumbnailKey !== "string") {
    return "";
  }

  return /^https?:\/\//.test(thumbnailKey) ? thumbnailKey : "";
}

export default function OrderDetailPage() {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadOrderDetail() {
      if (!orderId) {
        setError("잘못된 주문 ID입니다.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const result = await getOrderDetailApi(orderId);
        if (!mounted) {
          return;
        }

        setOrder(result);
      } catch (loadError) {
        if (!mounted) {
          return;
        }

        if (loadError instanceof ApiError && loadError.status === 401) {
          navigate("/login");
          return;
        }

        if (loadError instanceof ApiError && loadError.status === 404) {
          setError("주문 정보를 찾을 수 없습니다.");
          return;
        }

        setError(
          loadError instanceof ApiError
            ? loadError.message
            : "주문 상세를 불러오는 중 오류가 발생했습니다."
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadOrderDetail();

    return () => {
      mounted = false;
    };
  }, [navigate, orderId]);

  const normalizedOrder = useMemo(() => {
    if (!order) {
      return null;
    }

    const items = Array.isArray(order.items) ? order.items : [];

    return {
      ...order,
      items,
      fullAddress: formatAddress(order),
    };
  }, [order]);

  if (loading) {
    return (
      <PageContainer>
        <section className="rounded-[32px] bg-white/75 px-6 py-16 text-center shadow-sm ring-1 ring-purple-100">
          <p className="text-sm font-medium text-gray-500">
            주문 상세를 불러오는 중입니다...
          </p>
        </section>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <section className="rounded-[32px] bg-red-50 px-6 py-16 text-center shadow-sm ring-1 ring-red-100">
          <p className="mb-2 text-lg font-bold text-red-600">
            주문 상세를 불러오지 못했습니다
          </p>
          <p className="mb-6 text-sm text-red-500">{error}</p>
          <Link to="/orders" className="text-sm font-bold text-violet-700 hover:underline">
            주문 목록으로 돌아가기
          </Link>
        </section>
      </PageContainer>
    );
  }

  if (!normalizedOrder) {
    return null;
  }

  return (
    <>
      <PageContainer>
        <section className="mb-10 flex flex-col items-center text-center">
          <div className="relative mb-6">
            <div className="absolute inset-0 scale-150 rounded-full bg-violet-300/30 blur-3xl" />
            <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-violet-700 to-fuchsia-600 shadow-2xl shadow-violet-500/20">
              <span className="text-5xl text-white">O</span>
            </div>
          </div>

          <h1 className="mb-3 text-3xl font-extrabold tracking-tight text-gray-900 md:text-5xl">
            주문 상세
          </h1>
          <p className="max-w-lg text-base font-medium text-gray-500 md:text-lg">
            주문번호 <span className="font-bold text-violet-700">{normalizedOrder.orderId}</span>
            의 상세 정보를 확인할 수 있어요.
          </p>
        </section>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
          <section className="relative overflow-hidden rounded-[28px] bg-white/85 p-6 shadow-sm ring-1 ring-purple-100 md:col-span-7">
            <div className="absolute right-0 top-0 h-24 w-24 rounded-bl-full bg-violet-100/40" />

            <div className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-gray-400">
                    Order ID
                  </p>
                  <p className="text-lg font-extrabold text-gray-900">
                    {normalizedOrder.orderId}
                  </p>
                </div>

                <div className="sm:text-right">
                  <p className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-gray-400">
                    Order Date
                  </p>
                  <p className="text-lg font-extrabold text-gray-900">
                    {formatDate(normalizedOrder.createdAt)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 rounded-2xl bg-purple-50/70 p-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                  O
                </div>
                <div>
                  <p className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-gray-400">
                    Delivery Address
                  </p>
                  <p className="text-lg font-extrabold text-gray-900">
                    {normalizedOrder.fullAddress || "-"}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl bg-white p-5 ring-1 ring-purple-100">
                <p className="mb-3 text-lg font-extrabold tracking-tight text-gray-900">
                  배송 정보
                </p>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-500">받는 분</span>
                    <span className="font-semibold text-gray-900">
                      {normalizedOrder.receiver}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-500">연락처</span>
                    <span className="font-semibold text-gray-900">
                      {normalizedOrder.receiverPhone}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-500">배송지</span>
                    <span className="max-w-[70%] text-right font-semibold text-gray-900">
                      {normalizedOrder.fullAddress || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-500">상품 수</span>
                    <span className="max-w-[70%] text-right font-semibold text-gray-900">
                      {normalizedOrder.itemCount}개
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-t border-purple-100 pt-6">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-500">총 결제 금액</span>
                  <span className="font-bold text-violet-700">
                    {formatPrice(normalizedOrder.totalPrice)}원
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
              {normalizedOrder.items.map((item) => {
                const thumbnailSrc = getThumbnailSrc(item.thumbnailKey);

                return (
                  <article
                    key={item.productId}
                    className="flex items-center gap-4 rounded-2xl bg-white/85 p-4 shadow-sm ring-1 ring-purple-100 transition hover:bg-purple-50/50"
                  >
                    <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-white">
                      {thumbnailSrc ? (
                        <img
                          src={thumbnailSrc}
                          alt={item.productName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-violet-50 text-2xl font-black text-violet-700">
                          {(item.productName || "O").slice(0, 1).toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <p className="font-bold leading-tight text-gray-900">
                        {item.productName}
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        수량: {item.quantity}개
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        단가: {formatPrice(item.unitPrice)}원
                      </p>
                    </div>
                  </article>
                );
              })}
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
            </div>
          </section>
        </div>

        <div className="pointer-events-none mt-16 flex justify-center opacity-30">
          <span className="text-7xl text-violet-200">O</span>
        </div>
      </PageContainer>

    </>
  );
}
