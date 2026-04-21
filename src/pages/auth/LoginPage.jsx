import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { ApiError } from "../../api/client";
import Button from "../../components/common/Button";
import FormField from "../../components/common/FormField";
import Input from "../../components/common/Input";
import {
  getKakaoAuthorizeUrl,
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
  const { login, loading } = useAuth();
  const pendingKakaoLink = useMemo(() => getPendingKakaoLink(), []);
  const initialEmail = searchParams.get("email") || pendingKakaoLink?.email || "";

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
      nextErrors.email = "Please enter your email.";
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      nextErrors.email = "Please enter a valid email address.";
    }

    if (!form.password) {
      nextErrors.password = "Please enter your password.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleResendVerification = async () => {
    const email = form.email.trim();
    if (!email) {
      setErrors((prev) => ({ ...prev, email: "Please enter your email." }));
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
            ? "Verification email cannot be resent right now."
            : error.message || "Failed to resend verification email."
        );
      } else {
        setVerificationMessage("Failed to resend verification email. Please try again later.");
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

      navigate("/products");
    } catch (error) {
      const isVerificationRequired =
        error instanceof ApiError && error.code === "EMAIL_VERIFICATION_REQUIRED";

      if (isVerificationRequired) {
        setVerificationPending(true);
        setErrors({
          common: "Email verification is required before sign-in.",
        });
        return;
      }

      if (pendingKakaoLink?.linkToken) {
        setErrors({
          common:
            error?.message ||
            "Sign-in succeeded, but Kakao account linking failed. Please try again.",
        });
        return;
      }

      setErrors({
        common:
          error?.message || "Sign-in failed. Please check your email and password.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitDisabled = isSubmitting || loading;

  return (
    <div className="min-h-screen bg-[#fdf3ff] text-[#38274c]">
      <header className="fixed top-0 z-50 w-full bg-white/70 backdrop-blur-xl shadow-sm">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center px-6">
          <button
            type="button"
            aria-label="Go back"
            onClick={() => navigate(-1)}
            className="rounded-full p-2 text-violet-700 transition hover:bg-violet-100 active:scale-95"
          >
            {"<"}
          </button>

          <div className="flex-1 text-center">
            <h1 className="text-xl font-bold tracking-tight">Login</h1>
          </div>

          <div className="w-10" />
        </div>
      </header>

      <main className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-6 pb-12 pt-24">
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex rounded-xl bg-purple-100 p-4">
            <span className="text-4xl text-violet-700">Z</span>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight">ZeroMarket</h2>
          <p className="mt-2 font-medium text-gray-500">
            The fastest way to meet today&apos;s lunch menu.
          </p>
        </div>

        <div className="w-full">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {pendingKakaoLink?.linkToken ? (
              <div className="rounded-2xl border border-yellow-200 bg-[#fff9d9] px-4 py-4 text-left text-sm text-[#5b4300]">
                <p className="font-semibold">A Kakao link is waiting for this account.</p>
                <p className="mt-1">
                  Sign in with your existing account and we&apos;ll complete the Kakao link
                  automatically.
                </p>
              </div>
            ) : null}

            <div className="space-y-4">
              <FormField label="Email Address" htmlFor="email" error={errors.email}>
                <Input
                  id="email"
                  type="email"
                  placeholder="collector@example.com"
                  value={form.email}
                  onChange={handleChange("email")}
                  error={!!errors.email}
                />
              </FormField>

              <FormField label="Password" htmlFor="password" error={errors.password}>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={handleChange("password")}
                    error={!!errors.password}
                    className="pr-14"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-violet-700"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>

                <div className="flex justify-end pt-1">
                  <Link
                    to="/forgot-password"
                    className="text-xs font-semibold text-violet-700 transition hover:text-violet-800"
                  >
                    Forgot password?
                  </Link>
                </div>
              </FormField>
            </div>

            {errors.common ? (
              <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                {errors.common}
              </div>
            ) : null}

            {verificationPending ? (
              <div className="rounded-2xl bg-violet-50 px-4 py-4 text-sm text-violet-900">
                <p className="font-semibold">Email verification is required.</p>
                <p className="mt-1 text-violet-700">
                  Use the button below if you need a new verification email.
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
                    {isResending ? "Resending..." : "Resend verification email"}
                  </Button>
                </div>
              </div>
            ) : null}

            <Button type="submit" size="lg" className="w-full" disabled={submitDisabled}>
              {submitDisabled ? "Signing in..." : "Login"}
            </Button>
          </form>

          <div className="my-8 flex items-center gap-4">
            <div className="h-px flex-1 bg-purple-100" />
            <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
              Or continue with
            </span>
            <div className="h-px flex-1 bg-purple-100" />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <button
              type="button"
              className="flex items-center justify-center rounded-xl border border-purple-100 bg-white p-4 transition hover:bg-purple-50"
            >
              G
            </button>
            <button
              type="button"
              className="flex items-center justify-center rounded-xl border border-purple-100 bg-white p-4 transition hover:bg-purple-50"
            >
              N
            </button>
            <button
              type="button"
              onClick={() => {
                window.location.href = getKakaoAuthorizeUrl();
              }}
              className="flex items-center justify-center rounded-xl border border-purple-100 bg-white p-4 font-semibold transition hover:bg-purple-50"
            >
              K
            </button>
          </div>

          <div className="mt-12 text-center">
            <p className="text-sm font-medium text-gray-500">
              Don&apos;t have an account?
              <Link to="/signup" className="ml-1 font-bold text-violet-700 hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </main>

      <div className="pointer-events-none fixed right-[-5%] top-[-10%] -z-10 h-96 w-96 rounded-full bg-violet-200/30 blur-[100px]" />
      <div className="pointer-events-none fixed bottom-[-10%] left-[-5%] -z-10 h-96 w-96 rounded-full bg-fuchsia-200/20 blur-[100px]" />
    </div>
  );
}
