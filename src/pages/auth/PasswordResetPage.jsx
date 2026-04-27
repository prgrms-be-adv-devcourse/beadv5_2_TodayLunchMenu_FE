import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { ApiError } from "../../api/client";
import Button from "../../components/common/Button";
import FormField from "../../components/common/FormField";
import Input from "../../components/common/Input";
import PageContainer from "../../components/common/PageContainer";
import { confirmPasswordResetApi } from "../../features/auth/authApi";
import { pushToast } from "../../features/notification/notificationToastStore";

export default function PasswordResetPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);
  const [form, setForm] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validate = () => {
    const nextErrors = {};

    if (!token) {
      nextErrors.common = "유효한 비밀번호 재설정 링크가 아닙니다.";
    }

    if (!form.newPassword) {
      nextErrors.newPassword = "새 비밀번호를 입력해 주세요.";
    } else if (form.newPassword.length < 8) {
      nextErrors.newPassword = "새 비밀번호는 8자 이상이어야 합니다.";
    }

    if (!form.confirmPassword) {
      nextErrors.confirmPassword = "새 비밀번호 확인을 입력해 주세요.";
    } else if (form.newPassword !== form.confirmPassword) {
      nextErrors.confirmPassword = "새 비밀번호가 일치하지 않습니다.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) {
      return;
    }

    try {
      setIsSubmitting(true);
      setErrors({});

      await confirmPasswordResetApi({
        token,
        newPassword: form.newPassword,
      });

      pushToast({
        title: "비밀번호 재설정 완료",
        message: "새 비밀번호로 다시 로그인해 주세요.",
        tone: "success",
        timeoutMs: 2500,
      });
      navigate("/login");
    } catch (error) {
      setErrors({
        common:
          error instanceof ApiError
            ? error.message || "비밀번호 재설정에 실패했습니다."
            : "비밀번호 재설정에 실패했습니다. 잠시 후 다시 시도해 주세요.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageContainer>
      <div className="mx-auto max-w-md">
        <div className="mb-6 border border-blue-200 bg-blue-50/80 px-4 py-4 text-sm font-medium leading-7 text-blue-700">
          메일에서 받은 링크를 통해 새 비밀번호를 설정하는 단계입니다.
        </div>

        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-500">
            Set New Password
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900">
            새 비밀번호 설정
          </h1>
          <p className="mt-2 text-sm leading-7 text-gray-500">
            새 비밀번호는 8자 이상으로 입력해 주세요.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 bg-white p-6 text-left shadow-[0_10px_40px_-10px_rgba(56,39,76,0.04)] ring-1 ring-gray-200"
        >
          <FormField
            label="새 비밀번호"
            htmlFor="newPassword"
            required
            error={errors.newPassword}
            helpText="8자 이상으로 입력해 주세요."
          >
            <div className="relative">
              <Input
                id="newPassword"
                type={showNewPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="새 비밀번호 입력"
                value={form.newPassword}
                onChange={(event) => {
                  setForm((prev) => ({ ...prev, newPassword: event.target.value }));
                  setErrors((prev) => ({
                    ...prev,
                    newPassword: "",
                    confirmPassword: "",
                    common: "",
                  }));
                }}
                error={!!errors.newPassword}
                className="pr-16"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword((prev) => !prev)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400 transition hover:text-blue-700"
              >
                {showNewPassword ? "숨기기" : "보기"}
              </button>
            </div>
          </FormField>

          <FormField
            label="새 비밀번호 확인"
            htmlFor="confirmPassword"
            required
            error={errors.confirmPassword}
          >
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="새 비밀번호 다시 입력"
                value={form.confirmPassword}
                onChange={(event) => {
                  setForm((prev) => ({ ...prev, confirmPassword: event.target.value }));
                  setErrors((prev) => ({ ...prev, confirmPassword: "", common: "" }));
                }}
                error={!!errors.confirmPassword}
                className="pr-16"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400 transition hover:text-blue-700"
              >
                {showConfirmPassword ? "숨기기" : "보기"}
              </button>
            </div>
          </FormField>

          {errors.common ? (
            <div className="bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
              {errors.common}
            </div>
          ) : null}

          <div className="space-y-3 pt-2">
            <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "재설정 중..." : "비밀번호 재설정"}
            </Button>
            <Link to="/login" className="block">
              <Button type="button" variant="ghost" size="lg" className="w-full">
                로그인으로 돌아가기
              </Button>
            </Link>
          </div>
        </form>
      </div>
    </PageContainer>
  );
}
