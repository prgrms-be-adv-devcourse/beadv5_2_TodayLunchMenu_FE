import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import Button from '../../components/common/Button';
import PageContainer from '../../components/common/PageContainer';
import { ApiError } from '../../api/client';
import { getMyMemberReports } from '../../features/report/reportApi';

const statusTabs = [
  { value: 'ALL', label: '전체' },
  { value: 'PENDING', label: '대기중' },
  { value: 'DONE', label: '처리완료' },
];

const statusStyles = {
  PENDING: {
    card: 'border-amber-400',
    badge: 'bg-amber-50 text-amber-700',
    label: 'PENDING',
    helper: '현재 관리자가 내용을 확인 중입니다. 잠시만 기다려주세요.',
  },
  APPROVED: {
    card: 'border-emerald-500',
    badge: 'bg-emerald-50 text-emerald-700',
    label: 'APPROVED',
    helper: '신고가 승인되어 운영 정책에 따라 조치가 진행되었습니다.',
  },
  REJECTED: {
    card: 'border-rose-500',
    badge: 'bg-rose-50 text-rose-700',
    label: 'REJECTED',
    helper: '검토 결과 가이드라인 위반으로 보기 어려워 반려되었습니다.',
  },
};

const reportTypeLabels = {
  SPAM: '스팸 및 도배',
  ABUSE: '욕설 및 비하',
  FRAUD: '사기 의심',
  ETC: '기타 사유',
};

function formatDate(value) {
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
  }).format(date).replace(/\s/g, '');
}

function mapStatusTab(report) {
  return report.status === 'PENDING' ? 'PENDING' : 'DONE';
}

export default function MemberReportHistoryPage() {
  const [activeTab, setActiveTab] = useState('ALL');
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let mounted = true;

    async function loadReports() {
      try {
        setLoading(true);
        setErrorMessage('');
        const data = await getMyMemberReports();
        if (mounted) {
          setReports(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        if (!mounted) {
          return;
        }

        if (error instanceof ApiError) {
          setErrorMessage(error.message);
        } else {
          setErrorMessage('신고 이력을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadReports();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredReports = useMemo(() => {
    if (activeTab === 'ALL') {
      return reports;
    }

    return reports.filter((report) => mapStatusTab(report) === activeTab);
  }, [activeTab, reports]);

  return (
    <PageContainer>
      <div className="mx-auto max-w-3xl">
        <section className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-violet-500">
              Member Report
            </p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900">
              내 신고 이력
            </h1>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              제출하신 신고 내역과 현재 처리 상태를 한눈에 확인할 수 있습니다.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              to="/member-reports/new"
              className="inline-flex h-12 items-center justify-center rounded-full bg-gray-100 px-5 text-sm font-bold text-gray-700 transition hover:bg-gray-200"
            >
              새 신고 작성
            </Link>
            <Button variant="ghost" onClick={() => window.location.reload()}>
              새로고침
            </Button>
          </div>
        </section>

        <nav className="mb-8 flex gap-2 rounded-[20px] bg-violet-50 p-1.5 ring-1 ring-violet-100">
          {statusTabs.map((tab) => {
            const active = tab.value === activeTab;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setActiveTab(tab.value)}
                className={[
                  'flex-1 rounded-2xl px-4 py-3 text-sm font-bold transition',
                  active
                    ? 'bg-white text-violet-700 shadow-sm'
                    : 'text-gray-500 hover:text-violet-600',
                ].join(' ')}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        {errorMessage ? (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {errorMessage}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-[28px] border border-violet-100 bg-white px-6 py-16 text-center text-sm font-medium text-gray-500 shadow-sm">
            신고 이력을 불러오는 중입니다...
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-violet-200 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-violet-50 text-3xl text-violet-300">
              <span>🗂️</span>
            </div>
            <h2 className="mt-5 text-xl font-extrabold tracking-tight text-gray-900">
              표시할 신고 내역이 없습니다
            </h2>
            <p className="mt-2 text-sm leading-6 text-gray-500">
              아직 신고를 제출하지 않았거나, 현재 선택한 필터에 해당하는 내역이 없습니다.
            </p>
            <div className="mt-6">
              <Link
                to="/member-reports/new"
                className="inline-flex h-12 items-center justify-center rounded-full bg-violet-600 px-5 text-sm font-bold text-white transition hover:bg-violet-700"
              >
                신고하러 가기
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {filteredReports.map((report) => {
              const statusMeta = statusStyles[report.status] ?? statusStyles.PENDING;
              const comment = report.reviewComment || statusMeta.helper;
              const reportTypeLabel = reportTypeLabels[report.reportType] || report.reportType;

              return (
                <article
                  key={report.reportId}
                  className={[
                    'rounded-[28px] border-l-4 bg-white p-5 shadow-sm ring-1 ring-violet-100',
                    statusMeta.card,
                  ].join(' ')}
                >
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
                      <span className={[
                        'inline-flex rounded-full px-2.5 py-1 text-[11px] font-black tracking-[0.18em]',
                        statusMeta.badge,
                      ].join(' ')}>
                        {statusMeta.label}
                      </span>
                      <h2 className="mt-3 text-lg font-extrabold tracking-tight text-gray-900">
                        {report.reportId}
                      </h2>
                    </div>
                    <div className="text-right text-xs font-semibold text-gray-400">
                      <p>신고일</p>
                      <time>{formatDate(report.createdAt)}</time>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-3 text-sm">
                      <span className="rounded-full bg-gray-100 px-3 py-1 font-bold text-gray-700">
                        {reportTypeLabel}
                      </span>
                      <span className="font-medium text-gray-400">대상 회원: {report.reportedMemberId}</span>
                    </div>
                    <p className="text-sm leading-6 text-gray-700">{report.reason}</p>
                  </div>

                  <div className="mt-5 rounded-[22px] bg-violet-50/80 p-4 ring-1 ring-violet-100">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-700">
                        검토 코멘트
                      </p>
                      <span className="text-[11px] font-semibold text-gray-400">
                        검토일 {formatDate(report.reviewedAt)}
                      </span>
                    </div>
                    <p className="text-sm leading-6 text-gray-600">{comment}</p>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
