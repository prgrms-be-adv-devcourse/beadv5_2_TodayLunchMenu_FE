import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { ApiError } from "../../api/client";
import Button from "../../components/common/Button";
import FormField from "../../components/common/FormField";
import Input from "../../components/common/Input";
import PageContainer from "../../components/common/PageContainer";
import { setAuthTokens } from "../../features/auth/authStore";
import { useAuth } from "../../features/auth/useAuth";
import {
  cancelAccountVerificationApi,
  confirmAccountVerificationApi,
  getCurrentAccountVerificationApi,
  resendAccountVerificationApi,
} from "../../features/seller/accountVerificationApi";
import {
  clearPendingSellerVerification,
  getPendingSellerVerification,
  savePendingSellerVerification,
} from "../../features/seller/accountVerificationStorage";

const CODE_LENGTH = 6;
const MAX_ATTEMPTS = 5;
const MAX_RESEND_COUNT = 3;

function createFallbackExpiresAt() {
  return new Date(Date.now() + 3 * 60 * 1000).toISOString();
}

function parseLocalDateTime(value) {
  if (!value || typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().replace(" ", "T");
  const match = normalized.match(
    /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}:\d{2})(\.(\d+))?$/
  );

  if (!match) {
    const parsed = new Date(normalized);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const datePart = match[1];
  const timePart = match[2];
  const fractional = match[4] ? match[4].slice(0, 3).padEnd(3, "0") : "000";
  const parsed = new Date(`${datePart}T${timePart}.${fractional}+09:00`);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function buildVerificationModel(source) {
  if (!source?.sessionId) {
    return null;
  }

  return {
    sessionId: source.sessionId,
    status: source.status ?? "PENDING",
    bankName: source.bankName ?? "등록 계좌",
    maskedAccountNumber: source.maskedAccountNumber ?? "",
    verificationCode: source.verificationCode ?? "",
    expiresAt: source.expiresAt ?? createFallbackExpiresAt(),
    attemptCount: Number(source.attemptCount ?? 0),
    resendCount: Number(source.resendCount ?? 0),
  };
}

function mergeVerification(current, incoming) {
  if (!incoming?.sessionId) {
    return current;
  }

  return {
    ...current,
    ...incoming,
    verificationCode:
      incoming.verificationCode ?? current?.verificationCode ?? "",
    bankName: incoming.bankName ?? current?.bankName ?? "등록 계좌",
    maskedAccountNumber:
      incoming.maskedAccountNumber ?? current?.maskedAccountNumber ?? "",
  };
}

function formatRemainingTime(expiresAt) {
  const expiresAtDate = parseLocalDateTime(expiresAt);
  if (!expiresAtDate) {
    return "00:00";
  }

  const remaining = expiresAtDate.getTime() - Date.now();
  if (remaining <= 0) {
    return "00:00";
  }

  const totalSeconds = Math.floor(remaining / 1000);
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");

  return `${minutes}:${seconds}`;
}

function formatDateTime(value) {
  const parsed = parseLocalDateTime(value);
  if (!parsed) {
    return "-";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

function getStatusBadgeClass(status) {
  switch (status) {
    case "VERIFIED":
      return "bg-emerald-100 text-emerald-700 ring-emerald-200";
    case "FAILED":
    case "EXPIRED":
    case "CANCELLED":
      return "bg-red-100 text-red-700 ring-red-200";
    default:
      return "bg-violet-100 text-violet-700 ring-violet-200";
  }
}

function getStatusText(status) {
  switch (status) {
    case "VERIFIED":
      return "인증 완료";
    case "FAILED":
      return "인증 실패";
    case "EXPIRED":
      return "만료됨";
    case "CANCELLED":
      return "취소됨";
    default:
      return "인증 대기";
  }
}

export default function SellerAccountVerificationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshUser } = useAuth();

  const initialVerification = useMemo(() => {
    const fromStorage = buildVerificationModel(getPendingSellerVerification());
    const fromRoute = buildVerificationModel(location.state);
    return mergeVerification(fromStorage, fromRoute);
  }, [location.state]);

  const [verification, setVerification] = useState(initialVerification);
  const [code, setCode] = useState(initialVerification?.verificationCode ?? "");
  const [loadingCurrent, setLoadingCurrent] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [remainingTime, setRemainingTime] = useState(
    formatRemainingTime(initialVerification?.expiresAt)
  );

  const syncCurrentVerification = async () => {
    const current = await getCurrentAccountVerificationApi();

    if (!current?.sessionId) {
      clearPendingSellerVerification();
      setVerification(null);
      return null;
    }

    const nextVerification = buildVerificationModel(current);
    setVerification((prev) => mergeVerification(prev, nextVerification));
    setRemainingTime(formatRemainingTime(nextVerification?.expiresAt));

    return nextVerification;
  };

  useEffect(() => {
    if (!verification?.sessionId) {
      clearPendingSellerVerification();
      return;
    }

    savePendingSellerVerification({
      ...verification,
      verificationCode: code,
    });
  }, [code, verification]);

  useEffect(() => {
    setRemainingTime(formatRemainingTime(verification?.expiresAt));

    const timer = window.setInterval(() => {
      setRemainingTime(formatRemainingTime(verification?.expiresAt));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [verification?.expiresAt]);

  useEffect(() => {
    let mounted = true;

    async function loadCurrentVerification() {
      try {
        setLoadingCurrent(true);
        setError("");

        const current = await getCurrentAccountVerificationApi();
        if (!mounted) {
          return;
        }

        if (!current?.sessionId) {
          if (!verification?.sessionId) {
            clearPendingSellerVerification();
          }
          return;
        }

        const nextVerification = buildVerificationModel(current);
        setVerification((prev) => mergeVerification(prev, nextVerification));
        setRemainingTime(formatRemainingTime(nextVerification?.expiresAt));
      } catch (loadError) {
        if (!mounted) {
          return;
        }

        if (loadError instanceof ApiError && loadError.status === 401) {
          navigate("/login");
          return;
        }

        setError(
          loadError instanceof ApiError
            ? loadError.message
            : "계좌 인증 정보를 불러오는 중 오류가 발생했습니다."
        );
      } finally {
        if (mounted) {
          setLoadingCurrent(false);
        }
      }
    }

    loadCurrentVerification();

    return () => {
      mounted = false;
    };
  }, [navigate, verification?.sessionId]);

  const verificationDigits = (code || "")
    .slice(0, CODE_LENGTH)
    .padEnd(CODE_LENGTH, " ")
    .split("");

  const hasSession = Boolean(verification?.sessionId);
  const apiStatus = verification?.status ?? "PENDING";
  const isExpired = apiStatus === "EXPIRED";
  const isVerified = apiStatus === "VERIFIED";
  const isAttemptLimitExceeded = (verification?.attemptCount ?? 0) >= MAX_ATTEMPTS;
  const isResendLimitExceeded =
    (verification?.resendCount ?? 0) >= MAX_RESEND_COUNT;
  const isVerificationLocked =
    !hasSession ||
    loadingCurrent ||
    submitting ||
    resending ||
    cancelling ||
    isExpired ||
    isAttemptLimitExceeded ||
    isResendLimitExceeded;
  const isSecondaryActionDisabled = isVerificationLocked || isVerified;
  const disabledButtonClassName =
    "bg-gray-200 text-gray-500 shadow-none hover:bg-gray-200 hover:brightness-100";

  const handleCodeChange = (event) => {
    const nextCode = event.target.value.replace(/\D/g, "").slice(0, CODE_LENGTH);
    setCode(nextCode);
    setError("");
    setNotice("");
  };

  const handleConfirm = async () => {
    if (isVerified) {
      navigate("/seller/products");
      return;
    }

    if (!verification?.sessionId) {
      setError("진행 중인 계좌 인증 세션이 없습니다.");
      return;
    }

    if (code.length !== CODE_LENGTH) {
      setError(`인증 코드는 ${CODE_LENGTH}자리 숫자로 입력해 주세요.`);
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setNotice("");

      const result = await confirmAccountVerificationApi({
        sessionId: verification.sessionId,
        code,
      });

      const promotedAuth = result?.auth;
      if (!promotedAuth?.accessToken || !promotedAuth?.refreshToken) {
        throw new Error(
          "판매자 권한 토큰이 응답에 포함되지 않았습니다. confirm 응답을 확인해 주세요."
        );
      }

      setAuthTokens({
        accessToken: promotedAuth.accessToken,
        refreshToken: promotedAuth.refreshToken,
      });

      setVerification((prev) =>
        mergeVerification(prev, {
          sessionId: result?.sessionId ?? verification.sessionId,
          status: result?.status ?? "VERIFIED",
          attemptCount: result?.attemptCount ?? prev?.attemptCount ?? 0,
        })
      );
      const refreshedUser = await refreshUser();
      if (refreshedUser?.role !== "SELLER") {
        throw new Error("새 토큰으로 사용자 정보를 갱신했지만 판매자 권한이 반영되지 않았습니다.");
      }

      clearPendingSellerVerification();
      setNotice("계좌 인증이 완료되었습니다. 판매 기능을 바로 이용할 수 있습니다.");
    } catch (submitError) {
      setError(
        submitError instanceof ApiError
          ? submitError.message
          : submitError instanceof Error
            ? submitError.message
            : "계좌 인증을 완료하는 중 오류가 발생했습니다."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!verification?.sessionId) {
      setError("재전송할 계좌 인증 세션이 없습니다.");
      return;
    }

    try {
      setResending(true);
      setError("");
      setNotice("");

      const result = await resendAccountVerificationApi(verification.sessionId);
      const nextVerification = mergeVerification(verification, {
        ...result,
        bankName: verification.bankName,
      });

      setVerification(nextVerification);
      setRemainingTime(formatRemainingTime(nextVerification?.expiresAt));
      setCode(result?.verificationCode ?? "");
      await syncCurrentVerification();
      setNotice("새 인증 코드가 자동 입력되었습니다.");
    } catch (resendError) {
      setError(
        resendError instanceof ApiError
          ? resendError.message
          : "인증 코드 재전송 중 오류가 발생했습니다."
      );
    } finally {
      setResending(false);
    }
  };

  const handleCancel = async () => {
    if (!verification?.sessionId) {
      navigate("/seller/register");
      return;
    }

    try {
      setCancelling(true);
      setError("");
      setNotice("");

      await cancelAccountVerificationApi(verification.sessionId);
      clearPendingSellerVerification();
      setVerification((prev) =>
        prev
          ? {
              ...prev,
              status: "CANCELLED",
            }
          : prev
      );
      setNotice("계좌 인증 요청이 취소되었습니다.");
    } catch (cancelError) {
      setError(
        cancelError instanceof ApiError
          ? cancelError.message
          : "계좌 인증을 취소하는 중 오류가 발생했습니다."
      );
    } finally {
      setCancelling(false);
    }
  };

  return (
    <PageContainer>
      <section className="mb-8">
        <div className="mb-2 flex items-end justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-violet-700">
            Step 2 of 2
          </span>
          <span className="text-sm font-bold text-gray-500">계좌 인증</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-purple-100">
          <div className="h-full w-full rounded-full bg-gradient-to-r from-violet-700 to-fuchsia-500" />
        </div>
      </section>

      <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-violet-700 via-violet-600 to-fuchsia-500 p-6 text-white shadow-xl shadow-violet-500/20">
        <div className="absolute -right-14 -top-16 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-16 -left-10 h-28 w-28 rounded-full bg-fuchsia-300/20 blur-2xl" />

        <div className="relative flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-violet-100">
              Verify Account
            </p>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight">
              계좌 인증을 완료해 주세요
            </h1>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-violet-100">
              판매자 등록 마지막 단계입니다. 현재 인증 세션 상태와 남은 시간을
              확인한 뒤 mock 인증 코드를 제출하면 인증을 완료할 수 있습니다.
            </p>
          </div>

          <span
            className={[
              "inline-flex rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] ring-1",
              getStatusBadgeClass(apiStatus),
            ].join(" ")}
          >
            {getStatusText(apiStatus)}
          </span>
        </div>

        <div className="relative mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white/12 p-4 backdrop-blur">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-violet-100">
              Time Remaining
            </p>
            <p className="mt-2 text-2xl font-extrabold">{remainingTime}</p>
          </div>

          <div className="rounded-2xl bg-white/12 p-4 backdrop-blur">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-violet-100">
              Attempts
            </p>
            <p className="mt-2 text-2xl font-extrabold">
              {verification?.attemptCount ?? 0} / {MAX_ATTEMPTS}
            </p>
          </div>
        </div>
      </section>

      {error ? (
        <section className="mt-6 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {error}
        </section>
      ) : null}

      {notice ? (
        <section className="mt-6 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {notice}
        </section>
      ) : null}

      {!hasSession && !loadingCurrent ? (
        <section className="mt-6 rounded-[28px] bg-white p-6 shadow-sm ring-1 ring-purple-100">
          <h2 className="text-2xl font-extrabold tracking-tight text-gray-900">
            진행 중인 인증이 없습니다
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-gray-500">
            판매자 등록 화면에서 계좌 정보를 다시 입력하고 인증을 시작해 주세요.
          </p>
          <div className="mt-6">
            <Button className="w-full" size="lg" onClick={() => navigate("/seller/register")}>
              판매자 등록으로 돌아가기
            </Button>
          </div>
        </section>
      ) : (
        <>
          <section className="mt-6 rounded-[28px] bg-white p-6 shadow-sm ring-1 ring-purple-100">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-violet-700">
                  Registered Account
                </p>
                <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-gray-900">
                  {verification?.bankName || "등록 계좌"}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  {verification?.maskedAccountNumber || "계좌번호를 확인할 수 없습니다."}
                </p>
              </div>

              <div className="rounded-2xl bg-violet-100 px-4 py-3 text-right">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-700">
                  Resend
                </p>
                <p className="mt-1 text-xl font-extrabold text-violet-900">
                  {verification?.resendCount ?? 0}회
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 text-sm text-gray-500">
              <div className="rounded-2xl bg-gray-50 px-4 py-3">
                <span className="block text-[11px] font-bold uppercase tracking-[0.16em] text-gray-400">
                  Status
                </span>
                <span className="mt-1 block font-medium text-gray-700">
                  {getStatusText(apiStatus)}
                </span>
              </div>
              <div className="rounded-2xl bg-gray-50 px-4 py-3">
                <span className="block text-[11px] font-bold uppercase tracking-[0.16em] text-gray-400">
                  Expires At
                </span>
                <span className="mt-1 block font-medium text-gray-700">
                  {formatDateTime(verification?.expiresAt)}
                </span>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border-l-4 border-violet-500 bg-violet-50/80 px-4 py-4">
              <p className="text-sm leading-relaxed text-violet-900">
                개발용 모의 인증 화면입니다. 현재 세션의 상태, 남은 시간, 시도 횟수,
                재전송 횟수를 응답값 그대로 반영합니다. 자동 입력된 인증 코드를 그대로
                제출하면 계좌 인증이 완료됩니다.
              </p>
            </div>
          </section>

          <section className="mt-6 rounded-[28px] bg-white p-6 shadow-sm ring-1 ring-purple-100">
            <h2 className="text-2xl font-extrabold tracking-tight text-gray-900">
              Enter Verification Code
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-500">
              서버에서 내려준 mock 인증 코드를 자동으로 채워두었습니다.
            </p>

            <div className="mt-6 grid grid-cols-6 gap-2">
              {verificationDigits.map((digit, index) => (
                <div
                  key={`verification-digit-${index}`}
                  className="flex h-16 items-center justify-center rounded-2xl bg-violet-50 text-2xl font-black text-gray-900 shadow-inner ring-1 ring-violet-100"
                >
                  {digit.trim() || "-"}
                </div>
              ))}
            </div>

            <div className="mt-6">
              <FormField
                label="인증 코드"
                htmlFor="verificationCode"
                helpText="자동 입력된 코드를 확인한 뒤 인증 완료 버튼을 눌러 주세요."
              >
                <Input
                  id="verificationCode"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={code}
                  onChange={handleCodeChange}
                  placeholder="인증 코드 6자리"
                  className="text-center text-2xl font-black tracking-[0.45em]"
                  disabled={!hasSession || cancelling || loadingCurrent}
                />
              </FormField>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 text-sm text-gray-500">
              <div className="rounded-2xl bg-gray-50 px-4 py-3">
                <span className="block text-[11px] font-bold uppercase tracking-[0.16em] text-gray-400">
                  Session
                </span>
                <span className="mt-1 block truncate font-medium text-gray-700">
                  {verification?.sessionId || "-"}
                </span>
              </div>
              <div className="rounded-2xl bg-gray-50 px-4 py-3">
                <span className="block text-[11px] font-bold uppercase tracking-[0.16em] text-gray-400">
                  API Status
                </span>
                <span className="mt-1 block font-medium text-gray-700">
                  {verification?.status || "-"}
                </span>
              </div>
            </div>

            <div className="mt-8">
              <Button
                size="lg"
                className={[
                  "w-full",
                  isVerificationLocked ? disabledButtonClassName : "",
                ].join(" ")}
                onClick={handleConfirm}
                disabled={isVerificationLocked}
              >
                {submitting
                  ? "인증 중..."
                  : isVerified
                    ? "판매자 센터로 이동하기"
                    : "계좌 인증 완료하기"}
              </Button>
            </div>

            <div className="mt-5 flex flex-col items-center gap-4 sm:flex-row">
              <Button
                variant="secondary"
                className={[
                  "w-full sm:flex-1",
                  isSecondaryActionDisabled ? disabledButtonClassName : "",
                ].join(" ")}
                onClick={handleResend}
                disabled={isSecondaryActionDisabled}
              >
                {resending ? "재전송 중..." : "인증 코드 재전송"}
              </Button>

              <Button
                variant="ghost"
                className={[
                  "w-full sm:flex-1",
                  isSecondaryActionDisabled ? disabledButtonClassName : "",
                ].join(" ")}
                onClick={handleCancel}
                disabled={isSecondaryActionDisabled}
              >
                {cancelling ? "취소 중..." : "인증 요청 취소"}
              </Button>
            </div>
          </section>
        </>
      )}
    </PageContainer>
  );
}
