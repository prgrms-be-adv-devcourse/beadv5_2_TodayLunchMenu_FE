import { useEffect, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import Button from "../../components/common/Button";
import {
  clearPendingKakaoLink,
  getPendingKakaoLink,
  setPendingKakaoLink,
} from "../../features/auth/kakaoLinkStorage";

function DecorativeFoodIcon({ label }) {
  return (
    <div className="flex h-12 w-12 items-center justify-center border border-blue-200/70 bg-white/70 text-lg font-black text-blue-400 shadow-sm">
      {label}
    </div>
  );
}

export default function KakaoLinkRequiredPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const storedPendingLink = getPendingKakaoLink();

  const pendingLink = useMemo(
    () => ({
      linkToken: searchParams.get("linkToken") || storedPendingLink?.linkToken || "",
      provider: searchParams.get("provider") || "KAKAO",
      email: searchParams.get("email") || storedPendingLink?.email || "",
      nickname: searchParams.get("nickname") || storedPendingLink?.nickname || "",
      providerUserId: searchParams.get("providerUserId") || storedPendingLink?.providerUserId || "",
    }),
    [searchParams, storedPendingLink]
  );

  useEffect(() => {
    if (pendingLink.linkToken) {
      setPendingKakaoLink(pendingLink);
    }
  }, [pendingLink]);

  const loginTarget = pendingLink.email
    ? `/login?email=${encodeURIComponent(pendingLink.email)}`
    : "/login";
  const signupTarget = pendingLink.email
    ? `/signup?email=${encodeURIComponent(pendingLink.email)}`
    : "/signup";

  return (
    <div className="min-h-screen overflow-hidden bg-blue-50 text-gray-900">
      <header className="fixed top-0 z-50 w-full bg-white/75 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-md items-center justify-between px-6">
          <button
            type="button"
            aria-label="뒤로 가기"
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-xl font-semibold text-blue-700 transition hover:bg-blue-100 active:scale-95"
          >
            {"<"}
          </button>

          <h1 className="text-xl font-black tracking-tight">GoodsMall</h1>

          <Link
            to="/login"
            className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
          >
            홈
          </Link>
        </div>
        <div className="h-px w-full bg-blue-200" />
      </header>

      <main className="mx-auto flex min-h-screen w-full max-w-md flex-col px-6 pb-12 pt-24">
        <section className="relative mb-10 flex justify-center pt-4">
          <div className="relative h-64 w-64">
            <div className="absolute left-4 top-4 h-56 w-56 rotate-6 bg-blue-200/70" />
            <div className="absolute left-0 top-0 h-56 w-56 -rotate-3 bg-blue-500/10" />

            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative flex h-48 w-48 flex-col items-center justify-center bg-white p-8 text-center shadow-[0_24px_70px_rgba(37,99,235,0.18)]">
                <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[#FEE500] text-3xl font-black text-[#3C1E1E] shadow-sm">
                  K
                </div>

                <div className="flex items-center gap-3 text-blue-700">
                  <span className="text-xl font-black">Kakao</span>
                  <span className="h-1.5 w-10 rounded-full bg-blue-200" />
                  <span className="text-xl font-black text-slate-700">Me</span>
                </div>
              </div>

              <div className="absolute -bottom-4 -right-2 flex h-24 w-24 items-center justify-center rounded-full bg-rose-200/40 text-3xl text-rose-700 shadow-[0_20px_40px_rgba(244,114,182,0.15)] backdrop-blur">
                +
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="space-y-3">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-600">
              카카오 계정 연동
            </p>
            <h2 className="text-3xl font-black leading-tight tracking-tight">
              카카오 계정 연동이
              <br />
              필요해요
            </h2>
            <p className="text-sm font-medium leading-7 text-gray-500">
              카카오 인증은 완료되었지만 아직 카카오 계정이 GoodsMall 회원 계정과 연결되어 있지
              않아요.
            </p>
          </div>

          {pendingLink.nickname ? (
            <div className="border border-blue-200/80 bg-white/70 p-4 shadow-sm backdrop-blur">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-blue-600">
                카카오 계정
              </p>
              <p className="mt-2 text-xs font-medium text-gray-500">
                카카오 닉네임: {pendingLink.nickname}
              </p>
            </div>
          ) : null}
        </section>

        <section className="mt-10 space-y-4">
          <Button
            size="lg"
            className="w-full gap-2 bg-blue-700"
            onClick={() => navigate(loginTarget)}
          >
            기존 계정과 연결하기
            <span aria-hidden="true">-&gt;</span>
          </Button>

          <button
            type="button"
            onClick={() => navigate(signupTarget)}
            className="flex h-14 w-full items-center justify-center rounded-full bg-blue-100 px-6 text-base font-bold text-blue-900 transition hover:bg-blue-200 active:scale-[0.98]"
          >
            회원가입 후 연결하기
          </button>

          <button
            type="button"
            onClick={() => {
              clearPendingKakaoLink();
              navigate("/login");
            }}
            className="w-full py-3 text-sm font-semibold text-gray-500 transition hover:text-blue-700"
          >
            취소
          </button>
        </section>

        <footer className="mt-auto pt-12 text-center">
          <div className="bg-white/65 p-4 text-left shadow-sm backdrop-blur">
            <p className="text-xs font-medium leading-6 text-gray-500">
              한 번 연결해두면 다음부터는 카카오로 바로 로그인할 수 있어요.
            </p>
          </div>

          <div className="mt-10 flex justify-center gap-4 opacity-60">
            <DecorativeFoodIcon label="B" />
            <DecorativeFoodIcon label="S" />
            <DecorativeFoodIcon label="C" />
          </div>
        </footer>
      </main>
    </div>
  );
}
