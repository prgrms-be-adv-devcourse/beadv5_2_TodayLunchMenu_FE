// import { refreshAccessToken, handleLogout } from "./token";

const API_BASE = import.meta.env.VITE_SERVER_URL || "";

class ApiError extends Error {
  constructor({ status, code, message, data }) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.data = data;
  }

}

const defaultOptions = {
  timeout: 20000,
  retry: false,
};

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
  const normalizedMethod = method.toUpperCase();

  const hasBody =
    body !== undefined &&
    body !== null &&
    normalizedMethod !== "GET" &&
    normalizedMethod !== "HEAD";

  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  const queryString = params
    ? `?${new URLSearchParams(params).toString()}`
    : "";

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  let response;
  let data = null;

  try {
    response = await fetch(`${API_BASE}${url}${queryString}`, {
      method: normalizedMethod,
      headers: {
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        ...(!isFormData && hasBody ? { "Content-Type": "application/json" } : {}),
        ...headers,
      },
      body: hasBody ? (isFormData ? body : JSON.stringify(body)) : undefined,
      signal: controller.signal,
      credentials: "include",
    });
  } catch (error) {
    clearTimeout(timer);

    const isTimeoutError = error?.name === "AbortError";

    throw new ApiError({
      status: 0,
      code: isTimeoutError ? "TIMEOUT_ERROR" : "NETWORK_ERROR",
      message: isTimeoutError
        ? "요청 시간이 초과되었습니다."
        : "서버에 연결할 수 없습니다.",
    });
  }

  clearTimeout(timer);

  try {
    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      data = await response.clone().json();
    } else {
      const text = await response.clone().text();
      data = text || null;
    }
  } catch {}

  // TODO: VITE_SERVER_URL이 비어 있으면 초기화 단계에서 바로 감지하도록 검증 추가
  // TODO: refresh 토큰 재발급을 붙일 계획이 없다면 retry 인자 제거 검토
  // TODO: 204 No Content 같은 빈 응답을 의도적으로 처리하도록 분기 명확화
  // TODO: refresh 토큰을 쿠키로 쓰지 않으면 credentials: "include" 유지 여부 재검토

  // if (response.status === 401 && data?.code === "TOKEN_EXPIRED") {
  //   if (retry) {
  //     handleLogout();
  //     throw new ApiError({
  //       status: 401,
  //       code: "SESSION_EXPIRED",
  //       message: "로그인이 만료되었습니다.",
  //     });
  //   }
  //
  //   try {
  //     await refreshAccessToken();
  //
  //     return apiClient(
  //       url,
  //       {
  //         method: normalizedMethod,
  //         headers,
  //         body,
  //         params,
  //         timeout,
  //       },
  //       true
  //     );
  //   } catch {
  //     handleLogout();
  //     throw new ApiError({
  //       status: 401,
  //       code: "SESSION_EXPIRED",
  //       message: "로그인이 만료되었습니다.",
  //     });
  //   }
  // }

  if (!response.ok) {
    const errorCode = data?.error?.code || data?.errorCode || data?.code || "REQUEST_FAILED";
    const fallbackMessage = response.status === 401
      ? "인증이 필요합니다. 다시 로그인해주세요."
      : "요청에 실패했습니다.";
    const errorMessage =
      data?.error?.message || data?.message || fallbackMessage;

    throw new ApiError({
      status: response.status,
      code: errorCode,
      message: errorMessage,
      data,
    });
  }

  return {
    status: response.status,
    headers: response.headers,
    data,
  };
};

export { ApiError, apiClient };
