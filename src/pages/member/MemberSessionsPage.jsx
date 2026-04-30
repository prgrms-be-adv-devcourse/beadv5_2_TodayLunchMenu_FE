import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { ApiError } from "../../api/client";
import Button from "../../components/common/Button";
import ConfirmModal from "../../components/common/ConfirmModal";
import PageContainer from "../../components/common/PageContainer";
import { clearAuthState } from "../../features/auth/authStore";
import {
  fetchMySessionsApi,
  logoutAllSessionsApi,
  logoutCurrentSessionApi,
  logoutSessionByIdApi,
} from "../../features/auth/sessionManagementApi";
import { useAuth } from "../../features/auth/useAuth";

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
  }).format(date);
}

function summarizeUserAgent(userAgent) {
  if (!userAgent) {
    return "Unknown device";
  }

  const normalized = userAgent.toLowerCase();

  const browser = normalized.includes("edg/")
    ? "Edge"
    : normalized.includes("chrome/")
      ? "Chrome"
      : normalized.includes("safari/") && !normalized.includes("chrome/")
        ? "Safari"
        : normalized.includes("firefox/")
          ? "Firefox"
          : normalized.includes("whale/")
            ? "Whale"
            : "Browser";

  const device = normalized.includes("iphone")
    ? "iPhone"
    : normalized.includes("ipad")
      ? "iPad"
      : normalized.includes("android")
        ? "Android"
        : normalized.includes("mac os x") || normalized.includes("macintosh")
          ? "Mac"
          : normalized.includes("windows")
            ? "Windows"
            : "Device";

  return `${browser} on ${device}`;
}

function SessionSkeleton() {
  return (
    <div className="space-y-4">
      {[0, 1, 2].map((item) => (
        <div
          key={item}
          className="overflow-hidden border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="animate-pulse space-y-4">
            <div className="h-4 w-32 bg-slate-200" />
            <div className="h-8 w-3/4 bg-slate-100" />
            <div className="grid gap-3 md:grid-cols-3">
              <div className="h-14 bg-slate-100" />
              <div className="h-14 bg-slate-100" />
              <div className="h-14 bg-slate-100" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function SessionInfo({ label, value, accent = false }) {
  return (
    <div className="border border-slate-200 bg-white/75 p-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>
      <p
        className={`mt-2 text-sm font-semibold ${accent ? "text-amber-700" : "text-slate-900"}`}
      >
        {value}
      </p>
    </div>
  );
}

export default function MemberSessionsPage() {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [noticeMessage, setNoticeMessage] = useState("");
  const [pendingSessionId, setPendingSessionId] = useState("");
  const [isLoggingOutAll, setIsLoggingOutAll] = useState(false);
  const [confirmState, setConfirmState] = useState({
    open: false,
    type: "single",
    session: null,
  });

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadSessions() {
      try {
        setLoading(true);
        setErrorMessage("");
        const response = await fetchMySessionsApi();

        if (!cancelled) {
          setSessions(response?.sessions ?? []);
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error instanceof ApiError
              ? error.message
              : "세션 정보를 불러오지 못했습니다.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadSessions();

    return () => {
      cancelled = true;
    };
  }, [authLoading, isAuthenticated]);

  const currentSession = useMemo(
    () => sessions.find((session) => session.current) ?? null,
    [sessions],
  );

  const handleAuthExit = (message) => {
    clearAuthState();
    navigate("/login", {
      replace: true,
      state: message ? { notice: message } : undefined,
    });
  };

  const openSingleConfirm = (session) => {
    setConfirmState({
      open: true,
      type: "single",
      session,
    });
  };

  const openAllConfirm = () => {
    setConfirmState({
      open: true,
      type: "all",
      session: null,
    });
  };

  const closeConfirm = () => {
    setConfirmState((prev) => ({ ...prev, open: false }));
  };

  const handleLogoutSingle = async (session) => {
    if (!session?.sessionId) {
      return;
    }

    try {
      setPendingSessionId(session.sessionId);
      setErrorMessage("");
      setNoticeMessage("");
      await logoutSessionByIdApi(session.sessionId);

      if (session.current) {
        handleAuthExit("현재 기기에서 로그아웃되었습니다.");
        return;
      }

      setSessions((prev) =>
        prev.filter((item) => item.sessionId !== session.sessionId),
      );
      setNoticeMessage("선택한 세션을 종료했습니다.");
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError ? error.message : "세션 종료에 실패했습니다.",
      );
    } finally {
      setPendingSessionId("");
      closeConfirm();
    }
  };

  const handleLogoutCurrent = async () => {
    try {
      setPendingSessionId(currentSession?.sessionId ?? "current");
      setErrorMessage("");
      setNoticeMessage("");
      await logoutCurrentSessionApi();
      handleAuthExit("현재 기기에서 로그아웃되었습니다.");
    } catch (error) {
      setPendingSessionId("");
      setErrorMessage(
        error instanceof ApiError
          ? error.message
          : "현재 세션 로그아웃에 실패했습니다.",
      );
    }
  };

  const handleLogoutAll = async () => {
    try {
      setIsLoggingOutAll(true);
      setErrorMessage("");
      setNoticeMessage("");
      await logoutAllSessionsApi();
      handleAuthExit("모든 기기에서 로그아웃되었습니다.");
    } catch (error) {
      setIsLoggingOutAll(false);
      closeConfirm();
      setErrorMessage(
        error instanceof ApiError
          ? error.message
          : "전체 로그아웃에 실패했습니다.",
      );
    }
  };

  const handleConfirm = async () => {
    if (confirmState.type === "all") {
      await handleLogoutAll();
      return;
    }

    await handleLogoutSingle(confirmState.session);
  };

  if (authLoading || loading) {
    return (
      <PageContainer>
        <div className="leading-[1.2]">
          <SessionSkeleton />
        </div>
      </PageContainer>
    );
  }

  if (!isAuthenticated) {
    return (
      <PageContainer>
        <div className="leading-[1.2]">
          <section className="border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-blue-600">
              Session Security
            </p>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950">
              로그인이 필요합니다
            </h1>
            <p className="mt-3 text-sm font-medium leading-6 text-slate-600">
              로그인된 기기 목록을 확인하려면 먼저 로그인해 주세요.
            </p>
            <div className="mt-6 flex justify-center">
              <Link to="/login">
                <Button>로그인하러 가기</Button>
              </Link>
            </div>
          </section>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="leading-[1.2]">
        <section className="relative overflow-hidden border border-slate-200 bg-[linear-gradient(135deg,#fff8ef_0%,#fff_48%,#eef6ff_100%)] px-6 py-8 shadow-sm sm:px-8">
          <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-amber-300/20 blur-3xl" />
          <div className="absolute -left-10 bottom-0 h-32 w-32 rounded-full bg-blue-300/20 blur-3xl" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl text-left">
              <p className="text-sm font-bold uppercase tracking-[0.24em] text-amber-700">
                Session Security
              </p>
              <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                로그인된 기기 관리
              </h1>
              <p className="mt-3 text-sm font-medium leading-7 text-slate-600 sm:text-base">
                내 계정에 로그인된 기기와 세션을 한눈에 확인하고, 필요할 때 바로
                종료할 수 있어요.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link to="/me">
                <Button variant="secondary">마이페이지</Button>
              </Link>
              <Button
                variant="danger"
                onClick={openAllConfirm}
                disabled={isLoggingOutAll || sessions.length === 0}
              >
                {isLoggingOutAll ? "로그아웃 중..." : "모든 기기 로그아웃"}
              </Button>
            </div>
          </div>
        </section>

        {noticeMessage ? (
          <section className="mt-6 border border-emerald-100 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-700">
            {noticeMessage}
          </section>
        ) : null}

        {errorMessage ? (
          <section className="mt-6 border border-red-100 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
            {errorMessage}
          </section>
        ) : null}

        {currentSession ? (
          <section className="mt-8 border border-amber-200 bg-amber-50/70 p-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="text-left">
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-amber-700">
                  Current Session
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                  {summarizeUserAgent(currentSession.userAgent)}
                </h2>
                <p className="mt-2 text-sm font-medium text-slate-600">
                  최근 활동 {formatDateTime(currentSession.lastAccessedAt)}
                </p>
              </div>

              <Button
                variant="secondary"
                className="border border-amber-200 text-amber-800 hover:bg-amber-100"
                onClick={handleLogoutCurrent}
                disabled={pendingSessionId === currentSession.sessionId}
              >
                {pendingSessionId === currentSession.sessionId
                  ? "처리 중..."
                  : "이 기기 로그아웃"}
              </Button>
            </div>
          </section>
        ) : null}

        <section className="mt-8 space-y-4">
          {sessions.length === 0 ? (
            <div className="border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
              <p className="text-lg font-bold text-slate-900">
                활성 세션이 없습니다
              </p>
              <p className="mt-2 text-sm font-medium text-slate-500">
                다시 로그인하면 여기에 기기 정보가 표시됩니다.
              </p>
            </div>
          ) : (
            sessions.map((session) => (
              <article
                key={session.sessionId}
                className={`overflow-hidden border p-5 text-left shadow-sm transition ${
                  session.current
                    ? "border-amber-200 bg-[linear-gradient(135deg,#fffef8_0%,#ffffff_100%)]"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-slate-900 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white">
                        {summarizeUserAgent(session.userAgent)}
                      </span>
                      {session.current ? (
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-amber-800">
                          Current
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                      <SessionInfo
                        label="Created"
                        value={formatDateTime(session.createdAt)}
                      />
                      <SessionInfo
                        label="Last Active"
                        value={formatDateTime(session.lastAccessedAt)}
                        accent={session.current}
                      />
                      <SessionInfo
                        label="Last Refresh"
                        value={formatDateTime(session.lastRefreshedAt)}
                      />
                      <SessionInfo
                        label="IP Address"
                        value={session.ipAddress || "-"}
                      />
                    </div>

                    <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3">
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                        User Agent
                      </p>
                      <p className="mt-2 break-all text-sm font-medium leading-6 text-slate-600">
                        {session.userAgent || "No user agent data"}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-start">
                    <Button
                      variant={session.current ? "secondary" : "danger"}
                      className={
                        session.current
                          ? "border border-slate-200 text-slate-800 hover:bg-slate-100"
                          : ""
                      }
                      onClick={() => openSingleConfirm(session)}
                      disabled={
                        pendingSessionId === session.sessionId ||
                        isLoggingOutAll
                      }
                    >
                      {pendingSessionId === session.sessionId
                        ? "처리 중..."
                        : session.current
                          ? "이 기기 로그아웃"
                          : "이 세션 종료"}
                    </Button>
                  </div>
                </div>
              </article>
            ))
          )}
        </section>

        <ConfirmModal
          open={confirmState.open}
          onClose={closeConfirm}
          title={
            confirmState.type === "all"
              ? "모든 기기에서 로그아웃할까요?"
              : confirmState.session?.current
                ? "현재 기기에서 로그아웃할까요?"
                : "선택한 세션을 종료할까요?"
          }
          description={
            confirmState.type === "all"
              ? "이 작업을 진행하면 모든 로그인 기기에서 세션이 종료되고 다시 로그인해야 합니다."
              : confirmState.session?.current
                ? "현재 브라우저의 로그인도 즉시 해제됩니다."
                : "선택한 기기에서는 다시 로그인하기 전까지 계정을 사용할 수 없습니다."
          }
          confirmText={
            confirmState.type === "all"
              ? "전체 로그아웃"
              : confirmState.session?.current
                ? "현재 기기 로그아웃"
                : "세션 종료"
          }
          confirmVariant="danger"
          onConfirm={handleConfirm}
        >
          {confirmState.type === "single" && confirmState.session ? (
            <div className="space-y-3 rounded-2xl bg-slate-50 p-4 text-left">
              <p className="text-sm font-semibold text-slate-900">
                {summarizeUserAgent(confirmState.session.userAgent)}
              </p>
              <p className="text-xs font-medium text-slate-500">
                최근 활동 {formatDateTime(confirmState.session.lastAccessedAt)}
              </p>
            </div>
          ) : null}
        </ConfirmModal>
      </div>
    </PageContainer>
  );
}
