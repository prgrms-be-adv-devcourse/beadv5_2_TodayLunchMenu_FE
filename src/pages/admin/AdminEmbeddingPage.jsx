import { useState } from 'react';
import { ApiError } from '../../api/client';
import { backfillMissingEmbeddingsApi, reindexAllEmbeddingsApi } from '../../features/ai/embeddingAdminApi';
import AdminNav from '../../components/admin/AdminNav';
import AdminSidebar from '../../components/admin/AdminSidebar';

function AdminEmbeddingPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [lastCompletedAction, setLastCompletedAction] = useState(null);

  const handleBackfillMissing = () => {
    setPendingAction('backfill');
    setShowConfirmModal(true);
  };

  const handleReindexAll = () => {
    setPendingAction('reindex');
    setShowConfirmModal(true);
  };

  const executeAction = async () => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);

      let response;
      if (pendingAction === 'backfill') {
        response = await backfillMissingEmbeddingsApi();
      } else if (pendingAction === 'reindex') {
        response = await reindexAllEmbeddingsApi();
      }

      const payload = response?.data ?? response;
      const isSuccess = typeof response?.success === 'boolean' ? response.success : Boolean(payload);

      if (isSuccess && payload) {
        setResult(payload);
        setLastCompletedAction(pendingAction);
      } else {
        if (import.meta.env.DEV) {
          console.error('[AdminEmbeddingPage] API returned unexpected payload', response);
        }
        setError(response?.error?.message || response?.message || '작업 중 오류가 발생했습니다.');
      }
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('[AdminEmbeddingPage] executeAction failed', err);
      }
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('예상치 못한 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
      setShowConfirmModal(false);
      setPendingAction(null);
    }
  };

  const getConfirmMessage = () => {
    if (pendingAction === 'backfill') {
      return '누락된 임베딩을 추가하시겠습니까? 이 작업은 시간이 걸릴 수 있습니다.';
    } else if (pendingAction === 'reindex') {
      return '전체 임베딩을 재색인하시겠습니까? 이 작업은 상당한 시간이 걸릴 수 있습니다.';
    }
    return '';
  };

  return (
    <div className="min-h-screen bg-blue-50 text-gray-900">
      <AdminNav currentPage="embeddings" />
      <AdminSidebar currentPage="embeddings" />

      <div className="flex min-h-screen">
        <main className="w-full px-4 pb-12 pt-24 lg:ml-64 lg:p-8 lg:pt-24">
          {/* Header */}
          <header className="mb-8 flex items-end justify-between">
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">상품 임베딩 관리</h1>
              <p className="mt-2 text-sm text-slate-500">임베딩을 생성하고 관리합니다.</p>
            </div>
          </header>

          {/* Error Message */}
          {error && (
            <div className="mb-6 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          {/* Content Grid */}
          <div className="grid gap-6 md:grid-cols-2 mb-8">
            {/* Backfill Section */}
            <section className="overflow-hidden bg-white shadow-xl ring-1 ring-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-extrabold text-gray-900 mb-1">누락 임베딩 추가</h2>
                <p className="text-sm text-slate-500">임베딩이 없는 상품들의 임베딩을 생성합니다.</p>
              </div>

              <div className="p-6">
                <button
                  onClick={handleBackfillMissing}
                  disabled={loading && pendingAction === 'backfill'}
                  className="w-full rounded-full bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg transition hover:scale-[1.02] hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
                >
                  {loading && pendingAction === 'backfill' ? '처리 중...' : '누락 임베딩 추가'}
                </button>

                {result && lastCompletedAction === 'backfill' && (
                  <div className="mt-6 rounded bg-gradient-to-br from-emerald-50 to-teal-50 p-4 ring-1 ring-emerald-200">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-600 mb-4">완료됨</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-lg bg-white p-3">
                        <p className="text-xs text-slate-500 font-medium">처리됨</p>
                        <p className="text-xl font-black text-gray-900 mt-1">{result.processedCount ?? 0}</p>
                      </div>
                      <div className="rounded-lg bg-white p-3">
                        <p className="text-xs text-slate-500 font-medium">성공</p>
                        <p className="text-xl font-black text-emerald-600 mt-1">{result.successCount ?? 0}</p>
                      </div>
                      <div className="rounded-lg bg-white p-3">
                        <p className="text-xs text-slate-500 font-medium">스킵</p>
                        <p className="text-xl font-black text-amber-600 mt-1">{result.skippedCount ?? 0}</p>
                      </div>
                      <div className="rounded-lg bg-white p-3">
                        <p className="text-xs text-slate-500 font-medium">실패</p>
                        <p className="text-xl font-black text-rose-600 mt-1">{result.failedCount ?? 0}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Reindex Section */}
            <section className="overflow-hidden bg-white shadow-xl ring-1 ring-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-extrabold text-gray-900 mb-1">전체 임베딩 재색인</h2>
                <p className="text-sm text-slate-500">모든 상품의 임베딩을 다시 생성합니다.</p>
              </div>

              <div className="p-6">
                <button
                  onClick={handleReindexAll}
                  disabled={loading && pendingAction === 'reindex'}
                  className="w-full rounded-full bg-orange-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition hover:scale-[1.02] hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
                >
                  {loading && pendingAction === 'reindex' ? '처리 중...' : '전체 재색인'}
                </button>

                {result && lastCompletedAction === 'reindex' && (
                  <div className="mt-6 rounded bg-gradient-to-br from-blue-50 to-cyan-50 p-4 ring-1 ring-blue-200">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600 mb-4">완료됨</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-lg bg-white p-3">
                        <p className="text-xs text-slate-500 font-medium">처리됨</p>
                        <p className="text-xl font-black text-gray-900 mt-1">{result.processedCount ?? 0}</p>
                      </div>
                      <div className="rounded-lg bg-white p-3">
                        <p className="text-xs text-slate-500 font-medium">성공</p>
                        <p className="text-xl font-black text-blue-600 mt-1">{result.successCount ?? 0}</p>
                      </div>
                      <div className="rounded-lg bg-white p-3">
                        <p className="text-xs text-slate-500 font-medium">스킵</p>
                        <p className="text-xl font-black text-amber-600 mt-1">{result.skippedCount ?? 0}</p>
                      </div>
                      <div className="rounded-lg bg-white p-3">
                        <p className="text-xs text-slate-500 font-medium">실패</p>
                        <p className="text-xl font-black text-rose-600 mt-1">{result.failedCount ?? 0}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>
        </main>
      </div>

      {/* Confirm Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="relative max-w-sm bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-bold text-gray-900">작업 확인</h2>
            <p className="mb-6 text-sm text-slate-600">{getConfirmMessage()}</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={loading}
                className="rounded-full border border-blue-200 px-5 py-2 text-sm font-bold text-blue-700 transition hover:bg-blue-50 disabled:opacity-60"
              >
                취소
              </button>
              <button
                onClick={executeAction}
                disabled={loading}
                className="rounded-full bg-blue-600 px-5 py-2 text-sm font-bold text-white shadow-lg transition hover:bg-blue-700 disabled:opacity-60"
              >
                {loading ? '진행 중...' : '확인'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminEmbeddingPage;
