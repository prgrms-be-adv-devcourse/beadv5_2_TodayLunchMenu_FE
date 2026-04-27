import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ApiError } from "../../api/client";
import {
  cancelOrderApi,
  confirmOrderItemApi,
  getDeliveryTrackingApi,
  getOrderDetailApi,
  getOrderPaymentApi,
} from "../../features/order/orderApi";
import PageContainer from "../../components/common/PageContainer";
import Button from "../../components/common/Button";
import ConfirmModal from "../../components/common/ConfirmModal";
import Modal from "../../components/common/Modal";

function formatPaymentMethod(method) {
  switch (method) {
    case "WALLET": return "예치금";
    case "CARD":   return "카드";
    case "MIXED":  return "예치금 + 카드";
    default:       return method;
  }
}

function formatPrice(value) {
  return new Intl.NumberFormat("ko-KR").format(Number(value ?? 0));
}

function formatDate(value) {
  if (!value) return "날짜 없음";
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

function formatOrderNumber(orderId, createdAt) {
  const date = createdAt ? new Date(createdAt) : null;
  const datePart =
    date && !isNaN(date.getTime())
      ? `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`
      : "00000000";
  const idPart = (orderId || "").replace(/-/g, "").slice(0, 6).toUpperCase();
  return `#${datePart}-${idPart}`;
}

function getOrderStatusMeta(status) {
  switch (status?.toUpperCase()) {
    case "CREATED":         return { label: "결제 대기",    className: "bg-amber-100 text-amber-700" };
    case "CONFIRMED":       return { label: "주문 완료",    className: "bg-violet-100 text-violet-700" };
    case "SHIPPING":        return { label: "배송 중",      className: "bg-blue-100 text-blue-700" };
    case "PARTIAL_SHIPPING":return { label: "일부 배송 중", className: "bg-sky-100 text-sky-700" };
    case "DELIVERED":       return { label: "배송 완료",    className: "bg-indigo-100 text-indigo-700" };
    case "COMPLETED":       return { label: "구매 확정",    className: "bg-emerald-100 text-emerald-700" };
    case "PARTIAL_CANCELED":return { label: "일부 취소",    className: "bg-orange-100 text-orange-700" };
    case "CANCELED":        return { label: "취소됨",       className: "bg-red-100 text-red-600" };
    default:                return { label: status ?? "알 수 없음", className: "bg-gray-100 text-gray-700" };
  }
}

function getItemStatusMeta(status) {
  switch (status?.toUpperCase()) {
    case "PENDING":   return { label: "주문 접수",   className: "bg-amber-100 text-amber-700" };
    case "PREPARING": return { label: "상품 준비 중", className: "bg-violet-100 text-violet-700" };
    case "SHIPPING":  return { label: "배송 중",     className: "bg-blue-100 text-blue-700" };
    case "DELIVERED": return { label: "배송 완료",   className: "bg-indigo-100 text-indigo-700" };
    case "COMPLETED": return { label: "구매 확정",   className: "bg-emerald-100 text-emerald-700" };
    case "CANCELED":  return { label: "취소됨",      className: "bg-red-100 text-red-600" };
    default:          return { label: status ?? "알 수 없음", className: "bg-gray-100 text-gray-700" };
  }
}

function getThumbnailSrc(thumbnailKey) {
  if (typeof thumbnailKey !== "string") return "";
  return /^https?:\/\//.test(thumbnailKey) ? thumbnailKey : "";
}

function Divider() {
  return <hr className="border-gray-100" />;
}

export default function OrderDetailPage() {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [itemActionModal, setItemActionModal] = useState({
    open: false,
    type: null,
    item: null,
    loading: false,
    error: "",
  });

  const [trackingModal, setTrackingModal] = useState({
    open: false,
    data: null,
    loading: false,
    error: "",
  });

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
        const [orderResult, paymentResult] = await Promise.allSettled([
          getOrderDetailApi(orderId),
          getOrderPaymentApi(orderId),
        ]);
        if (!mounted) return;
        if (orderResult.status === "fulfilled") {
          setOrder(orderResult.value);
        } else {
          throw orderResult.reason;
        }
        if (paymentResult.status === "fulfilled") {
          setPayment(paymentResult.value);
        }
      } catch (loadError) {
        if (!mounted) return;

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
        if (mounted) setLoading(false);
      }
    }

    loadOrderDetail();
    return () => { mounted = false; };
  }, [navigate, orderId]);

  async function handleOpenTracking(deliveryId) {
    setTrackingModal({ open: true, data: null, loading: true, error: "" });
    try {
      const data = await getDeliveryTrackingApi(deliveryId);
      setTrackingModal((prev) => ({ ...prev, data, loading: false }));
    } catch (err) {
      setTrackingModal((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof ApiError ? err.message : "배송 정보를 불러오지 못했습니다.",
      }));
    }
  }

  function openItemAction(type, item) {
    setItemActionModal({ open: true, type, item, loading: false, error: "" });
  }

  async function handleItemAction() {
    const { type, item } = itemActionModal;
    setItemActionModal((prev) => ({ ...prev, loading: true, error: "" }));

    try {
      if (type === "confirm") {
        await confirmOrderItemApi(orderId, item.orderItemId);
      } else if (type === "return") {
        await cancelOrderApi(orderId, { reason: "구매자 반품 요청" });
      }
      setItemActionModal({ open: false, type: null, item: null, loading: false, error: "" });
      const refreshed = await getOrderDetailApi(orderId);
      setOrder(refreshed);
    } catch (err) {
      setItemActionModal((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof ApiError ? err.message : "처리 중 오류가 발생했습니다.",
      }));
    }
  }

  const normalizedOrder = useMemo(() => {
    if (!order) return null;
    return {
      ...order,
      items: Array.isArray(order.items) ? order.items : [],
    };
  }, [order]);

  if (loading) {
    return (
      <PageContainer>
        <p className="py-16 text-center text-sm text-gray-500">주문 상세를 불러오는 중입니다...</p>
        <section className="bg-white/75 px-6 py-16 text-center shadow-sm ring-1 ring-gray-200">
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
        <div className="rounded-[28px] bg-red-50 px-6 py-16 text-center ring-1 ring-red-100">
          <p className="mb-2 text-lg font-bold text-red-600">주문 상세를 불러오지 못했습니다</p>
        <section className="bg-red-50 px-6 py-16 text-center shadow-sm ring-1 ring-red-100">
          <p className="mb-2 text-lg font-bold text-red-600">
            주문 상세를 불러오지 못했습니다
          </p>
          <p className="mb-6 text-sm text-red-500">{error}</p>
          <Link to="/orders" className="text-sm font-bold text-blue-700 hover:underline">
            주문 목록으로 돌아가기
          </Link>
        </div>
      </PageContainer>
    );
  }

  if (!normalizedOrder) return null;

  const orderStatusMeta = getOrderStatusMeta(normalizedOrder.status);
  const productTotal = normalizedOrder.items.reduce(
    (sum, item) => sum + Number(item.totalPrice ?? 0),
    0
  );

  return (
    <>
      <PageContainer>
        <div className="mx-auto max-w-2xl space-y-10 text-left">

          {/* 헤더 */}
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900" style={{ marginBottom: '0.875rem' }}>
              주문 상세
            </h1>
            <div className="rounded-[20px] bg-white p-6 shadow-sm ring-1 ring-purple-100 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">주문번호</span>
                <span className="font-semibold text-gray-900">
                  {formatOrderNumber(normalizedOrder.orderId, normalizedOrder.createdAt)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">주문일시</span>
                <span className="font-semibold text-gray-900">
                  {formatDate(normalizedOrder.createdAt)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">배송 상태</span>
                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${orderStatusMeta.className}`}>
                  {orderStatusMeta.label}
                </span>
        <section className="mb-10 flex flex-col items-center text-center">
          <div className="relative mb-6">
            <div className="absolute inset-0 scale-150 rounded-full bg-blue-200/30 blur-3xl" />
            <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-blue-700 shadow-2xl">
              <span className="text-5xl text-white">O</span>
            </div>
          </div>

          <h1 className="mb-3 text-3xl font-extrabold tracking-tight text-gray-900 md:text-5xl">
            주문 상세
          </h1>
          <p className="max-w-lg text-base font-medium text-gray-500 md:text-lg">
            주문번호 <span className="font-bold text-blue-700">{normalizedOrder.orderId}</span>
            의 상세 정보를 확인할 수 있어요.
          </p>
        </section>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
          <section className="relative overflow-hidden bg-white/85 p-6 shadow-sm ring-1 ring-gray-200 md:col-span-7">
            <div className="absolute right-0 top-0 h-24 w-24 rounded-bl-full bg-blue-100/40" />

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

              <div className="flex items-center gap-4 bg-blue-50/70 p-5">
                <div className="flex h-12 w-12 items-center justify-center bg-blue-100 text-blue-700">
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

              <div className="bg-white p-5 ring-1 ring-gray-200">
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

              <div className="border-t border-gray-200 pt-6">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-500">총 결제 금액</span>
                  <span className="font-bold text-blue-700">
                    {formatPrice(normalizedOrder.totalPrice)}원
                  </span>
                </div>
              </div>
            </div>
          </div>

          <Divider />

          {/* 주문 상품 */}
          <div>
            <h2 className="text-lg font-extrabold text-gray-900" style={{ marginBottom: '0.875rem' }}>주문 상품</h2>
            <div className="space-y-4">
              {normalizedOrder.items.map((item) => {
                const thumbnailSrc = getThumbnailSrc(item.thumbnailKey);
                const statusMeta = getItemStatusMeta(item.status);
                const itemStatus = item.status?.toUpperCase();
                const showTracking = item.deliveryId && ["SHIPPING", "DELIVERED", "COMPLETED"].includes(itemStatus);
                const showConfirm = itemStatus === "DELIVERED";
                const showReturn = ["SHIPPING", "DELIVERED"].includes(itemStatus);

                return (
                  <div
                    key={item.orderItemId ?? item.productId}
                    className="rounded-[20px] bg-white p-5 shadow-sm ring-1 ring-purple-100"
                  >
                    <div className="flex items-start gap-4">
                      <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-violet-50">
                        {thumbnailSrc ? (
                          <img src={thumbnailSrc} alt={item.productName} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-2xl font-black text-violet-700">
                            {(item.productName || "O").slice(0, 1).toUpperCase()}
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-bold text-gray-900">{item.productName}</p>
                          <span className={`flex-shrink-0 inline-flex rounded-full px-2 py-0.5 text-xs font-bold ${statusMeta.className}`}>
                            {statusMeta.label}
                          </span>
                  <article
                    key={item.productId}
                    className="flex items-center gap-4 bg-white/85 p-4 shadow-sm ring-1 ring-gray-200 transition hover:bg-blue-50/50"
                  >
                    <div className="h-20 w-20 flex-shrink-0 overflow-hidden bg-white">
                      {thumbnailSrc ? (
                        <img
                          src={thumbnailSrc}
                          alt={item.productName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-blue-50 text-2xl font-black text-blue-700">
                          {(item.productName || "O").slice(0, 1).toUpperCase()}
                        </div>
                        <p className="mt-1.5 text-sm text-gray-500">수량: {item.quantity}개</p>
                        <p className="mt-0.5 text-sm text-gray-500">
                          상품 금액: {formatPrice(item.totalPrice)}원
                        </p>
                      </div>
                    </div>

                    {(showTracking || showConfirm || showReturn) && (
                      <div className="mt-3 flex gap-2 border-t border-gray-100 pt-3">
                        {showTracking && (
                          <button
                            type="button"
                            onClick={() => handleOpenTracking(item.deliveryId)}
                            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-50 transition"
                          >
                            배송 조회
                          </button>
                        )}
                        {showConfirm && (
                          <button
                            type="button"
                            onClick={() => openItemAction("confirm", item)}
                            className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-violet-700 transition"
                          >
                            구매 확정
                          </button>
                        )}
                        {showReturn && !showConfirm && (
                          <button
                            type="button"
                            onClick={() => openItemAction("return", item)}
                            className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-bold text-red-400 hover:bg-red-50 transition"
                          >
                            반품 신청
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <Divider />

          {/* 배송 정보 */}
          <div>
            <h2 className="text-lg font-extrabold text-gray-900" style={{ marginBottom: '0.875rem' }}>배송 정보</h2>
            <div className="rounded-[20px] bg-white p-6 shadow-sm ring-1 ring-purple-100 space-y-4 text-sm">
              <div>
                <p className="text-gray-400">받는 분</p>
                <p className="mt-1 font-semibold text-gray-900">{normalizedOrder.receiver || "-"}</p>
              </div>
              <div>
                <p className="text-gray-400">연락처</p>
                <p className="mt-1 font-semibold text-gray-900">{normalizedOrder.receiverPhone || "-"}</p>
              </div>
              <div>
                <p className="text-gray-400">배송 주소</p>
                <p className="mt-1 font-semibold text-gray-900">
                  {[normalizedOrder.address, normalizedOrder.addressDetail].filter(Boolean).join(" ") || "-"}
                </p>
                {normalizedOrder.zipCode && (
                  <p className="mt-0.5 text-gray-500">({normalizedOrder.zipCode})</p>
                )}
              </div>
              {normalizedOrder.deliveryMemo && (
                <div>
                  <p className="text-gray-400">배송 요청사항</p>
                  <p className="mt-1 font-semibold text-gray-900">{normalizedOrder.deliveryMemo}</p>
                </div>
              )}
            </div>
          </div>

          <Divider />

          {/* 결제 정보 */}
          <div>
            <h2 className="text-lg font-extrabold text-gray-900" style={{ marginBottom: '0.875rem' }}>결제 정보</h2>
            <div className="rounded-[20px] bg-white p-6 shadow-sm ring-1 ring-purple-100 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">상품 금액</span>
                <span className="font-semibold text-gray-900">{formatPrice(productTotal)}원</span>
              </div>
              <div className="flex justify-between border-t border-gray-100 pt-3">
                <span className="font-bold text-gray-900">총 결제 금액</span>
                <span className="font-extrabold text-violet-700">{formatPrice(normalizedOrder.totalPrice)}원</span>
              </div>
              {payment?.paymentMethod && (
                <div className="flex justify-between border-t border-gray-100 pt-3">
                  <span className="text-gray-400">결제 수단</span>
                  <span className="font-semibold text-gray-900">{formatPaymentMethod(payment.paymentMethod)}</span>
                </div>
              )}
            </div>
          </div>

        <div className="pointer-events-none mt-16 flex justify-center opacity-30">
          <span className="text-7xl text-blue-200">O</span>
        </div>
      </PageContainer>

      {/* 아이템 구매확정 / 반품신청 모달 */}
      <ConfirmModal
        open={itemActionModal.open}
        onClose={() => setItemActionModal({ open: false, type: null, item: null, loading: false, error: "" })}
        title={itemActionModal.type === "confirm" ? "구매를 확정하시겠어요?" : "반품을 신청하시겠어요?"}
        description={
          itemActionModal.type === "confirm"
            ? "구매 확정 후에는 취소 또는 반품 신청이 어렵습니다. 상품을 정상적으로 수령하셨나요?"
            : "반품 신청 후 수거가 완료되면 환불 처리됩니다."
        }
        confirmText={
          itemActionModal.loading
            ? "처리 중..."
            : itemActionModal.type === "confirm"
            ? "구매 확정"
            : "반품 신청"
        }
        confirmVariant={itemActionModal.type === "confirm" ? "primary" : "danger"}
        onConfirm={handleItemAction}
      >
        {itemActionModal.error && (
          <p className="mt-2 text-sm font-medium text-red-600">{itemActionModal.error}</p>
        )}
      </ConfirmModal>

      {/* 배송 조회 모달 */}
      <Modal
        open={trackingModal.open}
        onClose={() => setTrackingModal((prev) => ({ ...prev, open: false }))}
        title="배송 조회"
        footer={
          <Button variant="secondary" onClick={() => setTrackingModal((prev) => ({ ...prev, open: false }))}>
            닫기
          </Button>
        }
      >
        {trackingModal.loading ? (
          <p className="py-6 text-center text-sm text-gray-500">배송 정보를 불러오는 중입니다...</p>
        ) : trackingModal.error ? (
          <p className="py-6 text-center text-sm font-medium text-red-600">{trackingModal.error}</p>
        ) : trackingModal.data ? (
          <div className="space-y-4">
            <div className="flex gap-4 rounded-2xl bg-purple-50 p-4 text-sm">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400">택배사</p>
                <p className="mt-1 font-bold text-gray-900">{trackingModal.data.courierCode || "-"}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400">운송장 번호</p>
                <p className="mt-1 font-bold text-gray-900">{trackingModal.data.invoiceNumber || "-"}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400">배송 완료</p>
                <p className={`mt-1 font-bold ${trackingModal.data.delivered ? "text-emerald-600" : "text-gray-500"}`}>
                  {trackingModal.data.delivered ? "완료" : "배송 중"}
                </p>
              </div>
            </div>
            {trackingModal.data.details.length === 0 ? (
              <p className="py-4 text-center text-sm text-gray-400">배송 이력이 없습니다.</p>
            ) : (
              <ol className="relative border-l-2 border-violet-100 pl-5">
                {trackingModal.data.details.map((detail, idx) => (
                  <li key={idx} className="mb-4 last:mb-0">
                    <span className="absolute -left-[5px] mt-1 flex h-2.5 w-2.5 rounded-full bg-violet-400" />
                    <p className="text-xs text-gray-400">{detail.time}</p>
                    <p className="font-semibold text-gray-900">{detail.status}</p>
                    {detail.location && <p className="text-sm text-gray-500">{detail.location}</p>}
                  </li>
                ))}
              </ol>
            )}
          </div>
        ) : null}
      </Modal>
    </>
  );
}
