import { useState } from "react";
import { Link } from "react-router-dom";

import { ApiError } from "../../api/client";
import Button from "../../components/common/Button";
import FormField from "../../components/common/FormField";
import Input from "../../components/common/Input";
import PageContainer from "../../components/common/PageContainer";
import { requestPasswordResetApi } from "../../features/auth/authApi";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const nextErrors = {};

    if (!email.trim()) {
      nextErrors.email = "이메일을 입력해 주세요.";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      nextErrors.email = "올바른 이메일 주소를 입력해 주세요.";
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
      const result = await requestPasswordResetApi({ email: email.trim() });
      setSubmitted(true);
      setMessage(
        result?.message || "입력한 이메일로 비밀번호 재설정 안내를 발송했습니다."
      );
    } catch (error) {
      setErrors({
        common:
          error instanceof ApiError
            ? error.message || "비밀번호 재설정 메일 발송에 실패했습니다."
            : "비밀번호 재설정 메일 발송에 실패했습니다. 잠시 후 다시 시도해 주세요.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageContainer>
      <div className="mx-auto max-w-md">
        <div className="mb-6 rounded-2xl border border-violet-200 bg-violet-50/80 px-4 py-4 text-sm font-medium leading-7 text-violet-700">
          가입한 이메일 주소를 입력하면 비밀번호 재설정 링크를 보내드립니다.
        </div>

        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-500">
            Password Reset
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900">
            비밀번호 찾기
          </h1>
          <p className="mt-2 text-sm leading-7 text-gray-500">
            메일에 포함된 링크에서 새 비밀번호를 8자 이상으로 다시 설정할 수 있습니다.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-[32px] bg-white p-6 text-left shadow-[0_10px_40px_-10px_rgba(56,39,76,0.04)] ring-1 ring-violet-100"
        >
          <FormField
            label="이메일 주소"
            htmlFor="email"
            required
            error={errors.email}
          >
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="가입한 이메일 주소"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setErrors((prev) => ({ ...prev, email: "", common: "" }));
              }}
              error={!!errors.email}
            />
          </FormField>

          {errors.common ? (
            <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
              {errors.common}
            </div>
          ) : null}

          {submitted ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm leading-6 text-emerald-700">
              <p className="font-semibold">메일 발송이 접수되었습니다.</p>
              <p className="mt-1">{message}</p>
            </div>
          ) : null}

          <div className="space-y-3 pt-2">
            <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "발송 중..." : "재설정 메일 보내기"}
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
