import { useMemo, useState, useEffect } from "react";
import { Menu } from "lucide-react";

import AuctionCard from "../../components/auction/AuctionCard";
import { useAuctions } from "../../features/auction/useAuctions";

const ENDED_STATUSES = ["COMPLETED", "PENDING_PAYMENT", "FAILED"];

const FILTERS = [
  { key: "ALL", label: "전체 경매" },
  { key: "WAITING", label: "시작 전" },
  { key: "ONGOING", label: "진행 중" },
  { key: "ENDING_SOON", label: "마감 임박 (10분 이하)" },
  { key: "ENDED", label: "종료" },
];

const FILTER_COLORS = {
  ALL: "text-plum",
  WAITING: "text-plum",
  ONGOING: "text-green-600",
  ENDING_SOON: "text-red-600",
  ENDED: "text-olive",
};

const BACKEND_STATUS = {
  WAITING: "WAITING",
  ONGOING: "ONGOING",
};

export default function AuctionListPage() {
  const [filterKey, setFilterKey] = useState("ALL");
  const [page, setPage] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [keyword, setKeyword] = useState("");

  const backendStatus = BACKEND_STATUS[filterKey] ?? null;

  const { auctions, pageInfo, loading, fetching, error } = useAuctions({
    status: backendStatus,
    page,
    size: 12,
  });

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (filterKey !== "ENDING_SOON") return undefined;
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tick);
  }, [filterKey]);

  const visible = useMemo(() => {
    let result;
    if (filterKey === "ALL") {
      result = auctions.filter((a) => !ENDED_STATUSES.includes(a.status));
    } else if (filterKey === "ENDING_SOON") {
      result = auctions.filter((a) => {
        if (!a.endsAt) return false;
        const remaining = a.endsAt - now;
        return remaining > 0 && remaining < 10 * 60 * 1000;
      });
    } else if (filterKey === "ENDED") {
      result = auctions.filter((a) => ENDED_STATUSES.includes(a.status));
    } else {
      result = auctions.filter((a) => a.status === filterKey);
    }

    if (keyword.trim()) {
      const lower = keyword.toLowerCase();
      result = result.filter((a) =>
        (a.productTitle || "").toLowerCase().includes(lower),
      );
    }

    return result;
  }, [auctions, filterKey, now, keyword]);

  const handleFilterChange = (key) => {
    setFilterKey(key);
    setPage(0);
    setKeyword("");
  };

  return (
    <div className="text-left">
      {/* Page Header */}
      <div className="mb-5">
        <h1 className="text-xl font-bold text-plum">경매장</h1>
        <p className="mt-0.5 text-sm text-olive">실시간으로 진행되는 경매에 참여해보세요</p>
      </div>

      <div className="flex items-start gap-0">
        {/* Status Sidebar */}
        <aside
          className={[
            "shrink-0 transition-all duration-200",
            sidebarOpen ? "w-40" : "w-0 overflow-hidden",
          ].join(" ")}
        >
          <div className="mr-4 overflow-hidden border border-sand bg-white">
            <div className="bg-brand px-4 py-2.5">
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
                        ? `bg-fog font-semibold ${FILTER_COLORS[f.key]}`
                        : "text-plum hover:bg-fog",
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
          <div className="mb-4 border-b border-sand pb-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSidebarOpen((v) => !v)}
                  className={[
                    "flex h-8 items-center gap-1.5 border px-2 text-xs font-semibold transition",
                    sidebarOpen
                      ? "border-silver text-olive hover:bg-fog"
                      : "border-silver bg-fog text-plum hover:bg-warm",
                  ].join(" ")}
                  title="사이드바 열기/닫기"
                >
                  <Menu className="h-4 w-4" />
                  {!sidebarOpen && <span>필터</span>}
                </button>
                <h2 className="text-sm font-bold text-plum">
                  {FILTERS.find((f) => f.key === filterKey)?.label}
                </h2>
                <span className="text-xs text-silver">
                  {visible.length}개
                  {pageInfo.totalPages > 1 && ` · ${page + 1}/${pageInfo.totalPages}페이지`}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  value={keyword}
                  onChange={(e) => { setKeyword(e.target.value); setPage(0); }}
                  placeholder="상품명 검색"
                  className="h-8 border border-silver px-3 text-sm outline-none focus:border-brand"
                />
                {keyword && (
                  <button
                    type="button"
                    onClick={() => { setKeyword(""); setPage(0); }}
                    className="h-8 border border-silver px-2.5 text-xs text-olive transition hover:bg-fog"
                  >
                    초기화
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="py-20 text-center text-sm text-silver">
              경매를 불러오는 중입니다…
            </div>
          ) : error ? (
            <div className="py-20 text-center text-sm text-red-500">
              경매 목록을 불러오지 못했습니다.
            </div>
          ) : (
            <div className={fetching ? "pointer-events-none opacity-50 transition-opacity" : ""}>
              {visible.length === 0 ? (
                <div className="py-20 text-center">
                  <p className="text-sm font-semibold text-plum">
                    {keyword.trim()
                      ? `"${keyword}"에 해당하는 경매가 없습니다.`
                      : "조건에 맞는 경매가 없습니다."}
                  </p>
                  <button
                    type="button"
                    onClick={() => { handleFilterChange("ALL"); setKeyword(""); }}
                    className="mt-3 border border-silver px-4 py-1.5 text-sm text-olive transition hover:bg-fog"
                  >
                    전체 보기
                  </button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {visible.map((auction) => (
                      <AuctionCard
                        key={auction.id}
                        auction={auction}
                      />
                    ))}
                  </div>

                  {pageInfo.totalPages > 1 && (
                    <div className="mt-6 flex items-center justify-center gap-2">
                      <button
                        type="button"
                        disabled={page === 0}
                        onClick={() => setPage((p) => Math.max(0, p - 1))}
                        className="border border-silver px-4 py-1.5 text-sm text-olive transition hover:bg-fog disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        이전
                      </button>
                      <span className="text-sm text-olive">
                        {page + 1} / {pageInfo.totalPages}
                      </span>
                      <button
                        type="button"
                        disabled={!pageInfo.hasNext}
                        onClick={() => setPage((p) => p + 1)}
                        className="border border-silver px-4 py-1.5 text-sm text-olive transition hover:bg-fog disabled:cursor-not-allowed disabled:opacity-40"
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
    </div>
  );
}
