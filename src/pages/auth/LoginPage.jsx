import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { ApiError } from "../../api/client";
import Button from "../../components/common/Button";
import FormField from "../../components/common/FormField";
import Input from "../../components/common/Input";
import {
  fetchKakaoAuthorizeUrlApi,
  linkKakaoAccountApi,
  sendEmailVerificationApi,
} from "../../features/auth/authApi";
import {
  clearPendingKakaoLink,
  getPendingKakaoLink,
} from "../../features/auth/kakaoLinkStorage";
import { useAuth } from "../../features/auth/useAuth";

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const pendingKakaoLink = useMemo(() => getPendingKakaoLink(), []);
  const initialEmail = searchParams.get("email") || pendingKakaoLink?.email || "";
  const redirectTarget = searchParams.get("redirect");
  const safeRedirectTarget =
    typeof redirectTarget === "string" && redirectTarget.startsWith("/")
      ? redirectTarget
      : "/";

  const [form, setForm] = useState({
    email: initialEmail,
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [verificationPending, setVerificationPending] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState("");

  const handleChange = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
    setErrors((prev) => ({ ...prev, [key]: "", common: "" }));
    setVerificationPending(false);
    setVerificationMessage("");
  };

  const validate = () => {
    const nextErrors = {};

    if (!form.email.trim()) {
      nextErrors.email = "이메일을 입력해 주세요.";
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      nextErrors.email = "올바른 이메일 주소를 입력해 주세요.";
    }

    if (!form.password) {
      nextErrors.password = "비밀번호를 입력해 주세요.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleResendVerification = async () => {
    const email = form.email.trim();
    if (!email) {
      setErrors((prev) => ({ ...prev, email: "이메일을 입력해 주세요." }));
      return;
    }

    try {
      setIsResending(true);
      setVerificationMessage("");
      await sendEmailVerificationApi({ email });
      navigate(`/signup/pending-verification?email=${encodeURIComponent(email)}`);
    } catch (error) {
      if (error instanceof ApiError) {
        setVerificationMessage(
          error.code === "EMAIL_VERIFICATION_NOT_ALLOWED"
            ? "지금은 인증 이메일을 다시 보낼 수 없어요."
            : error.message || "인증 이메일 재발송에 실패했어요."
        );
      } else {
        setVerificationMessage("인증 이메일 재발송에 실패했어요. 잠시 후 다시 시도해 주세요.");
      }
    } finally {
      setIsResending(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setIsSubmitting(true);
      setVerificationPending(false);
      setVerificationMessage("");
      await login(form);

      if (pendingKakaoLink?.linkToken) {
        await linkKakaoAccountApi({ linkToken: pendingKakaoLink.linkToken });
        clearPendingKakaoLink();
      }

      navigate(safeRedirectTarget);
    } catch (error) {
      const isVerificationRequired =
        error instanceof ApiError && error.code === "EMAIL_VERIFICATION_REQUIRED";

      if (isVerificationRequired) {
        setVerificationPending(true);
        setErrors({
          common: "로그인하려면 이메일 인증이 필요해요.",
        });
        return;
      }

      if (pendingKakaoLink?.linkToken) {
        setErrors({
          common:
            error?.message ||
            "로그인은 성공했지만 카카오 계정 연동에 실패했어요. 다시 시도해 주세요.",
        });
        return;
      }

      setErrors({
        common:
          error?.message || "로그인에 실패했어요. 이메일과 비밀번호를 확인해 주세요.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitDisabled = isSubmitting;

  return (
    <div className="min-h-screen bg-blue-50 text-gray-900">
      <header className="fixed top-0 z-50 w-full bg-white/70 backdrop-blur-xl shadow-sm">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center px-6">
          <button
            type="button"
            aria-label="이전 페이지로 이동"
            onClick={() => navigate(-1)}
            className="rounded-full p-2 text-blue-700 transition hover:bg-blue-100 active:scale-95"
          >
            {"<"}
          </button>

          <div className="flex-1 text-center">
            <h1 className="text-xl font-bold tracking-tight">로그인</h1>
          </div>

          <div className="w-10" />
        </div>
      </header>

      <main className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-6 pb-12 pt-24">
          <div className="mb-12 text-center">
            <div className="mb-4 inline-flex bg-gray-100 p-4">
              <span className="text-4xl text-blue-700">G</span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight">GoodsMall</h2>
            <p className="mt-2 font-medium text-gray-500">
              오늘의 점심 메뉴를 가장 빠르게 만나보세요.
            </p>
          </div>

        <div className="w-full">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {pendingKakaoLink?.linkToken ? (
              <div className="border border-yellow-200 bg-[#fff9d9] px-4 py-4 text-left text-sm text-[#5b4300]">
                <p className="font-semibold">이 계정에 카카오 연동 대기 상태가 있어요.</p>
                <p className="mt-1">
                  기존 계정으로 로그인하면 카카오 연동을 자동으로 완료할게요.
                </p>
              </div>
            ) : null}

            <div className="space-y-4">
              <FormField label="이메일 주소" htmlFor="email" error={errors.email}>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@domain.com"
                  value={form.email}
                  onChange={handleChange("email")}
                  error={!!errors.email}
                />
              </FormField>

              <FormField label="비밀번호" htmlFor="password" error={errors.password}>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="비밀번호를 입력해 주세요"
                    value={form.password}
                    onChange={handleChange("password")}
                    error={!!errors.password}
                    className="pr-14"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-blue-700"
                  >
                    {showPassword ? "숨기기" : "보기"}
                  </button>
                </div>

                <div className="flex justify-end pt-1">
                  <Link
                    to="/forgot-password"
                    className="text-xs font-semibold text-blue-700 transition hover:text-blue-700"
                  >
                    비밀번호를 잊으셨나요?
                  </Link>
                </div>
              </FormField>
            </div>

            {errors.common ? (
              <div className="bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                {errors.common}
              </div>
            ) : null}

            {verificationPending ? (
              <div className="bg-blue-50 px-4 py-4 text-sm text-blue-900">
                <p className="font-semibold">이메일 인증이 필요해요.</p>
                <p className="mt-1 text-blue-700">
                  인증 이메일이 필요하면 아래 버튼을 눌러 다시 받을 수 있어요.
                </p>
                {verificationMessage ? (
                  <p className="mt-2 font-medium text-red-600">{verificationMessage}</p>
                ) : null}
                <div className="mt-3">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleResendVerification}
                    disabled={isResending}
                    className="w-full"
                  >
                    {isResending ? "재발송 중..." : "인증 이메일 다시 보내기"}
                  </Button>
                </div>
              </div>
            ) : null}

            <Button type="submit" size="lg" className="w-full" disabled={submitDisabled}>
              {submitDisabled ? "로그인 중..." : "로그인"}
            </Button>
          </form>

          <div className="my-8 flex items-center gap-4">
            <div className="h-px flex-1 bg-gray-100" />
            <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
              또는 간편 로그인
            </span>
            <div className="h-px flex-1 bg-gray-100" />
          </div>

          <Button
            type="button"
            size="lg"
            className="w-full gap-3 border border-[#ead000] bg-[#FEE500] text-[#191919] shadow-[0_6px_18px_rgba(0,0,0,0.08)] hover:bg-[#FADA00] hover:brightness-100"
            onClick={async () => {
              try {
                setErrors((prev) => ({ ...prev, common: "" }));

                const result = await fetchKakaoAuthorizeUrlApi();
                if (!result?.authorizeUrl) {
                  throw new Error("카카오 로그인 URL을 불러오지 못했습니다.");
                }

                window.location.href = result.authorizeUrl;
              } catch (error) {
                setErrors((prev) => ({
                  ...prev,
                  common:
                    error instanceof ApiError
                      ? error.message
                      : error?.message || "카카오 로그인을 시작하지 못했습니다.",
                }));
              }
            }}
          >
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#191919]/10">
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="h-4.5 w-4.5"
                fill="none"
              >
                <path
                  d="M12 4C7.02 4 3 7.29 3 11.35c0 2.56 1.67 4.84 4.2 6.03l-.72 2.71c-.06.22.18.39.38.27l3.07-1.99c.67.11 1.36.17 2.07.17 4.98 0 9-3.29 9-7.35S16.98 4 12 4Z"
                  fill="currentColor"
                />
              </svg>
            </span>
            <span>카카오로 시작하기</span>
          </Button>

          <div className="mt-12 text-center">
            <p className="text-sm font-medium text-gray-500">
              아직 계정이 없으신가요?
              <Link to="/signup" className="ml-1 font-bold text-blue-700 hover:underline">
                회원가입
              </Link>
            </p>
          </div>
        </div>
      </main>

      <div className="pointer-events-none fixed right-[-5%] top-[-10%] -z-10 h-96 w-96 rounded-full bg-blue-200/30 blur-[100px]" />
      <div className="pointer-events-none fixed bottom-[-10%] left-[-5%] -z-10 h-96 w-96 rounded-full bg-blue-200/20 blur-[100px]" />
    </div>
  );
}
