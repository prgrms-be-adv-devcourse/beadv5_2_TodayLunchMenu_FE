import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../../components/common/Button";
import FormField from "../../components/common/FormField";
import Input from "../../components/common/Input";
import { useAuth } from "../../features/auth/useAuth";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, loading } = useAuth();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
    setErrors((prev) => ({ ...prev, [key]: "", common: "" }));
  };

  const validate = () => {
    const nextErrors = {};

    if (!form.email.trim()) {
      nextErrors.email = "이메일을 입력해 주세요.";
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      nextErrors.email = "올바른 이메일 형식이 아닙니다.";
    }

    if (!form.password) {
      nextErrors.password = "비밀번호를 입력해 주세요.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setIsSubmitting(true);
      await login(form);
      navigate("/products");
    } catch (error) {
      console.error(error);
      setErrors({
        common:
          error?.message ||
          "로그인에 실패했습니다. 이메일과 비밀번호를 확인해 주세요.",
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
            aria-label="뒤로가기"
            onClick={() => navigate(-1)}
            className="rounded-full p-2 text-violet-700 transition hover:bg-violet-100 active:scale-95"
          >
            ←
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
            오늘 점심 메뉴를 가장 빠르게 만나는 방법
          </p>
        </div>

        <div className="w-full">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <FormField
                label="Email Address"
                htmlFor="email"
                error={errors.email}
              >
                <Input
                  id="email"
                  type="email"
                  placeholder="collector@example.com"
                  value={form.email}
                  onChange={handleChange("email")}
                  error={!!errors.email}
                />
              </FormField>

              <FormField
                label="Password"
                htmlFor="password"
                error={errors.password}
              >
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
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-violet-700"
                  >
                    {showPassword ? "숨김" : "보기"}
                  </button>
                </div>

                <div className="flex justify-end pt-1">
                  <Link
                    to="/forgot-password"
                    className="text-xs font-semibold text-violet-700 transition hover:text-violet-800"
                  >
                    비밀번호를 잊으셨나요?
                  </Link>
                </div>
              </FormField>
            </div>

            {errors.common ? (
              <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                {errors.common}
              </div>
            ) : null}

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={submitDisabled}
            >
              {submitDisabled ? "로그인 중..." : "로그인"}
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
              className="flex items-center justify-center rounded-xl border border-purple-100 bg-white p-4 transition hover:bg-purple-50"
            >
              K
            </button>
          </div>

          <div className="mt-12 text-center">
            <p className="text-sm font-medium text-gray-500">
              아직 계정이 없나요?
              <Link
                to="/signup"
                className="ml-1 font-bold text-violet-700 hover:underline"
              >
                회원가입
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
