import Button from "../common/Button";

function hasDraftValue(draft) {
  return Boolean(
    draft?.suggestedTitle ||
      draft?.suggestedDescription ||
      draft?.suggestedPrice ||
      draft?.notes ||
      draft?.suggestedKeywords?.length
  );
}

export default function AiProductDraftAssistant({
  disabled,
  loading,
  draft,
  error,
  helperText,
  onGenerate,
  onApply,
}) {
  const hasDraft = hasDraftValue(draft);

  return (
    <div className="rounded-2xl bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 p-4 ring-1 ring-purple-100">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-500">
            AI Assist
          </p>
          <h3 className="mt-1 text-lg font-extrabold tracking-tight text-gray-900">
            AI로 상품 초안 만들기
          </h3>
          <p className="mt-1 text-sm leading-6 text-gray-600">
            등록한 이미지를 분석해 상품명, 설명, 가격 초안을 제안합니다.
          </p>
        </div>

        <Button
          type="button"
          variant="secondary"
          onClick={onGenerate}
          disabled={disabled || loading}
          className="shrink-0"
        >
          {loading ? "이미지 분석 중..." : "AI 초안 만들기"}
        </Button>
      </div>

      {helperText ? (
        <p className="mt-3 text-sm font-medium text-violet-700">{helperText}</p>
      ) : null}

      {error ? (
        <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-600">
          {error}
        </p>
      ) : null}

      {hasDraft ? (
        <div className="mt-4 rounded-2xl bg-white/80 p-4 ring-1 ring-purple-100">
          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-violet-500">
                상품명
              </p>
              <p className="mt-1 text-sm font-bold text-gray-900">
                {draft.suggestedTitle || "-"}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-violet-500">
                가격
              </p>
              <p className="mt-1 text-sm font-bold text-gray-900">
                {draft.suggestedPrice ? `${draft.suggestedPrice}원` : "-"}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-violet-500">
                키워드
              </p>
              <p className="mt-1 text-sm font-bold text-gray-900">
                {draft.suggestedKeywords?.length
                  ? draft.suggestedKeywords.join(", ")
                  : "-"}
              </p>
            </div>
          </div>

          {draft.suggestedDescription ? (
            <p className="mt-3 line-clamp-3 text-sm leading-6 text-gray-600">
              {draft.suggestedDescription}
            </p>
          ) : null}

          {draft.notes ? (
            <p className="mt-3 rounded-xl bg-purple-50 px-3 py-2 text-xs font-medium text-violet-700">
              {draft.notes}
            </p>
          ) : null}

          <div className="mt-4 flex justify-end">
            <Button type="button" size="sm" onClick={onApply}>
              폼에 적용
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
