import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { ApiError } from '../../api/client';
import { getAdminMemberReports } from '../../features/report/reportApi';

const statusOptions = [
  { value: 'ALL', label: 'All Status' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
];

const reportTypeLabels = {
  SPAM: 'Spam',
  ABUSE: 'Harassment',
  FRAUD: 'Fraud',
  ETC: 'Other',
};

const statusStyles = {
  PENDING: 'bg-rose-100 text-rose-700',
  APPROVED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-slate-200 text-slate-700',
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
    hour12: false,
  }).format(date);
}

function getDisplayType(reportType) {
  return reportTypeLabels[reportType] || reportType || 'Unknown';
}

export default function AdminMemberReportListPage() {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  useEffect(() => {
    let mounted = true;

    async function loadReports() {
      try {
        setLoading(true);
        setErrorMessage('');
        const data = await getAdminMemberReports();
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
          setErrorMessage('신고 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
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

  const reportTypes = useMemo(() => {
    const unique = Array.from(new Set(reports.map((report) => report.reportType).filter(Boolean)));
    return ['ALL', ...unique];
  }, [reports]);

  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const matchesStatus = statusFilter === 'ALL' || report.status === statusFilter;
      const matchesType = typeFilter === 'ALL' || report.reportType === typeFilter;
      const keyword = search.trim().toLowerCase();
      const matchesSearch = !keyword || [
        report.reportId,
        report.reporterId,
        report.reportedMemberId,
        report.reason,
        report.reviewComment,
      ].some((value) => String(value || '').toLowerCase().includes(keyword));

      return matchesStatus && matchesType && matchesSearch;
    });
  }, [reports, search, statusFilter, typeFilter]);

  const pendingCount = reports.filter((report) => report.status === 'PENDING').length;
  const processedCount = reports.filter((report) => report.status !== 'PENDING').length;

  return (
    <div className="min-h-screen bg-[#fdf3ff] text-[#38274c]">
      <nav className="fixed top-0 z-50 flex w-full items-center justify-between border-b border-violet-100 bg-[#fdf3ff]/80 px-6 py-3 backdrop-blur-xl shadow-sm">
        <div className="flex items-center gap-8">
          <span className="text-xl font-black tracking-tight text-violet-700">Vivid Artifact</span>
          <div className="hidden items-center gap-6 md:flex">
            <a className="font-bold text-slate-500 transition-colors hover:text-violet-500" href="#">Dashboard</a>
            <span className="relative font-bold text-violet-700 after:absolute after:-bottom-1 after:left-1/2 after:h-1 after:w-1 after:-translate-x-1/2 after:rounded-full after:bg-violet-600">Reports</span>
            <Link className="font-bold text-slate-500 transition-colors hover:text-violet-500" to="/admin/member-restrictions">Sanctions</Link>
            <Link className="font-bold text-slate-500 transition-colors hover:text-violet-500" to="/admin/categories">Categories</Link>
            <a className="font-bold text-slate-500 transition-colors hover:text-violet-500" href="#">Users</a>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden rounded-full bg-white px-4 py-2 text-sm text-slate-500 shadow-sm ring-1 ring-violet-100 lg:block">
            Search reports...
          </div>
          <div className="h-8 w-8 rounded-full bg-violet-200 ring-2 ring-violet-200/60" />
        </div>
      </nav>

      <div className="flex min-h-screen">
        <aside className="fixed left-0 top-0 hidden h-screen w-64 border-r border-violet-100 bg-[#f3e2ff] p-4 pt-20 lg:flex lg:flex-col">
          <div className="mb-4 px-4 py-6">
            <h2 className="text-lg font-bold text-violet-700">Admin Panel</h2>
            <p className="text-xs text-slate-500">Artifact Control</p>
          </div>
          <nav className="flex-1 space-y-1">
            <a className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-slate-600 transition hover:translate-x-1 hover:bg-white/70" href="#">Overview</a>
            <span className="flex items-center gap-3 rounded-lg bg-violet-100 px-4 py-3 text-sm font-medium text-violet-700">All Reports</span>
            <a className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-slate-600 transition hover:translate-x-1 hover:bg-white/70" href="#">Pending Review</a>
            <Link to="/admin/member-restrictions" className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-slate-600 transition hover:translate-x-1 hover:bg-white/70">Sanction History</Link>
            <Link to="/admin/categories" className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-slate-600 transition hover:translate-x-1 hover:bg-white/70">
              <span>🗂</span> 카테고리 관리
            </Link>
          </nav>
          <Link
            to="/member-reports/new"
            className="mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-violet-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-violet-500/20 transition hover:scale-[1.02]"
          >
            Quick Report
          </Link>
        </aside>

        <main className="w-full px-4 pb-12 pt-24 lg:ml-64 lg:p-8 lg:pt-24">
          <header className="mb-8 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight text-[#38274c]">Reports Dashboard</h1>
              <p className="mt-2 text-sm text-slate-500">Monitor and manage all system-wide member reports.</p>
            </div>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-violet-100">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 text-rose-600">!</div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Pending Review</p>
                  <p className="text-2xl font-black text-[#38274c]">{pendingCount}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-violet-100">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-violet-600">✓</div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Processed</p>
                  <p className="text-2xl font-black text-[#38274c]">{processedCount}</p>
                </div>
              </div>
            </div>
          </header>

          <section className="mb-8 flex flex-col gap-4 rounded-[28px] bg-[#f3e2ff] p-6 shadow-sm ring-1 ring-violet-100 xl:flex-row xl:items-end xl:justify-between">
            <div className="grid flex-1 gap-4 md:grid-cols-[1.2fr_0.6fr_0.6fr]">
              <div>
                <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Search</label>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by ID, user or reason..."
                  className="h-12 w-full rounded-2xl border-none bg-white px-4 text-sm shadow-sm ring-1 ring-violet-100 outline-none focus:ring-2 focus:ring-violet-300"
                />
              </div>
              <div>
                <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Status</label>
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="h-12 w-full rounded-2xl border-none bg-white px-4 text-sm font-medium shadow-sm ring-1 ring-violet-100 outline-none focus:ring-2 focus:ring-violet-300"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Category</label>
                <select
                  value={typeFilter}
                  onChange={(event) => setTypeFilter(event.target.value)}
                  className="h-12 w-full rounded-2xl border-none bg-white px-4 text-sm font-medium shadow-sm ring-1 ring-violet-100 outline-none focus:ring-2 focus:ring-violet-300"
                >
                  {reportTypes.map((type) => (
                    <option key={type} value={type}>{type === 'ALL' ? 'All Types' : getDisplayType(type)}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {errorMessage ? (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {errorMessage}
            </div>
          ) : null}

          <section className="overflow-hidden rounded-[32px] bg-white shadow-xl shadow-violet-900/5 ring-1 ring-violet-100">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="bg-violet-50/70 text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                  <tr>
                    <th className="px-6 py-4">Report ID</th>
                    <th className="px-6 py-4">Reporter</th>
                    <th className="px-6 py-4">Targeted User</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Summary</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Created At</th>
                    <th className="px-6 py-4">Assignee</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-violet-100 text-sm">
                  {loading ? (
                    <tr>
                      <td colSpan="8" className="px-6 py-16 text-center font-medium text-slate-500">
                        관리자 신고 목록을 불러오는 중입니다...
                      </td>
                    </tr>
                  ) : filteredReports.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="px-6 py-16 text-center text-slate-500">
                        조건에 맞는 신고가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    filteredReports.map((report) => (
                      <tr
                        key={report.reportId}
                        className="cursor-pointer transition hover:bg-violet-50/70"
                        onClick={() => navigate(`/admin/member-reports/${report.reportId}`)}
                      >
                        <td className="px-6 py-5 font-bold text-violet-700">{report.reportId}</td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-violet-200" />
                            <span className="font-medium text-[#38274c]">{report.reporterId}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-slate-500">{report.reportedMemberId}</td>
                        <td className="px-6 py-5">
                          <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-slate-600">
                            {getDisplayType(report.reportType)}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <p className="max-w-[260px] truncate text-sm text-[#38274c]">{report.reason}</p>
                        </td>
                        <td className="px-6 py-5">
                          <span
                            className={[
                              'inline-flex rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.14em]',
                              statusStyles[report.status] || 'bg-slate-100 text-slate-600',
                            ].join(' ')}
                          >
                            {report.status}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-xs text-slate-500">{formatDateTime(report.createdAt)}</td>
                        <td className="px-6 py-5 text-xs text-slate-500">{report.reviewedBy || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between bg-violet-50/70 px-6 py-4 text-xs font-medium text-slate-500">
              <p>Showing {filteredReports.length} of {reports.length} reports</p>
              <div className="flex gap-2">
                <button type="button" className="rounded-lg bg-white px-3 py-2 shadow-sm ring-1 ring-violet-100">Prev</button>
                <button type="button" className="rounded-lg bg-violet-600 px-3 py-2 font-bold text-white">1</button>
                <button type="button" className="rounded-lg bg-white px-3 py-2 shadow-sm ring-1 ring-violet-100">Next</button>
              </div>
            </div>
          </section>

          <div className="mt-6 text-sm text-slate-500">
            Click on any report row to move into the detailed review screen.
          </div>
        </main>
      </div>
    </div>
  );
}
