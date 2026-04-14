import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Button from "../../components/common/Button";
import { ApiError } from "../../api/client";
import { sendEmailVerificationApi } from "../../features/auth/authApi";

export default function SignupPendingVerificationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = useMemo(() => searchParams.get("email")?.trim() || "", [searchParams]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleResend = async () => {
    if (!email) {
      setError("이메일 정보가 없습니다. 다시 회원가입을 진행해 주세요.");
      return;
    }

    try {
      setIsSending(true);
      setError("");
      setMessage("");
      await sendEmailVerificationApi({ email });
      setMessage("인증 메일을 다시 보냈습니다. 메일함을 확인해 주세요.");
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === "EMAIL_VERIFICATION_NOT_ALLOWED") {
          setError("현재 상태에서는 인증 메일을 다시 보낼 수 없습니다. 이미 인증이 완료되었는지 확인해 주세요.");
        } else {
          setError(err.message || "인증 메일 재발송에 실패했습니다.");
        }
      } else {
        setError("인증 메일 재발송에 실패했습니다. 잠시 후 다시 시도해 주세요.");
      }
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fdf3ff] px-6 py-16 text-[#38274c]">
      <div className="mx-auto flex min-h-[80vh] max-w-3xl items-center justify-center">
        <section className="w-full rounded-[2rem] bg-white p-8 shadow-xl shadow-violet-200/40 md:p-12">
          <div className="mx-auto max-w-xl text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-violet-100 text-4xl text-violet-700">
              @
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
              이메일 인증이 필요합니다
            </h1>
            <p className="mt-4 text-base font-medium leading-7 text-gray-600">
              회원가입은 완료되었지만 아직 계정이 활성화되지 않았습니다.
              <br />
              메일함에서 인증 링크를 확인한 뒤 로그인해 주세요.
            </p>

            <div className="mt-8 rounded-3xl bg-violet-50 px-6 py-5 text-left">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-700">
                Verification Email
              </p>
              <p className="mt-2 break-all text-lg font-semibold text-violet-900">
                {email || "이메일 정보 없음"}
              </p>
            </div>

            {message ? (
              <div className="mt-6 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                {message}
              </div>
            ) : null}

            {error ? (
              <div className="mt-6 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                {error}
              </div>
            ) : null}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button type="button" size="lg" onClick={handleResend} disabled={isSending || !email}>
                {isSending ? "재발송 중..." : "인증 메일 다시 보내기"}
              </Button>
              <Button type="button" size="lg" variant="secondary" onClick={() => navigate("/login")}>
                로그인 페이지로 이동
              </Button>
            </div>

            <p className="mt-8 text-sm font-medium text-gray-500">
              이메일 주소를 잘못 입력했다면
              <Link to="/signup" className="ml-1 font-bold text-violet-700 hover:underline">
                다시 회원가입
              </Link>
              해 주세요.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
