import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Button from "../../components/common/Button";
import { ApiError } from "../../api/client";
import { confirmEmailVerificationApi } from "../../features/auth/authApi";

function resolveErrorState(error) {
  if (!(error instanceof ApiError)) {
    return {
      status: "error",
      message: "이메일 인증에 실패했습니다. 잠시 후 다시 시도해 주세요.",
      ctaTarget: "/signup/pending-verification",
      ctaLabel: "인증 대기 화면으로 이동",
    };
  }

  if (error.code === "EMAIL_VERIFICATION_TOKEN_EXPIRED") {
    return {
      status: "expired",
      message: "인증 링크가 만료되었습니다. 인증 메일을 다시 받아 진행해 주세요.",
      ctaTarget: "/signup/pending-verification",
      ctaLabel: "인증 메일 다시 받기",
    };
  }

  if (error.code === "EMAIL_VERIFICATION_TOKEN_INVALID") {
    return {
      status: "invalid",
      message: "유효하지 않은 인증 링크입니다. 메일의 최신 링크를 다시 확인해 주세요.",
      ctaTarget: "/signup/pending-verification",
      ctaLabel: "인증 대기 화면으로 이동",
    };
  }

  if (error.code === "EMAIL_VERIFICATION_NOT_ALLOWED") {
    return {
      status: "not-allowed",
      message: "현재 상태에서는 이메일 인증을 완료할 수 없습니다. 로그인 또는 재가입을 진행해 주세요.",
      ctaTarget: "/login",
      ctaLabel: "로그인 페이지로 이동",
    };
  }

  return {
    status: "error",
    message: error.message || "이메일 인증에 실패했습니다.",
    ctaTarget: "/signup/pending-verification",
    ctaLabel: "인증 대기 화면으로 이동",
  };
}

export default function EmailVerificationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token")?.trim() || "";
  const email = searchParams.get("email")?.trim() || "";
  const pendingVerificationTarget = useMemo(() => {
    if (!email) {
      return "/signup/pending-verification";
    }
    return `/signup/pending-verification?email=${encodeURIComponent(email)}`;
  }, [email]);

  const [status, setStatus] = useState(token ? "loading" : "invalid");
  const [message, setMessage] = useState(
    token ? "이메일 인증을 확인하고 있습니다." : "인증 토큰이 없습니다."
  );
  const [secondaryTarget, setSecondaryTarget] = useState(pendingVerificationTarget);
  const [secondaryLabel, setSecondaryLabel] = useState("인증 대기 화면으로 이동");

  useEffect(() => {
    let cancelled = false;

    async function confirm() {
      if (!token) {
        setSecondaryTarget(pendingVerificationTarget);
        setSecondaryLabel("인증 대기 화면으로 이동");
        return;
      }

      try {
        await confirmEmailVerificationApi({ token });
        if (cancelled) return;
        setStatus("success");
        setMessage("이메일 인증이 완료되었습니다. 이제 로그인할 수 있습니다.");
        setSecondaryTarget(pendingVerificationTarget);
        setSecondaryLabel("인증 대기 화면으로 이동");
      } catch (err) {
        if (cancelled) return;
        const resolved = resolveErrorState(err);
        setStatus(resolved.status);
        setMessage(resolved.message);
        setSecondaryTarget(
          resolved.ctaTarget === "/signup/pending-verification"
            ? pendingVerificationTarget
            : resolved.ctaTarget
        );
        setSecondaryLabel(resolved.ctaLabel);
      }
    }

    confirm();
    return () => {
      cancelled = true;
    };
  }, [pendingVerificationTarget, token]);

  return (
    <div className="min-h-screen bg-blue-50 px-6 py-16 text-gray-900">
      <div className="mx-auto flex min-h-[80vh] max-w-3xl items-center justify-center">
        <section className="w-full bg-white p-8 shadow-xl md:p-12">
          <div className="mx-auto max-w-xl text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 text-4xl text-blue-700">
              {status === "success" ? "✓" : status === "loading" ? "…" : "!"}
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
              {status === "success"
                ? "이메일 인증 완료"
                : status === "loading"
                  ? "이메일 인증 확인 중"
                  : status === "expired"
                    ? "인증 링크 만료"
                    : status === "invalid"
                      ? "유효하지 않은 인증 링크"
                      : "이메일 인증 실패"}
            </h1>
            <p className="mt-4 text-base font-medium leading-7 text-gray-600">{message}</p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button type="button" size="lg" onClick={() => navigate("/login")}>
                로그인 페이지로 이동
              </Button>
              <Button type="button" size="lg" variant="secondary" onClick={() => navigate(secondaryTarget)}>
                {secondaryLabel}
              </Button>
            </div>

            <p className="mt-8 text-sm font-medium text-gray-500">
              문제가 계속되면
              <Link to="/signup" className="ml-1 font-bold text-blue-700 hover:underline">
                다시 회원가입
              </Link>
              을 시도해 주세요.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
