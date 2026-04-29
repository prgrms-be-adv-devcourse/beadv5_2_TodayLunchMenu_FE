import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ApiError } from "../../api/client";
import PageContainer from "../../components/common/PageContainer";
import PageHeader from "../../components/common/PageHeader";
import Input from "../../components/common/Input";
import { getOrdersApi } from "../../features/order/orderApi";

const STATUS_OPTIONS = [
  { value: "ALL", label: "전체" },
  { value: "CONFIRMED", label: "주문 완료" },
  { value: "SHIPPING", label: "배송 중" },
  { value: "DELIVERED", label: "배송 완료" },
  { value: "COMPLETED", label: "구매 확정" },
  { value: "CANCELED", label: "취소/반품" },
];

function formatPrice(value) {
  return new Intl.NumberFormat("ko-KR").format(value);
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

function getStatusMeta(status) {
  switch (status) {
    case "CREATED":
      return { label: "결제 대기", className: "bg-amber-100 text-amber-700" };
    case "CONFIRMED":
      return { label: "주문 완료", className: "bg-violet-100 text-violet-700" };
    case "SHIPPING":
      return { label: "배송 중", className: "bg-blue-100 text-blue-700" };
    case "PARTIAL_SHIPPING":
      return { label: "일부 배송 중", className: "bg-sky-100 text-sky-700" };
    case "DELIVERED":
      return { label: "배송 완료", className: "bg-indigo-100 text-indigo-700" };
    case "COMPLETED":
      return { label: "구매 확정", className: "bg-emerald-100 text-emerald-700" };
    case "PARTIAL_CANCELED":
      return { label: "일부 취소", className: "bg-orange-100 text-orange-700" };
    case "CANCELED":
      return { label: "취소됨", className: "bg-red-100 text-red-600" };
    default:
      return { label: status, className: "bg-gray-100 text-gray-700" };
  }
}

function getThumbnailSrc(thumbnailKey) {
  if (typeof thumbnailKey !== "string") {
    return "";
  }

  return /^https?:\/\//.test(thumbnailKey) ? thumbnailKey : "";
}

const ORDER_TYPE_TABS = [
  { value: "NORMAL", label: "일반 주문" },
  { value: "AUCTION", label: "경매 주문" },
];

export default function OrderListPage() {
  const navigate = useNavigate();
  const [orderType, setOrderType] = useState("NORMAL");
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState("ALL");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadOrders() {
      try {
        setLoading(true);
        setError("");

        const page = await getOrdersApi();
        if (!mounted) {
          return;
        }

        setOrders(page.content);
      } catch (loadError) {
        if (!mounted) {
          return;
        }

        if (loadError instanceof ApiError && loadError.status === 401) {
          navigate("/login");
          return;
        }

        setError(
          loadError instanceof ApiError
            ? loadError.message
            : "주문 목록을 불러오는 중 오류가 발생했습니다."
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadOrders();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesType = order.orderType === orderType;
      const matchesStatus =
        status === "ALL" ? true :
        status === "SHIPPING" ? ["SHIPPING", "PARTIAL_SHIPPING"].includes(order.status) :
        status === "CANCELED" ? ["CANCELED", "PARTIAL_CANCELED"].includes(order.status) :
        order.status === status;
      const normalizedKeyword = keyword.trim().toLowerCase();
      const matchesKeyword = normalizedKeyword
        ? String(order.orderId || "").toLowerCase().includes(normalizedKeyword) ||
          String(order.representativeProductName || "")
            .toLowerCase()
            .includes(normalizedKeyword)
        : true;

      return matchesType && matchesStatus && matchesKeyword;
    });
  }, [keyword, orderType, orders, status]);

  return (
    <PageContainer>
      <PageHeader
        title="주문 내역"
        action={
          <span className="text-sm font-medium text-gray-500">
            총 {filteredOrders.length}건
          </span>
        }
      />

      <div className="mb-5 flex rounded-xl bg-gray-100 p-1">
        {ORDER_TYPE_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setOrderType(tab.value); setStatus("ALL"); setKeyword(""); }}
            className={`flex-1 rounded-lg py-2 text-sm font-bold transition-all ${
              orderType === tab.value
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <section className="mb-6 bg-white/80 p-4 shadow-sm ring-1 ring-gray-200">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1.5fr_1fr]">
          <Input
            placeholder="주문번호 또는 상품명 검색"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />

          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="h-14 bg-blue-100/70 px-4 text-sm text-gray-900 outline-none transition focus:ring-2 focus:ring-blue-200"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </section>

      {loading ? (
        <section className="bg-white/75 px-6 py-16 text-center shadow-sm ring-1 ring-gray-200">
          <p className="text-sm font-medium text-gray-500">주문 목록을 불러오는 중입니다...</p>
        </section>
      ) : error ? (
        <section className="bg-red-50 px-6 py-16 text-center shadow-sm ring-1 ring-red-100">
          <p className="mb-2 text-lg font-bold text-red-600">주문 목록을 불러오지 못했습니다</p>
          <p className="text-sm text-red-500">{error}</p>
        </section>
      ) : filteredOrders.length === 0 ? (
        <section className="bg-white/75 px-6 py-16 text-center shadow-sm ring-1 ring-gray-200">
          <p className="mb-2 text-lg font-bold text-gray-900">주문 내역이 없어요</p>
          <p className="text-sm text-gray-500">첫 주문을 생성하면 이곳에서 확인할 수 있어요.</p>
        </section>
      ) : (
        <section className="space-y-4">
          {filteredOrders.map((order) => {
            const statusMeta = getStatusMeta(order.status);
            const thumbnailSrc = getThumbnailSrc(order.representativeThumbnailKey);
            const isPendingAuction = order.orderType === "AUCTION" && order.status === "CREATED";

            const cardContent = (
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-20 w-20 overflow-hidden bg-blue-50">
                    {thumbnailSrc ? (
                      <img
                        src={thumbnailSrc}
                        alt={order.representativeProductName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-2xl font-black text-blue-700">
                        {(order.representativeProductName || "O").slice(0, 1).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span
                        className={[
                          "inline-flex rounded-full px-3 py-1 text-xs font-bold",
                          statusMeta.className,
                        ].join(" ")}
                      >
                        {statusMeta.label}
                      </span>
                      <span className="text-xs font-medium uppercase tracking-wider text-gray-400">
                        {formatDate(order.createdAt)}
                      </span>
                    </div>

                    <h3 className="text-lg font-extrabold tracking-tight text-gray-900">
                      {order.representativeProductName}
                      {order.itemCount > 1 ? ` 외 ${order.itemCount - 1}건` : ""}
                    </h3>

                    <p className="mt-1 text-sm font-medium text-gray-500">
                      주문번호 {order.orderId}
                    </p>
                  </div>
                </div>

                <div className="md:text-right">
                  <p className="text-sm text-gray-500">총 결제 금액</p>
                  <p className="mt-1 text-2xl font-extrabold tracking-tight text-blue-700">
                    {formatPrice(order.totalAmount)}원
                  </p>
                </div>
              </div>
            );

            if (isPendingAuction) {
              return (
                <div key={order.orderId} className="bg-white/80 p-5 shadow-sm ring-1 ring-amber-200">
                  {cardContent}
                  <div className="mt-4 border-t border-gray-100 pt-4">
                    <Link
                      to={`/orders/${order.orderId}`}
                      className="block w-full rounded-lg bg-violet-600 py-2.5 text-center text-sm font-bold text-white hover:bg-violet-700 transition"
                    >
                      주문하기
                    </Link>
                  </div>
                </div>
              );
            }

            return (
              <Link
                key={order.orderId}
                to={`/orders/${order.orderId}`}
                className="block bg-white/80 p-5 shadow-sm ring-1 ring-gray-200 transition hover:-translate-y-0.5 hover:shadow-md"
              >
                {cardContent}
              </Link>
            );
          })}
        </section>
      )}
    </PageContainer>
  );
}
