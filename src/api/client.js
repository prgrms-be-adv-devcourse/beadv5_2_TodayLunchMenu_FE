// import { refreshAccessToken, handleLogout } from "./token";

const API_BASE = import.meta.env.VITE_SERVER_URL;

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
    throw new ApiError({
      status: response.status,
      code: data?.errorCode || data?.code || "REQUEST_FAILED",
      message: data?.message || "요청에 실패했습니다.",
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
