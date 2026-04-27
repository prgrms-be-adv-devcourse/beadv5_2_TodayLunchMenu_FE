import { useMemo, useState } from "react";
import { ApiError } from "../../api/client";
import AdminNav from "../../components/admin/AdminNav";
import AdminSidebar from "../../components/admin/AdminSidebar";
import ConfirmModal from "../../components/common/ConfirmModal";
import {
  replayFailedPayoutsApi,
  requestManualFailedPayoutApi,
} from "../../features/settlement/settlementOpsApi";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function parseReplaySettlementIds(input) {
  return Array.from(
    new Set(
      String(input || "")
        .split(/[\s,]+/)
        .map((item) => item.trim())
        .filter(Boolean)
    )
  );
}

function formatCount(value) {
  return new Intl.NumberFormat("ko-KR").format(Number(value) || 0);
}

export default function AdminSettlementOpsPage() {
  const [manualSettlementId, setManualSettlementId] = useState("");
  const [replayIdsInput, setReplayIdsInput] = useState("");
  const [loadingAction, setLoadingAction] = useState(null);
  const [error, setError] = useState("");
  const [manualResult, setManualResult] = useState(null);
  const [replayResult, setReplayResult] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  const parsedReplayIds = useMemo(
    () => parseReplaySettlementIds(replayIdsInput),
    [replayIdsInput]
  );

  const canExecuteManual =
    UUID_PATTERN.test(manualSettlementId.trim()) && loadingAction === null;
  const canExecuteReplay =
    parsedReplayIds.length > 0 &&
    parsedReplayIds.length <= 100 &&
    parsedReplayIds.every((id) => UUID_PATTERN.test(id)) &&
    loadingAction === null;

  const handleManualSubmit = (event) => {
    event.preventDefault();

    if (!canExecuteManual) {
      setError("수동 재지급 settlementId는 UUID 형식이어야 합니다.");
      return;
    }

    setError("");
    setPendingAction("manual");
    setConfirmOpen(true);
  };

  const handleReplaySubmit = (event) => {
    event.preventDefault();

    if (parsedReplayIds.length === 0) {
      setError("replay 대상 settlementId를 1개 이상 입력해 주세요.");
      return;
    }

    if (parsedReplayIds.length > 100) {
      setError("replay 대상 settlementId는 최대 100개까지 허용됩니다.");
      return;
    }

    if (!parsedReplayIds.every((id) => UUID_PATTERN.test(id))) {
      setError("replay 대상 settlementId는 모두 UUID 형식이어야 합니다.");
      return;
    }

    setError("");
    setPendingAction("replay");
    setConfirmOpen(true);
  };

  const executePendingAction = async () => {
    try {
      setLoadingAction(pendingAction);
      setError("");

      if (pendingAction === "manual") {
        const response = await requestManualFailedPayoutApi(
          manualSettlementId.trim()
        );
        setManualResult(response);
      } else if (pendingAction === "replay") {
        const response = await replayFailedPayoutsApi(parsedReplayIds);
        setReplayResult(response);
      }
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error("[AdminSettlementOpsPage] executePendingAction failed", err);
      }
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("정산 운영 작업 중 예기치 못한 오류가 발생했습니다.");
      }
    } finally {
      setLoadingAction(null);
      setPendingAction(null);
      setConfirmOpen(false);
    }
  };

  const confirmTitle =
    pendingAction === "manual" ? "수동 재지급 요청 확인" : "DLQ replay 실행 확인";
  const confirmMessage =
    pendingAction === "manual"
      ? "입력한 settlementId로 수동 재지급을 요청합니다. 계속 진행할까요?"
      : "입력한 settlementId 목록으로 replay를 실행합니다. 계속 진행할까요?";

  return (
    <div className="min-h-screen bg-[#fdf3ff] text-[#38274c]">
      <AdminNav currentPage="settlement-ops" />
      <AdminSidebar currentPage="settlement-ops" />

      <div className="flex min-h-screen">
        <main className="w-full px-4 pb-12 pt-24 lg:ml-64 lg:p-8 lg:pt-24">
          <header className="mb-8 flex items-end justify-between">
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight text-[#38274c]">
                정산 운영 조치
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                FAILED 정산건 수동 재지급과 replay 작업을 실행합니다.
              </p>
            </div>
          </header>

          {error && (
            <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {error}
            </div>
          )}

          <div className="mb-8 grid gap-6 md:grid-cols-2">
            <section className="overflow-hidden rounded-[32px] bg-white shadow-xl shadow-violet-900/5 ring-1 ring-violet-100">
              <div className="border-b border-violet-100 p-6">
                <h2 className="mb-1 text-xl font-extrabold text-[#38274c]">
                  수동 재지급 요청
                </h2>
                <p className="text-sm text-slate-500">
                  단일 settlementId를 입력해 수동 재지급을 요청합니다.
                </p>
              </div>

              <form className="space-y-4 p-6" onSubmit={handleManualSubmit}>
                <label className="block">
                  <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                    settlementId (UUID)
                  </span>
                  <input
                    type="text"
                    value={manualSettlementId}
                    onChange={(event) => setManualSettlementId(event.target.value)}
                    placeholder="예: 123e4567-e89b-12d3-a456-426614174000"
                    className="w-full rounded-2xl border border-violet-200 bg-white px-4 py-3 text-sm text-[#38274c] outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                  />
                </label>

                <button
                  type="submit"
                  disabled={!canExecuteManual}
                  className="w-full rounded-full bg-violet-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-violet-500/20 transition hover:scale-[1.02] hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
                >
                  {loadingAction === "manual" ? "처리 중..." : "수동 재지급 요청"}
                </button>
              </form>

              {manualResult && (
                <div className="mx-6 mb-6 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 p-4 ring-1 ring-emerald-200">
                  <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-emerald-600">
                    실행 결과
                  </p>
                  <div className="space-y-2 text-sm">
                    <p className="text-slate-700">
                      settlementId: <span className="font-mono">{manualResult.settlementId || "-"}</span>
                    </p>
                    <p className="text-slate-700">
                      requested: <span className="font-semibold">{String(Boolean(manualResult.requested))}</span>
                    </p>
                    <p className="text-slate-700">
                      message: <span className="font-semibold">{manualResult.message || "-"}</span>
                    </p>
                  </div>
                </div>
              )}
            </section>

            <section className="overflow-hidden rounded-[32px] bg-white shadow-xl shadow-violet-900/5 ring-1 ring-violet-100">
              <div className="border-b border-violet-100 p-6">
                <h2 className="mb-1 text-xl font-extrabold text-[#38274c]">
                  FAILED 정산건 replay
                </h2>
                <p className="text-sm text-slate-500">
                  settlementId를 공백 또는 콤마로 구분해 여러 건 replay를 실행합니다.
                </p>
              </div>

              <form className="space-y-4 p-6" onSubmit={handleReplaySubmit}>
                <label className="block">
                  <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                    settlementIds (최대 100개)
                  </span>
                  <textarea
                    rows={6}
                    value={replayIdsInput}
                    onChange={(event) => setReplayIdsInput(event.target.value)}
                    placeholder="UUID를 줄바꿈 또는 콤마로 입력"
                    className="w-full resize-y rounded-2xl border border-violet-200 bg-white px-4 py-3 text-sm text-[#38274c] outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                  />
                </label>

                <p className="text-xs text-slate-500">
                  인식된 ID: <span className="font-semibold text-[#38274c]">{formatCount(parsedReplayIds.length)}개</span>
                </p>

                <button
                  type="submit"
                  disabled={!canExecuteReplay}
                  className="w-full rounded-full bg-orange-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition hover:scale-[1.02] hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
                >
                  {loadingAction === "replay" ? "처리 중..." : "replay 실행"}
                </button>
              </form>

              {replayResult && (
                <div className="mx-6 mb-6 rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 p-4 ring-1 ring-blue-200">
                  <p className="mb-4 text-xs font-black uppercase tracking-[0.18em] text-blue-600">
                    실행 결과
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-white p-3">
                      <p className="text-xs font-medium text-slate-500">requestedRetryCount</p>
                      <p className="mt-1 text-xl font-black text-[#38274c]">
                        {formatCount(replayResult.requestedRetryCount)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-white p-3">
                      <p className="text-xs font-medium text-slate-500">manualActionRequiredCount</p>
                      <p className="mt-1 text-xl font-black text-amber-600">
                        {formatCount(replayResult.manualActionRequiredCount)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-white p-3">
                      <p className="text-xs font-medium text-slate-500">skippedCount</p>
                      <p className="mt-1 text-xl font-black text-slate-700">
                        {formatCount(replayResult.skippedCount)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-white p-3">
                      <p className="text-xs font-medium text-slate-500">notFoundCount</p>
                      <p className="mt-1 text-xl font-black text-rose-600">
                        {formatCount(replayResult.notFoundCount)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>
        </main>
      </div>

      <ConfirmModal
        open={confirmOpen}
        onClose={() => {
          if (!loadingAction) {
            setConfirmOpen(false);
            setPendingAction(null);
          }
        }}
        title={confirmTitle}
        description={confirmMessage}
        confirmText={loadingAction ? "진행 중..." : "확인"}
        cancelText="취소"
        onConfirm={executePendingAction}
      />
    </div>
  );
}
