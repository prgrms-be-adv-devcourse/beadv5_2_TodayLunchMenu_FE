import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { ApiError } from "../../api/client";
import Button from "../../components/common/Button";
import PageContainer from "../../components/common/PageContainer";
import { fetchKakaoLinkAuthorizeUrlApi } from "../../features/auth/authApi";
import { useAuth } from "../../features/auth/useAuth";
import {
  getMyOauthAccountsApi,
  unlinkMyOauthAccountApi,
} from "../../features/member/memberApi";

const KAKAO_PROVIDER = "KAKAO";

function formatDate(value) {
  if (!value) {
    return "연결 정보 없음";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "연결 정보 없음";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function getSecurityLabel(connection) {
  if (!connection) {
    return "아직 연결되지 않았습니다.";
  }

  if (connection.canUnlink) {
    return "연동 해제가 가능한 계정입니다.";
  }

  return "현재 마지막 로그인 수단이라 해제할 수 없습니다.";
}

function InfoRow({ label, value, accent = false }) {
  return (
    <div>
      <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.18em] text-violet-500/70">
        {label}
      </p>
      <p className={accent ? "font-semibold text-violet-700" : "font-semibold text-slate-900"}>
        {value}
      </p>
    </div>
  );
}

function ProviderCard({
  name,
  description,
  connected,
  tone = "neutral",
  actionLabel,
  onAction,
  actionDisabled = false,
  actionBusy = false,
  children,
}) {
  const toneClass =
    tone === "kakao"
      ? "border-yellow-200/80 bg-gradient-to-br from-yellow-50 via-white to-violet-50"
      : "border-violet-100 bg-white/80";

  return (
    <article
      className={`rounded-[28px] border p-6 shadow-[0_24px_60px_-32px_rgba(76,29,149,0.35)] backdrop-blur ${toneClass}`}
    >
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div className="flex items-center gap-4">
          <div
            className={`flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg ${
              tone === "kakao" ? "bg-[#FEE500]" : "bg-violet-100"
            }`}
          >
            {tone === "kakao" ? (
              <svg width="30" height="30" viewBox="0 0 24 24" fill="#3C1E1E" aria-hidden="true">
                <path d="M12 3C6.477 3 2 6.48 2 10.78c0 2.76 1.83 5.19 4.6 6.59l-.9 3.32c-.05.18.15.34.28.23l4.03-2.68c.63.09 1.29.14 1.99.14 5.523 0 10-3.48 10-7.78S17.523 3 12 3z" />
              </svg>
            ) : (
              <span className="text-xl font-black text-violet-700">{name.slice(0, 1)}</span>
            )}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-black tracking-tight text-slate-950">{name}</h2>
              <span
                className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] ${
                  connected ? "bg-violet-100 text-violet-700" : "bg-slate-100 text-slate-500"
                }`}
              >
                {connected ? "연결됨" : "미연결"}
              </span>
            </div>
            <p className="mt-2 text-sm font-medium leading-6 text-slate-600">{description}</p>
          </div>
        </div>

        <Button
          variant={connected ? "secondary" : "primary"}
          className={connected ? "border border-red-100 text-red-600 hover:bg-red-50" : ""}
          onClick={onAction}
          disabled={actionDisabled || actionBusy}
        >
          {actionBusy ? "처리 중..." : actionLabel}
        </Button>
      </div>

      <div className="mt-6">{children}</div>
    </article>
  );
}

function UnlinkConfirmModal({
  open,
  onClose,
  onConfirm,
  isSubmitting,
  connection,
  canUnlink,
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/35 p-4 backdrop-blur-sm sm:items-center">
      <div
        className="w-full max-w-xl overflow-hidden rounded-[32px] border border-violet-100 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(249,237,255,0.98)_100%)] shadow-[0_40px_120px_-35px_rgba(76,29,149,0.45)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="unlink-modal-title"
      >
        <div className="relative overflow-hidden px-6 pb-6 pt-6 sm:px-8">
          <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-violet-200/50 blur-3xl" />
          <div className="absolute -left-10 bottom-0 h-24 w-24 rounded-full bg-rose-200/50 blur-3xl" />

          <div className="relative">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FEE500] shadow-lg">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="#3C1E1E" aria-hidden="true">
                    <path d="M12 3C6.477 3 2 6.48 2 10.78c0 2.76 1.83 5.19 4.6 6.59l-.9 3.32c-.05.18.15.34.28.23l4.03-2.68c.63.09 1.29.14 1.99.14 5.523 0 10-3.48 10-7.78S17.523 3 12 3z" />
                  </svg>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-violet-500">
                    Secure Connection
                  </p>
                  <h2
                    id="unlink-modal-title"
                    className="mt-2 text-2xl font-black tracking-tight text-slate-950"
                  >
                    카카오 연동을 해제할까요?
                  </h2>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-slate-500 transition hover:bg-white hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="모달 닫기"
              >
                X
              </button>
            </div>

            <div className="mt-6 rounded-[28px] border border-violet-100/80 bg-white/80 p-5 shadow-sm">
              <p className="text-sm font-medium leading-6 text-slate-600">
                연동을 해제하면 다음부터는 카카오로 바로 로그인할 수 없어요. TodayLunch
                계정 자체는 유지되며, 필요하면 나중에 다시 연결할 수 있습니다.
              </p>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <InfoRow
                  label="연결 계정"
                  value={connection?.providerEmail || "카카오 계정 이메일 정보 없음"}
                />
                <InfoRow
                  label="프로필 닉네임"
                  value={connection?.providerNickname || "닉네임 정보 없음"}
                />
                <InfoRow label="최초 연결일" value={formatDate(connection?.linkedAt)} />
                <InfoRow
                  label="보안 상태"
                  value={
                    canUnlink
                      ? "해제 후에도 다른 로그인 수단이 유지됩니다."
                      : "마지막 로그인 수단은 해제할 수 없습니다."
                  }
                  accent
                />
              </div>
            </div>

            <div className="mt-5 rounded-2xl border-l-4 border-violet-300 bg-violet-50/80 px-4 py-4">
              <p className="text-sm font-medium leading-6 text-slate-600">
                비밀번호가 설정되어 있지 않으면 마지막 외부 계정은 해제할 수 없어요.
              </p>
              <p className="mt-1 text-xs font-medium text-slate-500">
                계정 보안을 위해 최소 하나 이상의 로그인 수단을 유지해야 합니다.
              </p>
            </div>

            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={isSubmitting}
                className="sm:min-w-[120px]"
              >
                취소
              </Button>
              <Button
                type="button"
                variant="danger"
                onClick={onConfirm}
                disabled={isSubmitting || !canUnlink}
                className="sm:min-w-[140px]"
              >
                {isSubmitting ? "연동 해제 중..." : "연동 해제"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ExternalAccountConnectionsPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [oauthData, setOauthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [noticeMessage, setNoticeMessage] = useState("");
  const [isUnlinking, setIsUnlinking] = useState(false);
  const [isStartingLink, setIsStartingLink] = useState(false);
  const [showUnlinkConfirm, setShowUnlinkConfirm] = useState(false);

  useEffect(() => {
    const linked = searchParams.get("oauthLinked");
    const oauthError = searchParams.get("oauthError");

    if (linked === KAKAO_PROVIDER) {
      setNoticeMessage("카카오 계정이 현재 계정에 바로 연결되었어요.");
    } else {
      setNoticeMessage("");
    }

    if (oauthError) {
      setErrorMessage(oauthError);
    }
  }, [searchParams]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadOauthAccounts() {
      try {
        setLoading(true);
        const response = await getMyOauthAccountsApi();

        if (!cancelled) {
          setOauthData(response);
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error instanceof ApiError
              ? error.message
              : "외부 계정 연동 정보를 불러오지 못했습니다."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadOauthAccounts();

    return () => {
      cancelled = true;
    };
  }, [authLoading, isAuthenticated]);

  const kakaoConnection = useMemo(() => {
    const accounts = oauthData?.accounts || [];
    return accounts.find((account) => account.provider === KAKAO_PROVIDER) || null;
  }, [oauthData]);

  const hasPasswordLogin = oauthData?.hasPasswordLogin ?? false;
  const canRemoveLastOauthAccount = oauthData?.canRemoveLastOauthAccount ?? false;

  const clearFeedbackQuery = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("oauthLinked");
    next.delete("oauthError");
    setSearchParams(next, { replace: true });
  };

  const handleStartKakaoLink = async () => {
    try {
      setIsStartingLink(true);
      setErrorMessage("");
      clearFeedbackQuery();

      const response = await fetchKakaoLinkAuthorizeUrlApi();
      const authorizeUrl = response?.authorizeUrl;

      if (!authorizeUrl) {
        throw new Error("카카오 연동 URL을 확인할 수 없습니다.");
      }

      window.location.href = authorizeUrl;
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError ? error.message : "카카오 계정 연동을 시작하지 못했습니다."
      );
      setIsStartingLink(false);
    }
  };

  const handleConfirmUnlink = async () => {
    try {
      setIsUnlinking(true);
      setErrorMessage("");
      setNoticeMessage("");

      await unlinkMyOauthAccountApi(KAKAO_PROVIDER);

      setOauthData((prev) => {
        const nextAccounts = (prev?.accounts || []).filter(
          (account) => account.provider !== KAKAO_PROVIDER
        );

        return {
          accounts: nextAccounts,
          hasPasswordLogin: prev?.hasPasswordLogin ?? false,
          canRemoveLastOauthAccount: (prev?.hasPasswordLogin ?? false) || nextAccounts.length > 1,
        };
      });
      setShowUnlinkConfirm(false);
      setNoticeMessage("카카오 연동이 해제되었습니다.");
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError ? error.message : "외부 계정 연동 해제에 실패했습니다."
      );
    } finally {
      setIsUnlinking(false);
    }
  };

  if (authLoading || loading) {
    return (
      <PageContainer>
        <div className="rounded-[28px] bg-white px-6 py-12 text-center text-sm font-medium text-slate-500 shadow-sm ring-1 ring-violet-100">
          외부 계정 연동 정보를 불러오는 중입니다...
        </div>
      </PageContainer>
    );
  }

  if (!isAuthenticated) {
    return (
      <PageContainer>
        <div className="rounded-[28px] bg-white px-6 py-12 text-center shadow-sm ring-1 ring-violet-100">
          <h1 className="text-2xl font-black tracking-tight text-slate-950">
            로그인 후 이용할 수 있어요
          </h1>
          <p className="mt-3 text-sm font-medium leading-6 text-slate-600">
            외부 계정 연동 상태를 조회하거나 해제하려면 먼저 로그인해 주세요.
          </p>
          <div className="mt-6 flex justify-center">
            <Link to="/login">
              <Button>로그인하러 가기</Button>
            </Link>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <section className="relative overflow-hidden rounded-[36px] bg-gradient-to-br from-violet-50 via-[#fdf7ff] to-amber-50 px-6 py-8 shadow-[0_32px_90px_-40px_rgba(91,33,182,0.45)] sm:px-8">
        <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-violet-300/20 blur-3xl" />
        <div className="absolute -left-10 bottom-0 h-32 w-32 rounded-full bg-amber-300/20 blur-3xl" />

        <div className="relative flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-violet-600">
              Account Security
            </p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              외부 계정 연동 관리
            </h1>
            <p className="mt-3 text-base font-medium leading-7 text-slate-600 sm:text-lg">
              카카오 같은 외부 계정을 연결하면 더 간편하게 로그인할 수 있어요. 이
              페이지에서 현재 연동 상태를 확인하고, 필요하면 연결을 해제할 수 있습니다.
            </p>
          </div>

          <Link
            to="/me"
            className="inline-flex items-center justify-center rounded-full border border-violet-200 bg-white/80 px-5 py-3 text-sm font-bold text-violet-700 transition hover:bg-white"
          >
            마이페이지로 돌아가기
          </Link>
        </div>
      </section>

      {noticeMessage ? (
        <section className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-700">
          {noticeMessage}
        </section>
      ) : null}

      {errorMessage ? (
        <section className="mt-6 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
          {errorMessage}
        </section>
      ) : null}

      <section className="mt-8">
        <ProviderCard
          name="Kakao Sync"
          description="카카오 계정을 연결하면 카카오 로그인으로 TodayLunch에 바로 들어올 수 있어요."
          connected={Boolean(kakaoConnection)}
          tone="kakao"
          actionLabel={kakaoConnection ? "연동 해제" : "카카오 계정 연결"}
          actionBusy={kakaoConnection ? isUnlinking : isStartingLink}
          actionDisabled={false}
          onAction={() => {
            if (kakaoConnection) {
              setShowUnlinkConfirm(true);
              return;
            }

            handleStartKakaoLink();
          }}
        >
          <div className="grid gap-5 border-t border-violet-100 pt-6 md:grid-cols-2">
            <InfoRow
              label="이메일 주소"
              value={kakaoConnection?.providerEmail || "카카오 계정을 연결하면 표시됩니다."}
            />
            <InfoRow
              label="닉네임"
              value={kakaoConnection?.providerNickname || "카카오 프로필 닉네임이 표시됩니다."}
            />
            <InfoRow label="최초 연결일" value={formatDate(kakaoConnection?.linkedAt)} />
            <InfoRow label="보안 상태" value={getSecurityLabel(kakaoConnection)} accent />
          </div>

          {kakaoConnection && !kakaoConnection.canUnlink ? (
            <div className="mt-5 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-4 text-sm text-amber-700">
              현재 계정은 마지막 로그인 수단 보호 규칙이 적용되어 있어 카카오 연동을 바로
              해제할 수 없습니다.
            </div>
          ) : null}
        </ProviderCard>
      </section>

      <section className="mt-8 rounded-[28px] border border-violet-100 bg-violet-50/80 p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-start">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-lg font-bold text-violet-700 shadow-sm">
            i
          </div>
          <div>
            <h2 className="text-lg font-black tracking-tight text-slate-950">연동 정책 안내</h2>
            <p className="mt-2 text-sm font-medium leading-6 text-slate-600">
              비밀번호가 설정되어 있지 않으면 마지막 외부 계정은 해제할 수 없어요. 계정
              보안을 위해 최소 하나 이상의 로그인 수단을 유지해야 합니다.
            </p>
            <p className="mt-3 text-sm font-medium leading-6 text-slate-500">
              현재 상태: {hasPasswordLogin ? "비밀번호 로그인 가능" : "외부 로그인만 사용 중"}
              {" · "}
              {canRemoveLastOauthAccount
                ? "마지막 외부 계정 해제 가능"
                : "마지막 외부 계정 해제 제한"}
            </p>
          </div>
        </div>
      </section>

      <UnlinkConfirmModal
        open={showUnlinkConfirm}
        onClose={() => setShowUnlinkConfirm(false)}
        onConfirm={handleConfirmUnlink}
        isSubmitting={isUnlinking}
        connection={kakaoConnection}
        canUnlink={Boolean(kakaoConnection?.canUnlink)}
      />
    </PageContainer>
  );
}
