import { useEffect, useMemo, useState } from "react";

import Button from "../../components/common/Button";
import PageContainer from "../../components/common/PageContainer";
import PageHeader from "../../components/common/PageHeader";
import AuctionCard from "../../components/auction/AuctionCard";
import { useAuctions } from "../../features/auction/useAuctions";

const FILTERS = [
  { key: "ALL", label: "전체", status: null },
  { key: "ONGOING", label: "진행 중", status: "ONGOING" },
  { key: "WAITING", label: "대기 중", status: "WAITING" },
  { key: "ENDING_SOON", label: "마감 임박", status: "ONGOING" },
  { key: "COMPLETED", label: "종료", status: "COMPLETED" },
];

export default function AuctionListPage() {
  const [filterKey, setFilterKey] = useState("ALL");
  const [page, setPage] = useState(0);
  const filter = FILTERS.find((f) => f.key === filterKey) ?? FILTERS[0];
  const { auctions, pageInfo, loading, error } = useAuctions({
    status: filter.status,
    page,
    size: 9,
  });

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (filterKey !== "ENDING_SOON") {
      return undefined;
    }
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tick);
  }, [filterKey]);

  const visible = useMemo(() => {
    if (filterKey !== "ENDING_SOON") {
      return auctions;
    }

    return auctions.filter((auction) => {
      if (!auction.endsAt) {
        return false;
      }
      const remaining = auction.endsAt - now;
      return remaining > 0 && remaining < 60 * 60 * 1000;
    });
  }, [auctions, filterKey, now]);

  return (
    <PageContainer>
      <PageHeader
        title="경매장"
        action={<span className="text-sm font-medium text-gray-500">총 {pageInfo.totalElements}개</span>}
      />

      <section className="mb-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const active = f.key === filterKey;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => {
                setFilterKey(f.key);
                setPage(0);
              }}
              className={[
                "rounded-full px-4 py-2 text-sm font-semibold transition",
                active
                  ? "bg-violet-700 text-white shadow"
                  : "bg-purple-100 text-violet-800 hover:bg-purple-200",
              ].join(" ")}
            >
              {f.label}
            </button>
          );
        })}
      </section>

      {loading ? (
        <section className="rounded-[32px] bg-white/75 px-6 py-16 text-center shadow-sm ring-1 ring-purple-100">
          <p className="text-lg font-bold text-gray-900">경매를 불러오는 중입니다.</p>
        </section>
      ) : error ? (
        <section className="rounded-[32px] bg-red-50 px-6 py-16 text-center shadow-sm ring-1 ring-red-100">
          <p className="mb-2 text-lg font-bold text-red-700">경매 목록을 불러오지 못했습니다.</p>
          <p className="text-sm text-red-500">{error.message || "잠시 후 다시 시도해 주세요."}</p>
        </section>
      ) : visible.length === 0 ? (
        <section className="rounded-[32px] bg-white/75 px-6 py-16 text-center shadow-sm ring-1 ring-purple-100">
          <p className="mb-2 text-lg font-bold text-gray-900">조건에 맞는 경매가 없습니다.</p>
          <p className="text-sm text-gray-500">다른 필터를 선택해 보세요.</p>
        </section>
      ) : (
        <>
          <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {visible.map((auction) => (
              <AuctionCard key={auction.id} auction={auction} />
            ))}
          </section>

          {pageInfo.totalPages > 1 && (
            <section className="mt-8 flex items-center justify-center gap-3">
              <Button
                variant="secondary"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                이전
              </Button>
              <span className="text-sm font-medium text-gray-600">
                {page + 1} / {pageInfo.totalPages}
              </span>
              <Button
                variant="secondary"
                disabled={!pageInfo.hasNext}
                onClick={() => setPage((p) => p + 1)}
              >
                다음
              </Button>
            </section>
          )}
        </>
      )}
    </PageContainer>
  );
}
