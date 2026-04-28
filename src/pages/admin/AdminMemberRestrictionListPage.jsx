import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { ApiError } from "../../api/client";
import {
  deactivateAdminMemberRestriction,
  getAllAdminMemberRestrictions,
} from "../../features/report/reportApi";

const restrictionTypeLabels = {
  LOGIN_BAN: "로그인 제한",
  CHAT_BAN: "채팅 제한",
  TRADE_BAN: "거래 제한",
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
    second: "2-digit",
    hour12: false,
  }).format(date);
}

function formatDateOnly(value) {
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
  }).format(date);
}

function getRestrictionStatus(restriction) {
  if (!restriction) {
    return "UNKNOWN";
  }

  if (!restriction.active) {
    return "DEACTIVATED";
  }

  if (restriction.endAt) {
    const endAt = new Date(restriction.endAt);
    if (!Number.isNaN(endAt.getTime()) && endAt.getTime() < Date.now()) {
      return "EXPIRED";
    }
  }

  return "ACTIVE";
}

function getStatusLabel(status) {
  if (status === "ACTIVE") {
    return "활성";
  }
  if (status === "EXPIRED") {
    return "만료";
  }
  if (status === "DEACTIVATED") {
    return "해제됨";
  }
  return status;
}

function getStatusBadge(status) {
  if (status === "ACTIVE") {
    return "text-emerald-600";
  }
  if (status === "EXPIRED") {
    return "text-amber-600";
  }
  return "text-slate-500";
}

function getStatusDot(status) {
  if (status === "ACTIVE") {
    return "bg-emerald-500";
  }
  if (status === "EXPIRED") {
    return "bg-amber-500";
  }
  return "bg-slate-400";
}

function getInitials(memberId) {
  if (!memberId) {
    return "MB";
  }

  return memberId.replace(/-/g, "").slice(0, 2).toUpperCase();
}

export default function AdminMemberRestrictionListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialKeyword = searchParams.get("memberId") || "";
  const initialMessage = searchParams.get("message") || "";

  const [keyword, setKeyword] = useState(initialKeyword);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [restrictions, setRestrictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [bannerMessage, setBannerMessage] = useState(initialMessage);
  const [deactivatingId, setDeactivatingId] = useState("");

  useEffect(() => {
    void loadRestrictions();
  }, []);

  useEffect(() => {
    if (!bannerMessage) {
      return undefined;
    }

    const timer = window.setTimeout(() => setBannerMessage(""), 3200);
    return () => window.clearTimeout(timer);
  }, [bannerMessage]);

  async function loadRestrictions() {
    try {
      setLoading(true);
      setErrorMessage("");
      const data = await getAllAdminMemberRestrictions();
      setRestrictions(Array.isArray(data) ? data : []);
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("제재 목록을 불러오지 못했습니다.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleDeactivate(restrictionId) {
    try {
      setDeactivatingId(restrictionId);
      setErrorMessage("");
      await deactivateAdminMemberRestriction(restrictionId);
      setRestrictions((current) =>
        current.map((item) =>
          item.restrictionId === restrictionId
            ? { ...item, active: false, updatedAt: new Date().toISOString() }
            : item,
        ),
      );
      setBannerMessage("제재를 해제했습니다.");
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("제재 해제에 실패했습니다.");
      }
    } finally {
      setDeactivatingId("");
    }
  }

  function applyKeywordFilter() {
    const next = new URLSearchParams(searchParams);

    if (keyword.trim()) {
      next.set("memberId", keyword.trim());
    } else {
      next.delete("memberId");
    }

    setSearchParams(next);
  }

  const filteredRestrictions = useMemo(() => {
    return restrictions.filter((restriction) => {
      const status = getRestrictionStatus(restriction);
      const matchesStatus = statusFilter === "ALL" || status === statusFilter;
      const normalizedKeyword = keyword.trim().toLowerCase();
      const matchesKeyword =
        !normalizedKeyword ||
        [
          restriction.restrictionId,
          restriction.memberId,
          restriction.memberNickname,
          restriction.adminId,
          restriction.adminNickname,
          restriction.reason,
          restrictionTypeLabels[restriction.restrictionType],
          restriction.restrictionType,
        ].some((value) =>
          String(value || "").toLowerCase().includes(normalizedKeyword),
        );

      return matchesStatus && matchesKeyword;
    });
  }, [keyword, restrictions, statusFilter]);

  return (
    <>
      <header className="mb-8">
        <h1 className="mb-2 text-4xl font-extrabold tracking-tight text-gray-900">
          제재 이력 목록
        </h1>
        <p className="text-sm text-slate-500">
          전체 회원의 제재 이력을 조회하고 필요하면 즉시 해제할 수 있습니다.
        </p>
      </header>

      {bannerMessage ? (
        <div className="mb-6 rounded border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {bannerMessage}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="mb-6 rounded border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {errorMessage}
        </div>
      ) : null}

      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-4 bg-white p-4 shadow-sm">
          <div className="relative min-w-[240px] flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              #
            </span>
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              className="w-full rounded border-none bg-blue-50 py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="회원 ID, 관리자 ID, 닉네임, 사유, 제재 유형으로 검색"
              type="text"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="min-w-[140px] rounded border-none bg-blue-50 px-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="ALL">전체 상태</option>
            <option value="ACTIVE">활성</option>
            <option value="EXPIRED">만료</option>
            <option value="DEACTIVATED">해제됨</option>
          </select>
          <button
            type="button"
            onClick={applyKeywordFilter}
            className="flex items-center gap-2 rounded bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-blue-700"
          >
            필터 적용
          </button>
          <button
            type="button"
            onClick={() => {
              setKeyword("");
              setStatusFilter("ALL");
              setSearchParams((prev) => {
                const next = new URLSearchParams(prev);
                next.delete("memberId");
                return next;
              });
            }}
            className="rounded bg-white px-5 py-2.5 text-sm font-bold text-slate-600 shadow-sm ring-1 ring-gray-200 transition hover:bg-slate-50"
          >
            초기화
          </button>
        </div>

        <div className="overflow-hidden bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-[1180px] border-collapse text-left">
              <thead>
                <tr className="bg-blue-50 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                  <th className="w-[240px] min-w-[240px] max-w-[240px] px-6 py-4">
                    대상 회원
                  </th>
                  <th className="min-w-[120px] px-6 py-4">제재 유형</th>
                  <th className="min-w-[260px] px-6 py-4">사유</th>
                  <th className="min-w-[100px] px-6 py-4">기간</th>
                  <th className="min-w-[140px] px-6 py-4">종료일</th>
                  <th className="min-w-[100px] px-6 py-4">상태</th>
                  <th className="w-[240px] min-w-[240px] max-w-[240px] px-6 py-4">
                    처리 관리자
                  </th>
                  <th className="min-w-[110px] px-6 py-4 text-right">작업</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-100">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-16 text-center text-sm text-slate-500">
                      제재 목록을 불러오는 중입니다...
                    </td>
                  </tr>
                ) : filteredRestrictions.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-16 text-center text-sm text-slate-500">
                      조건에 맞는 제재 이력이 없습니다.
                    </td>
                  </tr>
                ) : (
                  filteredRestrictions.map((restriction) => {
                    const status = getRestrictionStatus(restriction);
                    const isActive = status === "ACTIVE";
                    const isArchived = status !== "ACTIVE";

                    return (
                      <tr
                        key={restriction.restrictionId}
                        className={
                          isArchived
                            ? "bg-blue-50/40 opacity-70"
                            : "transition-colors hover:bg-blue-50/60"
                        }
                      >
                        <td className="w-[240px] min-w-[240px] max-w-[240px] px-6 py-5 align-top">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                              {getInitials(restriction.memberId)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="overflow-hidden text-ellipsis whitespace-nowrap text-sm font-bold text-slate-900">
                                {restriction.memberNickname || restriction.memberId}
                              </div>
                              <div className="overflow-hidden text-ellipsis whitespace-nowrap text-xs text-slate-500">
                                회원 ID: {restriction.memberId}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 align-top">
                          <span className="rounded-md bg-rose-50 px-2.5 py-1 text-[11px] font-bold uppercase text-rose-600">
                            {restrictionTypeLabels[restriction.restrictionType] ||
                              restriction.restrictionType}
                          </span>
                        </td>
                        <td className="px-6 py-5 align-top text-sm text-slate-500">
                          <div className="max-w-[260px] truncate">
                            {restriction.reason}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-5 align-top text-sm text-slate-900">
                          {restriction.durationHours >= 87600
                            ? "영구"
                            : `${restriction.durationHours}시간`}
                        </td>
                        <td className="px-6 py-5 align-top">
                          <div className="whitespace-nowrap text-sm font-medium">
                            {formatDateOnly(restriction.endAt)}
                          </div>
                          <div className="whitespace-nowrap text-[10px] text-slate-500">
                            {formatDateTime(restriction.endAt).split(" ").slice(-1)[0] || "-"}
                          </div>
                        </td>
                        <td className="px-6 py-5 align-top">
                          <span
                            className={[
                              "inline-flex items-center gap-1.5 whitespace-nowrap text-[11px] font-bold",
                              getStatusBadge(status),
                            ].join(" ")}
                          >
                            <span
                              className={[
                                "h-1.5 w-1.5 rounded-full",
                                getStatusDot(status),
                                isActive ? "animate-pulse" : "",
                              ].join(" ")}
                            />
                            {getStatusLabel(status)}
                          </span>
                        </td>
                        <td className="w-[240px] min-w-[240px] max-w-[240px] px-6 py-5 align-top text-xs text-slate-500">
                          <div className="overflow-hidden text-ellipsis whitespace-nowrap font-semibold text-slate-700">
                            {restriction.adminNickname || restriction.adminId || "-"}
                          </div>
                          <div className="overflow-hidden text-ellipsis whitespace-nowrap">
                            관리자 ID: {restriction.adminId || "-"}
                          </div>
                          <div className="whitespace-nowrap">
                            {formatDateTime(restriction.createdAt)}
                          </div>
                        </td>
                        <td className="px-6 py-5 align-top text-right">
                          <button
                            type="button"
                            disabled={!isActive || deactivatingId === restriction.restrictionId}
                            onClick={() => handleDeactivate(restriction.restrictionId)}
                            className="rounded-lg px-3 py-1.5 text-xs font-bold text-rose-600 transition-colors hover:bg-rose-50 disabled:cursor-not-allowed disabled:text-slate-400"
                          >
                            {isArchived
                              ? "종료됨"
                              : deactivatingId === restriction.restrictionId
                                ? "해제 중..."
                                : "제재 해제"}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-gray-200 bg-blue-50 px-6 py-4">
            <span className="text-xs text-slate-500">
              총 {restrictions.length}건 중 {filteredRestrictions.length}건 표시
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
