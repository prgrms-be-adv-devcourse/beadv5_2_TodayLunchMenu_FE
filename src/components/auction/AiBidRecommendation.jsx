import Button from "../common/Button";

function formatPrice(value) {
  return `${new Intl.NumberFormat("ko-KR").format(Number(value || 0))}원`;
}

function MetricCard({ label, value, tone = "default" }) {
  const toneClass = {
    default: "text-gray-900",
    accent: "text-violet-700",
  };

  return (
    <div className="rounded-2xl bg-white/80 px-4 py-3 ring-1 ring-purple-100">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-violet-500">
        {label}
      </p>
      <p className={["mt-1 text-xl font-extrabold tabular-nums", toneClass[tone]].join(" ")}>
        {value}
      </p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="mt-4 rounded-[24px] bg-white/75 p-4 ring-1 ring-purple-100">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-purple-50 px-4 py-3">
          <div className="h-3 w-20 animate-pulse rounded-full bg-purple-100" />
          <div className="mt-3 h-7 w-28 animate-pulse rounded-full bg-purple-100" />
        </div>
        <div className="rounded-2xl bg-purple-50 px-4 py-3">
          <div className="h-3 w-24 animate-pulse rounded-full bg-purple-100" />
          <div className="mt-3 h-7 w-32 animate-pulse rounded-full bg-purple-100" />
        </div>
      </div>
      <div className="mt-3 h-3 w-full animate-pulse rounded-full bg-purple-100" />
      <div className="mt-2 h-3 w-4/5 animate-pulse rounded-full bg-purple-100" />
    </div>
  );
}

export default function AiBidRecommendation({
  recommendation,
  loading,
  error,
  disabled,
  stale = false,
  staleReason = "",
  currentPrice = 0,
  nextMinimumBidPrice = 0,
  onRequest,
  onApply,
}) {
  const hasRecommendation = Boolean(recommendation?.recommendedBidPrice);
  const showEmptyState = !loading && !error && !hasRecommendation;
  const canApply =
    hasRecommendation &&
    !stale &&
    recommendation.recommendedBidPrice >= nextMinimumBidPrice;

  return (
    <div className="mt-4 overflow-hidden rounded-[28px] bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 ring-1 ring-purple-100">
      <div className="relative p-5">
        <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-violet-300/70 to-transparent" />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-violet-500">
                AI Bid Assist
              </p>
              {hasRecommendation ? (
                <span
                  className={[
                    "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold",
                    stale
                      ? "bg-amber-100 text-amber-700"
                      : "bg-emerald-100 text-emerald-700",
                  ].join(" ")}
                >
                  {stale ? "재추천 필요" : "추천 준비됨"}
                </span>
              ) : null}
            </div>
            <h4 className="mt-1 text-base font-extrabold tracking-tight text-gray-900">
              AI 추천 입찰 가이드
            </h4>
            <p className="mt-1 text-xs leading-5 text-gray-500">
              현재 최고가와 남은 시간을 바탕으로 참고용 추천 입찰가를 보여드려요.
            </p>
          </div>

          <Button
            type="button"
            variant={hasRecommendation ? "ghost" : "secondary"}
            size="sm"
            disabled={disabled || loading}
            onClick={onRequest}
            className="shrink-0"
          >
            {loading ? "분석 중..." : hasRecommendation ? "다시 추천받기" : "AI 추천받기"}
          </Button>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <MetricCard label="현재 최고 입찰가" value={formatPrice(currentPrice)} />
          <MetricCard
            label="다음 최소 입찰가"
            value={formatPrice(nextMinimumBidPrice)}
            tone="accent"
          />
        </div>

        {loading ? <LoadingState /> : null}

        {error ? (
          <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-xs font-medium text-red-600 ring-1 ring-red-100">
            {error}
          </p>
        ) : null}

        {showEmptyState ? (
          <div className="mt-4 rounded-[24px] border border-dashed border-purple-200 bg-white/65 px-4 py-5 text-center">
            <p className="text-sm font-bold text-gray-900">지금 시점에 맞는 입찰가를 추천받아보세요</p>
            <p className="mt-1 text-xs leading-5 text-gray-500">
              추천 결과는 현재 경매 흐름과 함께 같은 화면에서 바로 비교할 수 있어요.
            </p>
          </div>
        ) : null}

        {hasRecommendation ? (
          <div className="mt-4 rounded-[24px] bg-white/80 p-4 ring-1 ring-purple-100">
            {stale ? (
              <div className="mb-3 rounded-2xl bg-amber-50 px-4 py-3 text-xs font-medium leading-5 text-amber-700 ring-1 ring-amber-100">
                {staleReason || "실시간 경매 상황이 바뀌어 추천을 다시 계산하는 것이 좋아요."}
              </div>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2">
              <MetricCard
                label="추천 입찰가"
                value={formatPrice(recommendation.recommendedBidPrice)}
                tone="accent"
              />
              <MetricCard
                label="예상 낙찰가"
                value={formatPrice(recommendation.expectedFinalPrice)}
              />
            </div>

            {recommendation.priceReason ? (
              <div className="mt-3 rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                  추천 이유
                </p>
                <p className="mt-2 text-xs leading-5 text-slate-700">
                  {recommendation.priceReason}
                </p>
              </div>
            ) : null}

            {recommendation.notes ? (
              <p className="mt-3 rounded-2xl bg-purple-50 px-4 py-3 text-[11px] font-medium leading-5 text-violet-700">
                {recommendation.notes}
              </p>
            ) : null}

            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                size="sm"
                className="flex-1"
                disabled={!canApply}
                onClick={onApply}
              >
                {canApply ? "추천가 입력" : "재추천 후 입력"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="flex-1"
                disabled={disabled || loading}
                onClick={onRequest}
              >
                추천 다시 계산
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
