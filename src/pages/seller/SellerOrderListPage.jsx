import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { ApiError } from "../../api/client";
import Input from "../../components/common/Input";
import PageContainer from "../../components/common/PageContainer";
import SellerNav from "../../components/seller/SellerNav";
import { useAuth } from "../../features/auth/useAuth";
import { getPendingSellerIncomesApi } from "../../features/payment/sellerPaymentApi";

const STATUS_FILTERS = [
  { value: "ALL", label: "전체" },
  { value: "HELD", label: "정산 대기" },
  { value: "RELEASED", label: "정산 완료" },
  { value: "FAILED", label: "실패" },
];

const PAGE_SIZE = 10;

function formatKRW(value) {
  return `${new Intl.NumberFormat("ko-KR").format(Number(value) || 0)}원`;
}

function formatDate(value) {
  if (!value) {
    return "-";
  }
  return new Date(value).toLocaleString("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getEscrowStatusLabel(status) {
  switch (status) {
    case "HELD":
      return "정산 대기";
    case "RELEASED":
      return "정산 완료";
    case "FAILED":
      return "정산 실패";
    default:
      return status || "미확인";
  }
}

export default function SellerOrderListPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const isSeller = user?.role === "SELLER";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!isSeller) {
      return;
    }

    let cancelled = false;

    async function loadOrders() {
      try {
        setLoading(true);
        setError("");
        const page = await getPendingSellerIncomesApi({ page: 0, size: 100 });
        if (!cancelled) {
          setItems(page.items ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : "정산 대기 주문 목록을 불러오지 못했습니다.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadOrders();

    return () => {
      cancelled = true;
    };
  }, [isSeller]);

  const filteredItems = useMemo(() => {
    const query = keyword.trim().toLowerCase();
    return items
      .filter((item) => {
        const matchStatus =
          statusFilter === "ALL" || item.escrowStatus === statusFilter;
        if (!query) {
          return matchStatus;
        }
        const matchKeyword = String(item.orderId || "")
          .toLowerCase()
          .includes(query);
        return matchStatus && matchKeyword;
      })
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [items, keyword, statusFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [keyword, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const pagedItems = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredItems.slice(start, start + PAGE_SIZE);
  }, [filteredItems, currentPage]);

  if (authLoading) {
    return (
      <PageContainer>
        <p className="py-16 text-center text-sm text-gray-400">
          권한을 확인하는 중...
        </p>
      </PageContainer>
    );
  }

  if (!isSeller) {
    return <Navigate to="/seller/register" replace />;
  }

  return (
    <>
      <SellerNav currentPage="orders" />
      <PageContainer>
        <section className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-violet-500">
              Seller Orders
            </p>
            <h1 className="mt-1 text-2xl font-black text-gray-900">
              정산 대기 주문
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              정산 전에 확인이 필요한 주문을 모아 보여줍니다.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/seller/settlements")}
            className="rounded-full bg-violet-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-violet-500/20 transition hover:bg-violet-700"
          >
            정산 페이지로 이동
          </button>
        </section>

        <div className="mb-4">
          <Input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="orderId 검색"
          />
        </div>

        <div className="-mx-6 mb-4 overflow-x-auto">
          <div className="flex gap-2 px-6">
            {STATUS_FILTERS.map((filter) => {
              const isActive = statusFilter === filter.value;
              return (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setStatusFilter(filter.value)}
                  className={[
                    "flex-shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition",
                    isActive
                      ? "bg-violet-600 text-white"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200",
                  ].join(" ")}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
            {error}
          </div>
        )}

        {loading ? (
          <p className="py-16 text-center text-sm text-gray-400">
            주문 목록을 불러오는 중...
          </p>
        ) : filteredItems.length === 0 ? (
          <div className="rounded-2xl bg-white px-6 py-14 text-center shadow-sm ring-1 ring-violet-100">
            <p className="text-sm text-gray-500">표시할 주문이 없습니다.</p>
            <button
              type="button"
              onClick={() => navigate("/seller/settlements")}
              className="mt-4 text-sm font-semibold text-violet-700 underline underline-offset-2"
            >
              정산 페이지에서 전체 내역 보기
            </button>
          </div>
        ) : (
          <section className="space-y-3">
            {pagedItems.map((item) => (
              <article
                key={`${item.escrowId}-${item.orderId}`}
                className="rounded-2xl bg-white px-5 py-4 shadow-sm ring-1 ring-violet-100"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="text-left">
                    <p className="text-xs font-semibold text-gray-500">
                      orderId
                    </p>
                    <p className="font-mono text-sm font-bold text-gray-900">
                      {item.orderId || "-"}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      생성일 {formatDate(item.createdAt)}
                    </p>
                  </div>

                  <div className="text-left md:text-right">
                    <p className="text-xs font-semibold text-gray-500">
                      정산 대기 금액
                    </p>
                    <p className="text-lg font-black text-violet-700">
                      {formatKRW(item.amount)}
                    </p>
                    <span className="mt-1 inline-flex rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-bold text-violet-700">
                      {getEscrowStatusLabel(item.escrowStatus)}
                    </span>
                    <div className="mt-2 flex justify-start gap-2 md:justify-end">
                      <button
                        type="button"
                        onClick={() => navigate(`/orders/${item.orderId}`)}
                        className="rounded-full border border-violet-200 px-3 py-1 text-xs font-bold text-violet-700 transition hover:bg-violet-50"
                      >
                        주문 상세
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}

            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((page) => Math.max(1, page - 1))
                  }
                  disabled={currentPage === 1}
                  className="rounded-full border border-violet-200 px-3 py-1 text-xs font-bold text-violet-700 transition hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  이전
                </button>
                <span className="text-xs font-semibold text-gray-500">
                  {currentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((page) => Math.min(totalPages, page + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="rounded-full border border-violet-200 px-3 py-1 text-xs font-bold text-violet-700 transition hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  다음
                </button>
              </div>
            )}
          </section>
        )}
      </PageContainer>
    </>
  );
}
