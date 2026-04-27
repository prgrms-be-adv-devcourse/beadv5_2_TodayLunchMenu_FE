import { useEffect, useMemo, useState } from "react";

import AuctionCard from "../../components/auction/AuctionCard";
import { useAuctions } from "../../features/auction/useAuctions";
import { getProductsByIdsApi } from "../../features/product/productApi";

const ENDED_STATUSES = ["COMPLETED", "PENDING_PAYMENT", "FAILED"];

const FILTERS = [
  { key: "ALL", label: "전체 경매", statuses: null },
  { key: "WAITING", label: "시작 전", statuses: ["WAITING"] },
  { key: "ONGOING", label: "진행 중", statuses: ["ONGOING"] },
  { key: "ENDING_SOON", label: "마감 임박", statuses: ["ONGOING"] },
  { key: "ENDED", label: "종료", statuses: ENDED_STATUSES },
];

const FILTER_COLORS = {
  ALL: "text-gray-800",
  WAITING: "text-blue-600",
  ONGOING: "text-green-600",
  ENDING_SOON: "text-red-600",
  ENDED: "text-gray-500",
};

export default function AuctionListPage() {
  const [filterKey, setFilterKey] = useState("ALL");
  const [page, setPage] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const filter = FILTERS.find((f) => f.key === filterKey) ?? FILTERS[0];
  const backendStatus =
    filter.statuses?.length === 1 ? filter.statuses[0] : null;

  const { auctions, pageInfo, loading, fetching, error } = useAuctions({
    status: backendStatus,
    page,
    size: 12,
  });

  const [productImageMap, setProductImageMap] = useState({});

  useEffect(() => {
    if (!auctions.length) return;
    const ids = [
      ...new Set(auctions.map((a) => a.productId).filter(Boolean)),
    ];
    if (!ids.length) return;
    getProductsByIdsApi(ids)
      .then((products) => {
        const map = Object.fromEntries(products.map((p) => [p.id, p.image]));
        setProductImageMap((prev) => ({ ...prev, ...map }));
      })
      .catch(() => {});
  }, [auctions]);

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (filterKey !== "ENDING_SOON") return undefined;
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tick);
  }, [filterKey]);

  const visible = useMemo(() => {
    if (filterKey === "ENDING_SOON") {
      return auctions.filter((a) => {
        if (!a.endsAt) return false;
        const remaining = a.endsAt - now;
        return remaining > 0 && remaining < 10 * 60 * 1000;
      });
    }
    if (filter.statuses) {
      return auctions.filter((a) => filter.statuses.includes(a.status));
    }
    return auctions;
  }, [auctions, filterKey, filter.statuses, now]);

  const handleFilterChange = (key) => {
    setFilterKey(key);
    setPage(0);
  };

  return (
    <div className="flex items-start gap-0">
      {/* Status Sidebar */}
      <aside
        className={[
          "shrink-0 transition-all duration-200",
          sidebarOpen ? "w-44" : "w-0 overflow-hidden",
        ].join(" ")}
      >
        <div className="mr-4 overflow-hidden border border-gray-200 bg-white">
          <div className="bg-gray-800 px-4 py-2.5">
            <h2 className="text-sm font-bold text-white">경매 상태</h2>
          </div>

          <nav className="py-1">
            {FILTERS.map((f) => {
              const active = f.key === filterKey;
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => handleFilterChange(f.key)}
                  className={[
                    "w-full px-4 py-2 text-left text-sm transition",
                    active
                      ? `bg-blue-50 font-semibold ${FILTER_COLORS[f.key]}`
                      : "text-gray-700 hover:bg-gray-50",
                  ].join(" ")}
                >
                  {f.label}
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <div className="min-w-0 flex-1">
        {/* Top Bar */}
        <div className="mb-4 border-b border-gray-200 pb-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSidebarOpen((v) => !v)}
                className="flex h-8 w-8 items-center justify-center rounded border border-gray-300 text-gray-500 transition hover:bg-gray-100"
                title="사이드바 열기/닫기"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <line x1="2" y1="4" x2="14" y2="4" />
                  <line x1="2" y1="8" x2="14" y2="8" />
                  <line x1="2" y1="12" x2="14" y2="12" />
                </svg>
              </button>

              <h1 className="text-sm font-bold text-gray-900">
                {filter.label}
              </h1>
              <span className="text-xs text-gray-400">
                {visible.length}개
              </span>
            </div>

            {pageInfo.totalPages > 1 && (
              <div className="flex items-center gap-2 text-sm">
                <button
                  type="button"
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className="rounded border border-gray-300 px-3 py-1 text-xs text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  이전
                </button>
                <span className="text-xs text-gray-500">
                  {page + 1} / {pageInfo.totalPages}
                </span>
                <button
                  type="button"
                  disabled={!pageInfo.hasNext}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded border border-gray-300 px-3 py-1 text-xs text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  다음
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Auction Grid */}
        {loading ? (
          <div className="py-20 text-center text-sm text-gray-500">
            경매를 불러오는 중입니다…
          </div>
        ) : error ? (
          <div className="py-20 text-center text-sm text-red-500">
            경매 목록을 불러오지 못했습니다.
          </div>
        ) : (
          <div
            className={
              fetching
                ? "pointer-events-none opacity-50 transition-opacity"
                : ""
            }
          >
            {visible.length === 0 ? (
              <div className="py-20 text-center">
                <p className="text-sm font-semibold text-gray-700">
                  조건에 맞는 경매가 없습니다.
                </p>
                <button
                  type="button"
                  onClick={() => handleFilterChange("ALL")}
                  className="mt-3 rounded border border-gray-300 px-4 py-1.5 text-sm text-gray-600 transition hover:bg-gray-100"
                >
                  전체 보기
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {visible.map((auction) => (
                    <AuctionCard
                      key={auction.id}
                      auction={auction}
                      productImage={productImageMap[auction.productId] ?? null}
                    />
                  ))}
                </div>

                {pageInfo.totalPages > 1 && (
                  <div className="mt-6 flex items-center justify-center gap-2">
                    <button
                      type="button"
                      disabled={page === 0}
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      className="rounded border border-gray-300 px-4 py-1.5 text-sm text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      이전
                    </button>
                    <span className="text-sm text-gray-500">
                      {page + 1} / {pageInfo.totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={!pageInfo.hasNext}
                      onClick={() => setPage((p) => p + 1)}
                      className="rounded border border-gray-300 px-4 py-1.5 text-sm text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      다음
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
