import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { ApiError } from "../../api/client";
import { getAdminMemberReports } from "../../features/report/reportApi";

const statusOptions = [
  { value: "ALL", label: "전체 상태" },
  { value: "PENDING", label: "대기중" },
  { value: "APPROVED", label: "승인됨" },
  { value: "REJECTED", label: "반려됨" },
];

const reportTypeLabels = {
  SPAM: "스팸",
  ABUSE: "욕설/비방",
  FRAUD: "사기",
  ETC: "기타",
};

const statusStyles = {
  PENDING: "bg-rose-100 text-rose-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-slate-200 text-slate-700",
};

function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function getDisplayType(reportType) {
  return reportTypeLabels[reportType] || reportType || "알 수 없음";
}

function getInitials(value) {
  if (!value) {
    return "RP";
  }

  return value.replace(/-/g, "").slice(0, 2).toUpperCase();
}

export default function AdminMemberReportListPage() {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");

  useEffect(() => {
    let mounted = true;

    async function loadReports() {
      try {
        setLoading(true);
        setErrorMessage("");
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
          setErrorMessage(
            "신고 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
          );
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
    const unique = Array.from(
      new Set(reports.map((report) => report.reportType).filter(Boolean)),
    );
    return ["ALL", ...unique];
  }, [reports]);

  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const matchesStatus =
        statusFilter === "ALL" || report.status === statusFilter;
      const matchesType =
        typeFilter === "ALL" || report.reportType === typeFilter;
      const keyword = search.trim().toLowerCase();
      const matchesSearch =
        !keyword ||
        [
          report.reportId,
          report.reporterId,
          report.reporterNickname,
          report.reportedMemberId,
          report.reportedMemberNickname,
          report.reviewedBy,
          report.reviewedByNickname,
          report.reason,
          report.reviewComment,
        ].some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(keyword),
        );

      return matchesStatus && matchesType && matchesSearch;
    });
  }, [reports, search, statusFilter, typeFilter]);

  const pendingCount = reports.filter(
    (report) => report.status === "PENDING",
  ).length;
  const processedCount = reports.filter(
    (report) => report.status !== "PENDING",
  ).length;

  return (
    <>
      <header className="mb-8 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">
            신고 관리 대시보드
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            전체 회원 신고를 확인하고 처리 상태를 빠르게 점검할 수 있습니다.
          </p>
        </div>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-4 bg-white p-4 shadow-sm ring-1 ring-gray-200">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 text-rose-600">
              !
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                검토 대기
              </p>
              <p className="text-2xl font-black text-gray-900">
                {pendingCount}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 bg-white p-4 shadow-sm ring-1 ring-gray-200">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              OK
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                처리 완료
              </p>
              <p className="text-2xl font-black text-gray-900">
                {processedCount}
              </p>
            </div>
          </div>
        </div>
      </header>

      <section className="mb-8 flex flex-col gap-4 bg-blue-50 p-6 shadow-sm ring-1 ring-gray-200 xl:flex-row xl:items-end xl:justify-between">
        <div className="grid flex-1 gap-4 md:grid-cols-[1.2fr_0.6fr_0.6fr]">
          <div>
            <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
              검색
            </label>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="신고 ID, 회원 ID, 닉네임, 신고 사유로 검색"
              className="h-12 w-full rounded border-none bg-white px-4 text-sm shadow-sm ring-1 ring-gray-200 outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>
          <div>
            <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
              상태
            </label>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-12 w-full rounded border-none bg-white px-4 text-sm font-medium shadow-sm ring-1 ring-gray-200 outline-none focus:ring-2 focus:ring-blue-300"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
              유형
            </label>
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              className="h-12 w-full rounded border-none bg-white px-4 text-sm font-medium shadow-sm ring-1 ring-gray-200 outline-none focus:ring-2 focus:ring-blue-300"
            >
              {reportTypes.map((type) => (
                <option key={type} value={type}>
                  {type === "ALL" ? "전체 유형" : getDisplayType(type)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {errorMessage ? (
        <div className="mb-6 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <section className="overflow-hidden bg-white shadow-xl ring-1 ring-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-[1180px] text-left">
            <thead className="bg-blue-50/70 text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
              <tr>
                <th className="w-[220px] min-w-[220px] max-w-[220px] px-6 py-4">
                  신고 ID
                </th>
                <th className="w-[240px] min-w-[240px] max-w-[240px] px-6 py-4">
                  신고자
                </th>
                <th className="w-[240px] min-w-[240px] max-w-[240px] px-6 py-4">
                  피신고자
                </th>
                <th className="min-w-[120px] px-6 py-4">유형</th>
                <th className="min-w-[260px] px-6 py-4">요약</th>
                <th className="min-w-[120px] px-6 py-4">상태</th>
                <th className="min-w-[160px] px-6 py-4">생성일</th>
                <th className="w-[220px] min-w-[220px] max-w-[220px] px-6 py-4">
                  처리 관리자
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-100 text-sm">
              {loading ? (
                <tr>
                  <td
                    colSpan="8"
                    className="px-6 py-16 text-center font-medium text-slate-500"
                  >
                    관리자 신고 목록을 불러오는 중입니다...
                  </td>
                </tr>
              ) : filteredReports.length === 0 ? (
                <tr>
                  <td
                    colSpan="8"
                    className="px-6 py-16 text-center text-slate-500"
                  >
                    조건에 맞는 신고가 없습니다.
                  </td>
                </tr>
              ) : (
                filteredReports.map((report) => (
                  <tr
                    key={report.reportId}
                    className="cursor-pointer transition hover:bg-blue-50/70"
                    onClick={() =>
                      navigate(`/admin/member-reports/${report.reportId}`)
                    }
                  >
                    <td className="w-[220px] min-w-[220px] max-w-[220px] px-6 py-5 align-top font-bold text-blue-700">
                      <div className="overflow-hidden text-ellipsis whitespace-nowrap">
                        {report.reportId}
                      </div>
                    </td>
                    <td className="w-[240px] min-w-[240px] max-w-[240px] px-6 py-5 align-top">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-200 text-xs font-bold text-blue-700">
                          {getInitials(report.reporterId)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="overflow-hidden text-ellipsis whitespace-nowrap font-medium text-gray-900">
                            {report.reporterNickname || report.reporterId}
                          </div>
                          <div className="overflow-hidden text-ellipsis whitespace-nowrap text-xs text-slate-500">
                            신고자 ID: {report.reporterId}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="w-[240px] min-w-[240px] max-w-[240px] px-6 py-5 align-top text-slate-500">
                      <div className="overflow-hidden text-ellipsis whitespace-nowrap font-medium text-slate-900">
                        {report.reportedMemberNickname ||
                          report.reportedMemberId}
                      </div>
                      <div className="overflow-hidden text-ellipsis whitespace-nowrap text-xs text-slate-500">
                        피신고자 ID: {report.reportedMemberId}
                      </div>
                    </td>
                    <td className="px-6 py-5 align-top">
                      <span className="inline-flex whitespace-nowrap rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-slate-600">
                        {getDisplayType(report.reportType)}
                      </span>
                    </td>
                    <td className="px-6 py-5 align-top">
                      <p className="max-w-[260px] truncate text-sm text-gray-900">
                        {report.reason}
                      </p>
                    </td>
                    <td className="px-6 py-5 align-top">
                      <span
                        className={[
                          "inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.14em]",
                          statusStyles[report.status] ||
                            "bg-slate-100 text-slate-600",
                        ].join(" ")}
                      >
                        {report.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-5 align-top text-xs text-slate-500">
                      {formatDateTime(report.createdAt)}
                    </td>
                    <td className="w-[220px] min-w-[220px] max-w-[220px] px-6 py-5 align-top text-xs text-slate-500">
                      <div className="overflow-hidden text-ellipsis whitespace-nowrap font-semibold text-slate-700">
                        {report.reviewedByNickname || report.reviewedBy || "-"}
                      </div>
                      <div className="overflow-hidden text-ellipsis whitespace-nowrap">
                        처리자 ID: {report.reviewedBy || "-"}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between bg-blue-50/70 px-6 py-4 text-xs font-medium text-slate-500">
          <p>
            총 {reports.length}건 중 {filteredReports.length}건 표시 중
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-lg bg-white px-3 py-2 shadow-sm ring-1 ring-gray-200"
            >
              이전
            </button>
            <button
              type="button"
              className="rounded-lg bg-blue-600 px-3 py-2 font-bold text-white"
            >
              1
            </button>
            <button
              type="button"
              className="rounded-lg bg-white px-3 py-2 shadow-sm ring-1 ring-gray-200"
            >
              다음
            </button>
          </div>
        </div>
      </section>

      <div className="mt-6 text-sm text-slate-500">
        신고 항목을 클릭하면 상세 검토 화면으로 이동합니다.
      </div>
    </>
  );
}
