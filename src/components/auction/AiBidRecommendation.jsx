import Button from "../common/Button";

function formatKRW(value) {
  return new Intl.NumberFormat("ko-KR").format(Number(value || 0));
}

export default function AiBidRecommendation({
  recommendation,
  loading,
  error,
  disabled,
  onRequest,
  onApply,
}) {
  const hasRecommendation = Boolean(recommendation?.recommendedBidPrice);

  return (
    <div className="mt-4 rounded-2xl bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 p-4 ring-1 ring-purple-100">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-violet-500">
            AI Bid Assist
          </p>
          <h4 className="mt-1 text-base font-extrabold tracking-tight text-gray-900">
            AI 추천 입찰가
          </h4>
          <p className="mt-1 text-xs leading-5 text-gray-500">
            현재 흐름과 남은 시간을 바탕으로 참고 입찰가를 계산합니다.
          </p>
        </div>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={disabled || loading}
          onClick={onRequest}
          className="shrink-0"
        >
          {loading ? "추천 계산 중..." : "추천 받기"}
        </Button>
      </div>

      {error ? (
        <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
          {error}
        </p>
      ) : null}

      {hasRecommendation ? (
        <div className="mt-4 rounded-2xl bg-white/80 p-4 ring-1 ring-purple-100">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-violet-500">
                추천 입찰가
              </p>
              <p className="mt-1 text-xl font-extrabold tabular-nums text-violet-700">
                {formatKRW(recommendation.recommendedBidPrice)}원
              </p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-violet-500">
                예상 형성가
              </p>
              <p className="mt-1 text-xl font-extrabold tabular-nums text-gray-900">
                {formatKRW(recommendation.expectedFinalPrice)}원
              </p>
            </div>
          </div>

          {recommendation.priceReason ? (
            <p className="mt-3 text-xs leading-5 text-gray-600">
              {recommendation.priceReason}
            </p>
          ) : null}

          {recommendation.notes ? (
            <p className="mt-3 rounded-xl bg-purple-50 px-3 py-2 text-[11px] font-medium leading-5 text-violet-700">
              {recommendation.notes}
            </p>
          ) : null}

          <Button
            type="button"
            size="sm"
            className="mt-4 w-full"
            onClick={onApply}
          >
            추천가 입력
          </Button>
        </div>
      ) : null}
    </div>
  );
}
