// import { refreshAccessToken, handleLogout } from "./token";
// import { ApiError } from "./error";

// const API_BASE = import.meta.env.VITE_SERVER_URL;

// 기본 옵션
const defaultOptions = {
  timeout: 20000,
  retry: false,
};

// retry -> "이미 재시도했는지 여부"를 표시하는 플래그
const apiClient = async (
  url,
  {
    method = "GET",
    headers = {},
    body,
    params,
    timeout = defaultOptions.timeout,
  } = {},
  retry = defaultOptions.retry
) => {
  const accessToken = localStorage.getItem("accessToken");

  // body, method 체크
  const hasBody =
    body !== undefined &&
    body !== null &&
    method !== "GET" &&
    method !== "HEAD";

  // Query Params 처리
  const queryString = params
    ? "?" + new URLSearchParams(params).toString()
    : "";

  // abortController: fetch 요청을 '외부에서 제어'할 수 있게 만들어주는 도구
  // - controller.signal : 요청에 연결되는 신호
  // - controller.abort() : 이걸 호출하면 요청 종료
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  let response;

  try {
    // 401, 404, 500 --> 정상 응답(예외 아님)
    response = await fetch(`${API_BASE}${url}${queryString}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      },
      body: hasBody ? JSON.stringify(body) : undefined,
      signal: controller.signal,
      credentials: "include",
    });
  } catch (error) {
    // 네트워크 자체 실패(연결 불가, 타임아웃, CORS 차단 등) & 요청 자체가 abort 됨
    clearTimeout(timer);
    // handleApiError(response); // response가 undefined 일 수 있음
    console.error(error);
    throw new ApiError({
      status: 0,
      code: "NETWORK_ERROR",
      message: "서버에 연결할 수 없습니다.",
    });
  }

  clearTimeout(timer);

  // ✅ 여기서부터 ky/axios 기능 구현됨
  let data = null;

  try {
    data = await response.clone().json();
  } catch {}

  // ✅ 401 + TOKEN_EXPIRED -> refresh token + 재요청 (1회만)
  if (response.status === 401 && data?.code === "TOKEN_EXPIRED") {
    if (retry) {
      handleLogout();
      throw new ApiError({
        status: 401,
        code: "SESSION_EXPIRED",
        message: "로그인이 만료되었습니다. (토큰 재발급 2회 시도 X)",
      });
    }

    try {
      await refreshAccessToken();

      return apiClient(
        url,
        {
          method,
          headers,
          body,
          params,
        },
        true
      );
    } catch {
      handleLogout();
      throw new ApiError({
        status: 401,
        code: "SESSION_EXPIRED",
        message: "로그인이 만료되었습니다. (재요청 실패)",
      });
    }
  }

  // ✅ 200~299가 아니면 자동 예외 (axios 스타일)
  if (!response.ok) {
    throw new ApiError({
      status: response.status,
      code: data?.errorCode || "REQUEST_FAILED",
      message: data?.message || "요청에 실패했습니다.",
    });
  }

  // ✅ ky/axios 스타일 반환 구조
  return {
    status: response.status,
    headers: response.headers,
    data,
  };
};

export { apiClient };
