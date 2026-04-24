import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { ApiError } from '../../api/client';
import {
  approveAdminMemberReport,
  getAdminMemberReportDetail,
  rejectAdminMemberReport,
} from '../../features/report/reportApi';

const restrictionOptions = [
  {
    value: 'LOGIN_BAN',
    label: 'LOGIN_BAN',
    description: '로그인 제한',
  },
  {
    value: 'CHAT_BAN',
    label: 'CHAT_BAN',
    description: '채팅 제한',
  },
  {
    value: 'TRADE_BAN',
    label: 'TRADE_BAN',
    description: '거래 제한',
  },
];

const durationOptions = [
  { value: 24, label: '24h' },
  { value: 48, label: '48h' },
  { value: 168, label: '7d' },
  { value: 720, label: '30d' },
];

const statusConfig = {
  PENDING: {
    label: '검토 중',
    badge: 'bg-secondary-container text-[#5e2d93]',
  },
  APPROVED: {
    label: '승인 완료',
    badge: 'bg-emerald-100 text-emerald-700',
  },
  REJECTED: {
    label: '기각 완료',
    badge: 'bg-rose-100 text-rose-700',
  },
};

const reportTypeConfig = {
  SPAM: { label: 'Spam', accent: 'bg-violet-50 text-violet-700 border-violet-200' },
  ABUSE: { label: 'Chat Abuse', accent: 'bg-rose-50 text-rose-700 border-rose-200' },
  FRAUD: { label: 'Fraud', accent: 'bg-amber-50 text-amber-700 border-amber-200' },
  ETC: { label: 'Other', accent: 'bg-slate-100 text-slate-700 border-slate-200' },
};

function formatDateTime(value) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date);
}

function buildTimeline(report) {
  const items = [
    {
      label: 'System',
      description: '신고가 접수되어 관리자 검토 대기열에 등록되었습니다.',
      time: report?.createdAt,
    },
  ];

  if (report?.reviewedAt) {
    items.push({
      label: report.reviewedBy || 'Admin',
      description: report.status === 'APPROVED'
        ? '신고를 승인하고 후속 조치를 기록했습니다.'
        : '신고를 검토한 뒤 기각 처리했습니다.',
      time: report.reviewedAt,
    });
  }

  return items;
}

function buildEvidenceLines(report) {
  if (!report?.reason) {
    return [];
  }

  const trimmed = report.reason.trim();
  const first = trimmed.slice(0, 120);
  const second = trimmed.length > 120 ? trimmed.slice(120, 240) : '';

  return [first, second].filter(Boolean);
}

export default function AdminMemberReportDetailPage() {
  const navigate = useNavigate();
  const { reportId } = useParams();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [restrictionType, setRestrictionType] = useState('LOGIN_BAN');
  const [durationHours, setDurationHours] = useState(24);
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    let mounted = true;

    async function loadReport() {
      try {
        setLoading(true);
        setErrorMessage('');
        const data = await getAdminMemberReportDetail(reportId);

        if (!mounted) {
          return;
        }

        setReport(data);
        setReviewComment(data?.reviewComment || '');
      } catch (error) {
        if (!mounted) {
          return;
        }

        if (error instanceof ApiError) {
          setErrorMessage(error.message);
        } else {
          setErrorMessage('신고 상세 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadReport();
    return () => {
      mounted = false;
    };
  }, [reportId]);

  useEffect(() => {
    if (!toastMessage) {
      return undefined;
    }

    const timer = window.setTimeout(() => setToastMessage(''), 2400);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  const status = statusConfig[report?.status] || statusConfig.PENDING;
  const type = reportTypeConfig[report?.reportType] || reportTypeConfig.ETC;
  const evidenceLines = useMemo(() => buildEvidenceLines(report), [report]);
  const timeline = useMemo(() => buildTimeline(report), [report]);
  const isReviewLocked = report?.status && report.status !== 'PENDING';

  async function handleApprove() {
    if (!reportId || isReviewLocked) {
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage('');
      const updated = await approveAdminMemberReport(reportId, {
        reviewComment,
        restrictionType,
        durationHours,
      });
      setReport(updated);
      setReviewComment(updated?.reviewComment || reviewComment);
      setToastMessage('신고를 승인하고 제재를 적용했습니다.');
      window.setTimeout(() => {
        navigate(`/admin/member-restrictions?memberId=${updated.reportedMemberId}&message=${encodeURIComponent('승인된 신고에 대한 제재 목록입니다.')}`);
      }, 900);
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('신고 승인 처리에 실패했습니다.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReject() {
    if (!reportId || isReviewLocked) {
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage('');
      const updated = await rejectAdminMemberReport(reportId, {
        reviewComment,
        restrictionType: null,
        durationHours: null,
      });
      setReport(updated);
      setReviewComment(updated?.reviewComment || reviewComment);
      setToastMessage('신고를 기각 처리했습니다.');
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('신고 기각 처리에 실패했습니다.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#fdf3ff] text-[#38274c]">
      <nav className="fixed top-0 z-50 flex w-full items-center justify-between border-b border-violet-100 bg-[#fdf3ff]/80 px-6 py-3 backdrop-blur-xl shadow-sm">
        <div className="text-xl font-black tracking-tight text-violet-700">Vivid Artifact</div>
        <div className="hidden items-center gap-8 md:flex">
          <a className="font-bold text-slate-500 hover:text-violet-500" href="#">Dashboard</a>
          <Link className="relative font-bold text-violet-700 after:absolute after:-bottom-1 after:left-1/2 after:h-1 after:w-1 after:-translate-x-1/2 after:rounded-full after:bg-violet-600" to="/admin/member-reports">Reports</Link>
          <Link className="font-bold text-slate-500 hover:text-violet-500" to="/admin/member-restrictions">Sanctions</Link>
          <Link className="font-bold text-slate-500 hover:text-violet-500" to="/admin/categories">Categories</Link>
          <a className="font-bold text-slate-500 hover:text-violet-500" href="#">Users</a>
        </div>
        <div className="flex items-center gap-4">
          <div className="h-8 w-8 rounded-full bg-violet-200 ring-2 ring-violet-200/60" />
        </div>
      </nav>

      <div className="flex min-h-screen pt-20">
        <aside className="hidden h-screen w-64 shrink-0 border-r border-violet-100 bg-[#f3e2ff] p-4 pt-20 md:flex md:flex-col">
          <div className="px-4 py-6">
            <p className="text-lg font-bold text-violet-700">Admin Panel</p>
            <p className="text-xs text-slate-500">Artifact Control</p>
          </div>
          <nav className="flex-1 space-y-1">
            <div className="rounded-lg px-4 py-3 text-sm font-medium text-slate-600 hover:bg-white/70">Overview</div>
            <Link to="/admin/member-reports" className="flex items-center gap-3 rounded-lg bg-violet-100 px-4 py-3 text-sm font-medium text-violet-700">
              All Reports
            </Link>
            <div className="rounded-lg px-4 py-3 text-sm font-medium text-slate-600 hover:bg-white/70">Pending Review</div>
            <Link to="/admin/member-restrictions" className="rounded-lg px-4 py-3 text-sm font-medium text-slate-600 hover:bg-white/70 block">Sanction History</Link>
            <Link to="/admin/member-restrictions" className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-slate-600 transition hover:translate-x-1 hover:bg-white/70">Sanction History</Link>
            <Link to="/admin/categories" className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-slate-600 transition hover:translate-x-1 hover:bg-white/70">
              <span>🗂</span> 카테고리 관리
            </Link>
            <div className="rounded-lg px-4 py-3 text-sm font-medium text-slate-600 hover:bg-white/70">System Logs</div>
          </nav>
        </aside>

        <main className="flex-1 p-4 md:ml-64 md:p-8">
          <div className="mx-auto max-w-6xl space-y-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
                  <Link to="/admin/member-reports" className="hover:text-violet-500">Reports</Link>
                  <span>{'>'}</span>
                  <span className="text-violet-700">CASE {reportId}</span>
                </div>
                <h1 className="text-4xl font-extrabold tracking-tight text-[#38274c]">정밀 신고 검토</h1>
              </div>
              <span className={['inline-flex w-fit items-center gap-2 rounded-full px-4 py-2 text-sm font-bold', status.badge].join(' ')}>
                <span className="text-base">●</span>
                {status.label}
              </span>
            </div>

            {errorMessage ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {errorMessage}
              </div>
            ) : null}

            {loading ? (
              <div className="rounded-[32px] bg-white p-16 text-center text-sm text-slate-500 shadow-sm ring-1 ring-violet-100">
                신고 상세 정보를 불러오는 중입니다...
              </div>
            ) : !report ? (
              <div className="rounded-[32px] bg-white p-16 text-center text-sm text-slate-500 shadow-sm ring-1 ring-violet-100">
                표시할 신고 정보가 없습니다.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                <div className="space-y-6 xl:col-span-2">
                  <section className="space-y-8 rounded-[32px] bg-white p-8 shadow-xl shadow-violet-900/5 ring-1 ring-violet-100">
                    <div className="flex flex-col gap-6 border-b border-violet-100 pb-6 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-4">
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">신고 정보</p>
                        <div className="flex flex-wrap items-center gap-4">
                          <div className={['rounded-xl border px-4 py-2 text-sm font-bold', type.accent].join(' ')}>
                            {type.label}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            <span>Created</span>
                            <span>{formatDateTime(report.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-slate-400">중요도</p>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4].map((index) => (
                            <div key={index} className={index <= (report.status === 'PENDING' ? 3 : 2) ? 'h-2 w-8 rounded-full bg-violet-600' : 'h-2 w-8 rounded-full bg-violet-100'} />
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-8 md:grid-cols-2">
                      <div className="space-y-4">
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">신고자</p>
                        <div className="flex items-center gap-4 rounded-2xl bg-[#fdf3ff] p-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-200 font-black text-violet-700">
                            R
                          </div>
                          <div>
                            <p className="break-all font-bold text-[#38274c]">{report.reporterId}</p>
                            <p className="text-xs text-slate-500">Reporter account</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-rose-500">피신고자</p>
                        <div className="flex items-center gap-4 rounded-2xl bg-rose-50/60 p-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-200 font-black text-rose-700">
                            S
                          </div>
                          <div>
                            <p className="break-all font-bold text-[#38274c]">{report.reportedMemberId}</p>
                            <p className="text-xs text-rose-500">Reported account</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 pt-4">
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">신고 사유 상세</p>
                      <div className="rounded-2xl border-l-4 border-violet-600 bg-[#f9edff] p-6 text-base leading-relaxed text-[#38274c]">
                        {report.reason}
                      </div>
                    </div>
                  </section>

                  <section className="space-y-6 rounded-[32px] bg-white p-8 shadow-xl shadow-violet-900/5 ring-1 ring-violet-100">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <h3 className="text-2xl font-extrabold text-[#38274c]">검토 참고 메모</h3>
                      <span className="text-sm font-semibold text-violet-600">실제 채팅 로그/증빙 API는 아직 연결 전입니다.</span>
                    </div>

                    <div className="space-y-4">
                      {evidenceLines.length === 0 ? (
                        <div className="rounded-2xl bg-[#fdf3ff] p-4 text-sm text-slate-500">
                          표시할 추가 메모가 없습니다.
                        </div>
                      ) : (
                        evidenceLines.map((line, index) => (
                          <div key={`${line}-${index}`} className="flex items-start gap-4">
                            <span className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                              Note {index + 1}
                            </span>
                            <div className="flex-1 rounded-2xl bg-[#fdf3ff] p-4 text-sm leading-relaxed text-[#38274c]">
                              {line}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </section>
                </div>

                <div className="space-y-6">
                  <section className="sticky top-24 space-y-8 rounded-[32px] bg-[#efdbff]/70 p-8 shadow-2xl shadow-violet-900/10 ring-1 ring-violet-100 backdrop-blur-md">
                    <div>
                      <h3 className="mb-6 text-2xl font-extrabold text-[#38274c]">검토 및 처리 설정</h3>
                      <div className="space-y-6">
                        <div className="space-y-3">
                          <label className="px-1 text-xs font-black uppercase tracking-[0.18em] text-slate-400">검토 코멘트</label>
                          <textarea
                            value={reviewComment}
                            onChange={(event) => setReviewComment(event.target.value)}
                            disabled={isReviewLocked || submitting}
                            placeholder="처리에 대한 근거를 입력하세요..."
                            className="h-32 w-full rounded-2xl border-none bg-white p-4 text-sm shadow-sm ring-1 ring-violet-100 outline-none transition focus:ring-2 focus:ring-violet-300 disabled:cursor-not-allowed disabled:bg-slate-100"
                          />
                        </div>

                        <div className="space-y-4">
                          <label className="px-1 text-xs font-black uppercase tracking-[0.18em] text-slate-400">제재 옵션 설정</label>
                          <div className="grid gap-2">
                            {restrictionOptions.map((option) => {
                              const selected = restrictionType === option.value;
                              return (
                                <button
                                  key={option.value}
                                  type="button"
                                  disabled={isReviewLocked || submitting}
                                  onClick={() => setRestrictionType(option.value)}
                                  className={[
                                    'flex items-center justify-between rounded-2xl px-4 py-4 text-left transition disabled:cursor-not-allowed disabled:opacity-60',
                                    selected
                                      ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/30'
                                      : 'bg-white text-slate-600 ring-1 ring-violet-100 hover:bg-violet-50',
                                  ].join(' ')}
                                >
                                  <div>
                                    <p className="font-bold">{option.label}</p>
                                    <p className={selected ? 'text-xs text-violet-100' : 'text-xs text-slate-400'}>{option.description}</p>
                                  </div>
                                  {selected ? <span>●</span> : null}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="space-y-3">
                          <label className="px-1 text-xs font-black uppercase tracking-[0.18em] text-slate-400">제재 기간</label>
                          <div className="grid grid-cols-2 gap-2">
                            {durationOptions.map((option) => {
                              const selected = durationHours === option.value;
                              return (
                                <button
                                  key={option.value}
                                  type="button"
                                  disabled={isReviewLocked || submitting}
                                  onClick={() => setDurationHours(option.value)}
                                  className={[
                                    'rounded-xl px-3 py-3 text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-60',
                                    selected
                                      ? 'bg-violet-200 text-violet-900 ring-2 ring-violet-500'
                                      : 'bg-white text-slate-500 ring-1 ring-violet-100 hover:text-violet-600',
                                  ].join(' ')}
                                >
                                  {option.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 border-t border-violet-100 pt-6">
                      <button
                        type="button"
                        disabled={isReviewLocked || submitting}
                        onClick={handleApprove}
                        className="w-full rounded-full bg-gradient-to-br from-[#5130c6] to-[#5d3fd3] px-6 py-4 text-sm font-black text-white shadow-xl shadow-violet-500/30 transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {submitting ? '처리 중...' : '최종 승인 및 제재 적용'}
                      </button>
                      <button
                        type="button"
                        disabled={isReviewLocked || submitting}
                        onClick={handleReject}
                        className="w-full rounded-full bg-white px-6 py-4 text-sm font-bold text-slate-600 ring-1 ring-violet-100 transition hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        신고 기각 (무혐의)
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate('/admin/member-reports')}
                        className="w-full rounded-full bg-transparent px-6 py-3 text-sm font-semibold text-slate-500 transition hover:text-violet-600"
                      >
                        목록으로 돌아가기
                      </button>
                    </div>
                  </section>

                  <section className="rounded-[28px] border border-dashed border-violet-200 bg-[#f9edff] p-6">
                    <div className="mb-4 flex items-center gap-2">
                      <span className="text-sm font-black uppercase tracking-[0.18em] text-slate-400">최근 처리 기록</span>
                    </div>
                    <div className="space-y-3 text-xs text-slate-500">
                      {timeline.map((item) => (
                        <div key={`${item.label}-${item.time}`} className="flex items-center justify-between gap-4">
                          <span>{item.label}: {item.description}</span>
                          <span>{formatDateTime(item.time)}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      <div className={[
        'fixed bottom-8 left-1/2 z-50 flex -translate-x-1/2 items-center gap-4 rounded-2xl bg-[#16052a] px-6 py-4 text-white shadow-2xl transition-all',
        toastMessage ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-10 opacity-0',
      ].join(' ')}>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-sm font-black text-white">OK</div>
        <div>
          <p className="text-sm font-bold">처리 완료</p>
          <p className="text-xs text-violet-100">{toastMessage || '대상 유저에게 제재 알림이 발송되었습니다.'}</p>
        </div>
      </div>
    </div>
  );
}
