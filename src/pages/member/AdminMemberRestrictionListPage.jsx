import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { ApiError } from '../../api/client';
import {
  createAdminMemberRestriction,
  deactivateAdminMemberRestriction,
  getAdminMemberRestrictions,
} from '../../features/report/reportApi';

const restrictionTypeLabels = {
  LOGIN_BAN: 'Login Lock',
  CHAT_BAN: 'Chat Mute',
  TRADE_BAN: 'Trade Ban',
};

const durationOptions = [
  { value: 24, label: '1 Day' },
  { value: 72, label: '3 Days' },
  { value: 168, label: '7 Days' },
  { value: 720, label: '30 Days' },
  { value: 87600, label: 'Permanent' },
];

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

function formatDateOnly(value) {
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
  }).format(date);
}

function getRestrictionStatus(restriction) {
  if (!restriction) {
    return 'UNKNOWN';
  }

  if (!restriction.active) {
    return 'DEACTIVATED';
  }

  if (restriction.endAt) {
    const endAt = new Date(restriction.endAt);
    if (!Number.isNaN(endAt.getTime()) && endAt.getTime() < Date.now()) {
      return 'EXPIRED';
    }
  }

  return 'ACTIVE';
}

function getStatusBadge(status) {
  if (status === 'ACTIVE') {
    return 'text-primary';
  }
  if (status === 'EXPIRED') {
    return 'text-outline';
  }
  return 'text-outline';
}

function getStatusDot(status) {
  if (status === 'ACTIVE') {
    return 'bg-primary';
  }
  return 'bg-outline';
}

function getInitials(memberId) {
  if (!memberId) {
    return 'MB';
  }

  return memberId.replace(/-/g, '').slice(0, 2).toUpperCase();
}

export default function AdminMemberRestrictionListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialMemberId = searchParams.get('memberId') || '';
  const initialMessage = searchParams.get('message') || '';

  const [memberId, setMemberId] = useState(initialMemberId);
  const [keyword, setKeyword] = useState(initialMemberId);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [restrictions, setRestrictions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [bannerMessage, setBannerMessage] = useState(initialMessage);
  const [deactivatingId, setDeactivatingId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    memberId: initialMemberId,
    restrictionType: 'LOGIN_BAN',
    reason: '',
    durationHours: 24,
  });

  useEffect(() => {
    if (!initialMemberId) {
      return;
    }

    void loadRestrictions(initialMemberId);
  }, []);

  useEffect(() => {
    if (!bannerMessage) {
      return undefined;
    }

    const timer = window.setTimeout(() => setBannerMessage(''), 3200);
    return () => window.clearTimeout(timer);
  }, [bannerMessage]);

  async function loadRestrictions(targetMemberId) {
    if (!targetMemberId) {
      setRestrictions([]);
      setErrorMessage('조회할 회원 ID를 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage('');
      const data = await getAdminMemberRestrictions(targetMemberId);
      const list = Array.isArray(data) ? data : [];
      setRestrictions(list);
      setMemberId(targetMemberId);
      setKeyword(targetMemberId);
      setForm((current) => ({ ...current, memberId: targetMemberId }));
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('memberId', targetMemberId);
        return next;
      });
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('제재 목록을 불러오지 못했습니다.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleDeactivate(restrictionId) {
    try {
      setDeactivatingId(restrictionId);
      setErrorMessage('');
      await deactivateAdminMemberRestriction(restrictionId);
      setRestrictions((current) => current.map((item) => (
        item.restrictionId === restrictionId
          ? { ...item, active: false, updatedAt: new Date().toISOString() }
          : item
      )));
      setBannerMessage('제재를 해제했습니다.');
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('제재 해제에 실패했습니다.');
      }
    } finally {
      setDeactivatingId('');
    }
  }

  async function handleCreateRestriction(event) {
    event.preventDefault();

    if (!form.memberId.trim()) {
      setErrorMessage('대상 회원 ID를 입력해주세요.');
      return;
    }

    if (!form.reason.trim()) {
      setErrorMessage('제재 사유를 입력해주세요.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage('');
      const created = await createAdminMemberRestriction({
        memberId: form.memberId.trim(),
        reason: form.reason.trim(),
        restrictionType: form.restrictionType,
        durationHours: Number(form.durationHours),
      });

      if (form.memberId.trim() === memberId.trim()) {
        setRestrictions((current) => [created, ...current]);
      } else {
        await loadRestrictions(form.memberId.trim());
      }

      setBannerMessage('새 제재를 등록했습니다.');
      setForm((current) => ({
        ...current,
        reason: '',
      }));
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('제재 등록에 실패했습니다.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  const filteredRestrictions = useMemo(() => {
    return restrictions.filter((restriction) => {
      const status = getRestrictionStatus(restriction);
      const matchesStatus = statusFilter === 'ALL' || status === statusFilter;
      const normalizedKeyword = keyword.trim().toLowerCase();
      const matchesKeyword = !normalizedKeyword || [
        restriction.restrictionId,
        restriction.memberId,
        restriction.reason,
        restrictionTypeLabels[restriction.restrictionType],
        restriction.restrictionType,
      ].some((value) => String(value || '').toLowerCase().includes(normalizedKeyword));

      return matchesStatus && matchesKeyword;
    });
  }, [keyword, restrictions, statusFilter]);

  const activeCount = useMemo(
    () => restrictions.filter((restriction) => getRestrictionStatus(restriction) === 'ACTIVE').length,
    [restrictions],
  );

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <nav className="fixed top-0 z-50 flex w-full items-center justify-between bg-surface/70 px-6 py-3 shadow-xl shadow-violet-900/5 backdrop-blur-xl">
        <div className="text-xl font-black tracking-tight text-violet-700">Vivid Artifact</div>
        <div className="hidden items-center gap-8 md:flex">
          <a className="font-bold text-slate-500 transition-colors hover:text-violet-500" href="#">Dashboard</a>
          <Link className="font-bold text-slate-500 transition-colors hover:text-violet-500" to="/admin/member-reports">Reports</Link>
          <span className="relative font-bold text-violet-700 after:absolute after:-bottom-1 after:left-1/2 after:h-1 after:w-1 after:-translate-x-1/2 after:rounded-full after:bg-violet-600">Sanctions</span>
          <a className="font-bold text-slate-500 transition-colors hover:text-violet-500" href="#">Users</a>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative hidden sm:block">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">⌕</span>
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              className="w-64 rounded-full border-none bg-[#efdbff] py-2 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-violet-400"
              placeholder="Search members..."
              type="text"
            />
          </div>
          <div className="h-8 w-8 rounded-full bg-violet-200 ring-2 ring-violet-200/60" />
        </div>
      </nav>

      <aside className="fixed left-0 top-0 hidden h-screen w-64 flex-col gap-2 bg-[#f3e2ff] p-4 pt-20 lg:flex">
        <div className="mb-4 px-4 py-6">
          <div className="mb-2 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 font-bold text-white">A</div>
            <div>
              <div className="text-sm font-bold text-violet-700">Admin Panel</div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Artifact Control</div>
            </div>
          </div>
        </div>
        <div className="space-y-1">
          <a className="flex cursor-pointer items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-slate-600 transition-transform hover:translate-x-1 hover:bg-slate-100">
            <span className="text-violet-600">◫</span> Overview
          </a>
          <Link to="/admin/member-reports" className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-slate-600 transition-transform hover:translate-x-1 hover:bg-slate-100">
            <span className="text-violet-600">⚑</span> All Reports
          </Link>
          <a className="flex cursor-pointer items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-slate-600 transition-transform hover:translate-x-1 hover:bg-slate-100">
            <span className="text-violet-600">☰</span> Pending Review
          </a>
          <span className="flex cursor-pointer items-center gap-3 rounded-lg bg-violet-100 px-4 py-3 text-sm font-medium text-violet-700 transition-transform hover:translate-x-1">
            <span className="text-violet-600">⚖</span> Sanction History
          </span>
          <a className="flex cursor-pointer items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-slate-600 transition-transform hover:translate-x-1 hover:bg-slate-100">
            <span className="text-violet-600">⏱</span> System Logs
          </a>
        </div>
        <div className="mt-auto space-y-1 border-t border-violet-100 pt-4">
          <a className="flex cursor-pointer items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-100">Settings</a>
          <a className="flex cursor-pointer items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-rose-600 hover:bg-rose-50">Logout</a>
        </div>
      </aside>

      <main className="px-6 pb-12 pt-24 lg:ml-64">
        <header className="mb-8">
          <h1 className="mb-2 text-3xl font-extrabold tracking-tight text-on-surface">Sanction Management</h1>
          <p className="text-sm text-slate-500">Monitor and manage member restrictions across the platform ecosystem.</p>
        </header>

        {bannerMessage ? (
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            {bannerMessage}
          </div>
        ) : null}

        {errorMessage ? (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {errorMessage}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
          <div className="space-y-6 xl:col-span-2">
            <div className="flex flex-wrap items-center gap-4 rounded-2xl bg-white p-4 shadow-sm">
              <div className="relative min-w-[240px] flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">⌕</span>
                <input
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  className="w-full rounded-xl border-none bg-[#f3e2ff] py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-violet-400"
                  placeholder="Search by ID or reason..."
                  type="text"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="min-w-[140px] rounded-xl border-none bg-[#f3e2ff] px-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-violet-400"
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="EXPIRED">Expired</option>
                <option value="DEACTIVATED">Deactivated</option>
              </select>
              <button
                type="button"
                onClick={() => loadRestrictions((form.memberId || memberId || keyword).trim())}
                className="flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-500/20 transition-all hover:bg-violet-700"
              >
                Filter
              </button>
            </div>

            <div className="overflow-hidden rounded-[28px] bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-[#f3e2ff] text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                      <th className="px-6 py-4">Target Member</th>
                      <th className="px-6 py-4">Type</th>
                      <th className="px-6 py-4">Reason</th>
                      <th className="px-6 py-4">Duration</th>
                      <th className="px-6 py-4">End Date</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-violet-100">
                    {loading ? (
                      <tr>
                        <td colSpan="7" className="px-6 py-16 text-center text-sm text-slate-500">제재 목록을 불러오는 중입니다...</td>
                      </tr>
                    ) : filteredRestrictions.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="px-6 py-16 text-center text-sm text-slate-500">조회된 제재 내역이 없습니다.</td>
                      </tr>
                    ) : (
                      filteredRestrictions.map((restriction) => {
                        const status = getRestrictionStatus(restriction);
                        const isActive = status === 'ACTIVE';
                        const isArchived = status !== 'ACTIVE';
                        return (
                          <tr
                            key={restriction.restrictionId}
                            className={isArchived ? 'bg-[#f9edff]/40 opacity-70' : 'transition-colors hover:bg-[#f9edff]/60'}
                          >
                            <td className="px-6 py-5">
                              <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e3c6ff] text-xs font-bold text-[#5e2d93]">
                                  {getInitials(restriction.memberId)}
                                </div>
                                <div>
                                  <div className="text-sm font-bold text-on-surface break-all">{restriction.memberId}</div>
                                  <div className="text-xs text-slate-500">ID: {restriction.memberId}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-5">
                              <span className="rounded-md bg-rose-50 px-2.5 py-1 text-[11px] font-bold uppercase text-rose-600">
                                {restrictionTypeLabels[restriction.restrictionType] || restriction.restrictionType}
                              </span>
                            </td>
                            <td className="max-w-[220px] px-6 py-5 text-sm text-slate-500">
                              <div className="truncate">{restriction.reason}</div>
                            </td>
                            <td className="px-6 py-5 text-sm text-on-surface">
                              {restriction.durationHours >= 87600 ? 'Permanent' : `${restriction.durationHours} Hours`}
                            </td>
                            <td className="px-6 py-5">
                              <div className="text-sm font-medium">{formatDateOnly(restriction.endAt)}</div>
                              <div className="text-[10px] text-slate-500">{formatDateTime(restriction.endAt).split(' ').slice(-1)[0] || '-'}</div>
                            </td>
                            <td className="px-6 py-5">
                              <span className={['flex items-center gap-1.5 text-[11px] font-bold', getStatusBadge(status)].join(' ')}>
                                <span className={['h-1.5 w-1.5 rounded-full', getStatusDot(status), isActive ? 'animate-pulse' : ''].join(' ')} />
                                {status}
                              </span>
                            </td>
                            <td className="px-6 py-5 text-right">
                              <button
                                type="button"
                                disabled={!isActive || deactivatingId === restriction.restrictionId}
                                onClick={() => handleDeactivate(restriction.restrictionId)}
                                className="rounded-lg px-3 py-1.5 text-xs font-bold text-rose-600 transition-colors hover:bg-rose-50 disabled:cursor-not-allowed disabled:text-slate-400"
                              >
                                {isArchived ? 'Archived' : deactivatingId === restriction.restrictionId ? 'Deactivating...' : 'Deactivate'}
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between border-t border-violet-100 bg-[#f3e2ff] px-6 py-4">
                <span className="text-xs text-slate-500">Showing {filteredRestrictions.length} of {restrictions.length} sanctions</span>
                <div className="flex items-center gap-2">
                  <button type="button" className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-white">‹</button>
                  <button type="button" className="h-8 w-8 rounded-lg bg-violet-600 text-xs font-bold text-white">1</button>
                  <button type="button" className="h-8 w-8 rounded-lg text-xs font-bold text-slate-600 transition-colors hover:bg-white">2</button>
                  <button type="button" className="h-8 w-8 rounded-lg text-xs font-bold text-slate-600 transition-colors hover:bg-white">3</button>
                  <button type="button" className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-white">›</button>
                </div>
              </div>
            </div>
          </div>

          <div className="xl:col-span-1">
            <div className="sticky top-24 rounded-[28px] bg-white p-8 shadow-xl shadow-violet-900/5">
              <div className="mb-8 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">+</div>
                <div>
                  <h2 className="text-xl font-extrabold text-on-surface">Register Sanction</h2>
                  <p className="text-xs text-slate-500">Impose restrictions on a member</p>
                </div>
              </div>

              <form className="space-y-6" onSubmit={handleCreateRestriction}>
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Target Member ID</label>
                  <input
                    value={form.memberId}
                    onChange={(event) => setForm((current) => ({ ...current, memberId: event.target.value }))}
                    className="w-full rounded-xl border-none bg-[#efdbff] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-violet-400"
                    placeholder="Enter Member ID"
                    type="text"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Sanction Type</label>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(restrictionTypeLabels).map(([value, label]) => (
                      <label key={value} className="cursor-pointer">
                        <input
                          checked={form.restrictionType === value}
                          className="peer hidden"
                          name="restrictionType"
                          onChange={() => setForm((current) => ({ ...current, restrictionType: value }))}
                          type="radio"
                        />
                        <div className="rounded-xl bg-[#efdbff] px-4 py-3 text-center text-sm font-bold text-slate-600 transition-all peer-checked:bg-violet-600 peer-checked:text-white">
                          {label}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Reason for Sanction</label>
                  <textarea
                    value={form.reason}
                    onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))}
                    className="w-full rounded-xl border-none bg-[#efdbff] p-4 text-sm outline-none focus:ring-2 focus:ring-violet-400"
                    placeholder="Describe the violation details..."
                    rows="4"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Duration Setting</label>
                  <select
                    value={String(form.durationHours)}
                    onChange={(event) => setForm((current) => ({ ...current, durationHours: Number(event.target.value) }))}
                    className="w-full rounded-xl border-none bg-[#efdbff] px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-violet-400"
                  >
                    {durationOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                <div className="pt-4">
                  <button
                    className="w-full rounded-2xl bg-gradient-to-br from-[#5130c6] to-[#5d3fd3] py-4 font-extrabold tracking-wide text-white transition-all hover:shadow-xl hover:shadow-violet-500/30 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={submitting}
                    type="submit"
                  >
                    {submitting ? 'PROCESSING...' : 'CONFIRM SANCTION'}
                  </button>
                  <p className="mt-4 px-4 text-center text-[10px] text-slate-500">
                    By confirming, you acknowledge this action is logged and visible to senior management.
                  </p>
                </div>
              </form>

              <div className="mt-8 rounded-2xl bg-[#f3e2ff] p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Active Restrictions</p>
                <p className="mt-2 text-3xl font-black text-violet-700">{activeCount}</p>
                <p className="mt-1 text-xs text-slate-500">Current target: {memberId || form.memberId || '미선택'}</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
