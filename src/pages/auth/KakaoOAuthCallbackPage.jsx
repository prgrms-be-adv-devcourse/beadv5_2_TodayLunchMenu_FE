import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import {
  fetchKakaoOAuthResultApi,
  getMyInfoApi,
} from "../../features/auth/authApi";
import {
  clearPendingKakaoLink,
  setPendingKakaoLink,
} from "../../features/auth/kakaoLinkStorage";
import { setAuthState, setAuthTokens } from "../../features/auth/authStore";

export default function KakaoOAuthCallbackPage() {
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();
  const resultKey = searchParams.get("resultKey");
  const flow = searchParams.get("flow") || "login";

  const isLinkFlow = flow === "link";
  const consumedResultKeyRef = useRef(null);
  const [message, setMessage] = useState(
    isLinkFlow
      ? "카카오 계정을 연결하고 있어요..."
      : "카카오 로그인 정보를 확인하고 있어요...",
  );
  const [error, setError] = useState("");

  useEffect(() => {
    if (!resultKey) {
      return;
    }

    // resultKey가 이미 처리된 적이 있다면, 중복 처리를 방지하기 위해 아무 작업도 하지 않습니다.
    if (consumedResultKeyRef.current === resultKey) {
      return;
    }

    // 현재 resultKey를 처리 중
    consumedResultKeyRef.current = resultKey;

    let active = true;

    async function handleCallback() {
      try {
        const result = await fetchKakaoOAuthResultApi({ resultKey });

        if (!active) {
          return;
        }

        // 1. 성공
        if (result?.status === "SUCCESS") {
          // 1-1. 연동 요청
          if (isLinkFlow) {
            clearPendingKakaoLink();
            navigate("/me/external-accounts?oauthLinked=KAKAO", {
              replace: true,
            });
            return;
          }

          // 1-2. 로그인 요청
          setMessage("로그인 중이에요...");
          setAuthTokens({
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
          });
          const user = await getMyInfoApi();

          if (!active) {
            return;
          }

          clearPendingKakaoLink();
          setAuthState({
            user,
            isAuthenticated: true,
            loading: false,
          });
          navigate("/", { replace: true });
          return;
        }

        // 2. 연동 필요
        if (result?.status === "LINK_REQUIRED") {
          // 2-1. 연동 요청
          if (isLinkFlow) {
            navigate(
              "/me/external-accounts?oauthError=" +
                encodeURIComponent(
                  "현재 로그인한 계정에 바로 연동할 수 없습니다.",
                ),
              { replace: true },
            );
            return;
          }

          // 2-2. 로그인 요청
          setPendingKakaoLink({
            linkToken: result.linkToken,
            provider: result.provider,
            providerUserId: result.providerUserId,
            email: result.email,
            nickname: result.nickname,
          });
          navigate("/auth/kakao/link-required", { replace: true });
          return;
        }

        // 3. 실패
        const errorMessage =
          result?.errorMessage || "카카오 인증 처리에 실패했습니다.";
        // 3-1. 연동 요청
        if (isLinkFlow) {
          navigate(
            `/me/external-accounts?oauthError=${encodeURIComponent(errorMessage)}`,
            {
              replace: true,
            },
          );
          return;
        }

        // 3-2. 로그인 요청
        setError(errorMessage);
      } catch (callbackError) {
        if (!active) {
          return;
        }

        consumedResultKeyRef.current = null;

        const errorMessage =
          callbackError?.message || "카카오 인증 처리에 실패했습니다.";
        if (isLinkFlow) {
          navigate(
            `/me/external-accounts?oauthError=${encodeURIComponent(errorMessage)}`,
            {
              replace: true,
            },
          );
          return;
        }

        setError(errorMessage);
      }
    }

    handleCallback();

    return () => {
      active = false;
    };
  }, [isLinkFlow, navigate, resultKey]);

  if (!resultKey) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-6 text-center text-[#38274c]">
        <div className="w-full rounded-[2rem] bg-white p-8 shadow-[0_24px_70px_rgba(93,63,211,0.12)]">
          <h1 className="text-2xl font-black tracking-tight">
            잘못된 콜백 요청
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            OAuth 결과 키가 없습니다.
          </p>
          <Link
            to={isLinkFlow ? "/me/external-accounts" : "/login"}
            className="mt-6 inline-flex h-12 items-center justify-center rounded-full bg-violet-700 px-6 text-sm font-semibold text-white"
          >
            {isLinkFlow ? "외부 계정 관리로 돌아가기" : "로그인으로 돌아가기"}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-6 text-center text-[#38274c]">
      <div className="w-full rounded-[2rem] bg-white p-8 shadow-[0_24px_70px_rgba(93,63,211,0.12)]">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#FEE500] text-xl font-black text-[#3C1E1E]">
          K
        </div>

        {error ? (
          <>
            <h1 className="text-2xl font-black tracking-tight">
              카카오 인증에 실패했어요
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">{error}</p>
            <Link
              to="/login"
              className="mt-6 inline-flex h-12 items-center justify-center rounded-full bg-violet-700 px-6 text-sm font-semibold text-white"
            >
              로그인으로 돌아가기
            </Link>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-black tracking-tight">
              {isLinkFlow
                ? "카카오 계정을 연결하고 있어요"
                : "카카오 로그인 처리 중"}
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">{message}</p>
          </>
        )}
      </div>
    </div>
  );
}
