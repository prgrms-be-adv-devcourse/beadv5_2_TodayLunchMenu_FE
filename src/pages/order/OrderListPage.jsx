import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PageContainer from "../../components/common/PageContainer";
import PageHeader from "../../components/common/PageHeader";
import Input from "../../components/common/Input";

const MOCK_ORDERS = [
  {
    id: 10031,
    orderNumber: "ZM-10031",
    status: "CONFIRMED",
    createdAt: "2026-03-24 12:10",
    totalAmount: 28000,
    itemCount: 2,
    items: [
      {
        id: 1,
        name: "보라 머그컵",
        quantity: 1,
        image:
          "https://images.unsplash.com/photo-1514228742587-6b1558fcf93a?auto=format&fit=crop&w=800&q=80",
      },
      {
        id: 2,
        name: "제로마켓 키링",
        quantity: 2,
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
    totalAmount: 39000,
    itemCount: 1,
    items: [
      {
        id: 3,
        name: "무드 조명",
        quantity: 1,
        image:
          "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80",
      },
    ],
  },
  {
    id: 10019,
    orderNumber: "ZM-10019",
    status: "CANCELLED",
    createdAt: "2026-03-19 14:05",
    totalAmount: 12000,
    itemCount: 1,
    items: [
      {
        id: 4,
        name: "아트 포스터",
        quantity: 1,
        image:
          "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80",
      },
    ],
  },
];

const STATUS_OPTIONS = [
  { value: "ALL", label: "전체" },
  { value: "CONFIRMED", label: "주문완료" },
  { value: "COMPLETED", label: "구매확정" },
  { value: "CANCELLED", label: "취소됨" },
];

function formatPrice(value) {
  return new Intl.NumberFormat("ko-KR").format(value);
}

function getStatusMeta(status) {
  switch (status) {
    case "CONFIRMED":
      return {
        label: "주문완료",
        className: "bg-violet-100 text-violet-700",
      };
    case "COMPLETED":
      return {
        label: "구매확정",
        className: "bg-emerald-100 text-emerald-700",
      };
    case "CANCELLED":
      return {
        label: "취소됨",
        className: "bg-red-100 text-red-600",
      };
    default:
      return {
        label: status,
        className: "bg-gray-100 text-gray-700",
      };
  }
}

export default function OrderListPage() {
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState("ALL");

  const filteredOrders = useMemo(() => {
    return MOCK_ORDERS.filter((order) => {
      const matchesStatus = status === "ALL" ? true : order.status === status;
      const matchesKeyword = keyword.trim()
        ? order.orderNumber.toLowerCase().includes(keyword.toLowerCase()) ||
          order.items.some((item) =>
            item.name.toLowerCase().includes(keyword.toLowerCase())
          )
        : true;

      return matchesStatus && matchesKeyword;
    });
  }, [keyword, status]);

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

      <section className="mb-6 rounded-[28px] bg-white/80 p-4 shadow-sm ring-1 ring-purple-100">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1.5fr_1fr]">
          <Input
            placeholder="주문번호 또는 상품명 검색"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="h-14 rounded-xl bg-purple-100/70 px-4 text-sm text-gray-900 outline-none transition focus:ring-2 focus:ring-violet-300"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </section>

      {filteredOrders.length === 0 ? (
        <section className="rounded-[32px] bg-white/75 px-6 py-16 text-center shadow-sm ring-1 ring-purple-100">
          <p className="mb-2 text-lg font-bold text-gray-900">
            주문 내역이 없어요
          </p>
          <p className="text-sm text-gray-500">
            주문을 생성하면 이곳에서 확인할 수 있어요.
          </p>
        </section>
      ) : (
        <section className="space-y-4">
          {filteredOrders.map((order) => {
            const statusMeta = getStatusMeta(order.status);
            const firstItem = order.items[0];

            return (
              <Link
                key={order.id}
                to={`/orders/${order.id}`}
                className="block rounded-[28px] bg-white/80 p-5 shadow-sm ring-1 ring-purple-100 transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-20 w-20 overflow-hidden rounded-2xl bg-purple-50">
                      <img
                        src={firstItem.image}
                        alt={firstItem.name}
                        className="h-full w-full object-cover"
                      />
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
                          {order.createdAt}
                        </span>
                      </div>

                      <h3 className="text-lg font-extrabold tracking-tight text-gray-900">
                        {firstItem.name}
                        {order.itemCount > 1
                          ? ` 외 ${order.itemCount - 1}건`
                          : ""}
                      </h3>

                      <p className="mt-1 text-sm font-medium text-gray-500">
                        주문번호 {order.orderNumber}
                      </p>
                    </div>
                  </div>

                  <div className="md:text-right">
                    <p className="text-sm text-gray-500">총 결제 금액</p>
                    <p className="mt-1 text-2xl font-extrabold tracking-tight text-violet-700">
                      {formatPrice(order.totalAmount)}원
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </section>
      )}
    </PageContainer>
  );
}