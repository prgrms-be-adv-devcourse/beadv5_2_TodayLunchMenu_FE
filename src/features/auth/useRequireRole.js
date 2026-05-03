import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./useAuth";
import { pushToast } from "../notification/notificationToastStore";

/**
 * 페이지 진입 또는 권한 변경(예: 로그아웃) 감지 시 권한 검사.
 * - 로딩 중이면 아무 것도 안 함
 * - 비로그인: "로그인이 필요합니다" 토스트 + 홈 이동
 * - 권한 부족: "접근 권한이 없습니다" 토스트 + 홈 이동
 *
 * @param {string|string[]} allowedRoles 허용 role(s). 예: "SELLER" 또는 ["SELLER", "ADMIN"]
 * @param {{ redirectTo?: string, message?: string }} [options]
 * @returns {{ user, hasAccess: boolean, loading: boolean }}
 */
export function useRequireRole(allowedRoles, options = {}) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const handledRef = useRef(false);

  const allowed = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  const { redirectTo = "/", message } = options;

  const hasAccess = !loading && !!user && allowed.includes(user.role);

  useEffect(() => {
    if (loading) return;
    if (hasAccess) {
      handledRef.current = false;
      return;
    }
    if (handledRef.current) return;
    handledRef.current = true;

    const title =
      message ?? (!user ? "로그인이 필요합니다" : "접근 권한이 없습니다");
    pushToast({ title, tone: "error", timeoutMs: 4000 });
    navigate(redirectTo, { replace: true });
  }, [loading, hasAccess, user, message, navigate, redirectTo]);

  return { user, hasAccess, loading };
}
