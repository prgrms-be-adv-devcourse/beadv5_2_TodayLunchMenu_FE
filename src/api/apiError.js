class ApiError extends Error {
  constructor({ status, code, message, data }) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.data = data;
  }
}

const buildApiError = ({ response, data }) => {
  const errorCode = data?.error?.code || data?.errorCode || data?.code || "REQUEST_FAILED";
  const fallbackMessage = response.status === 401
    ? "인증이 필요합니다. 다시 로그인해 주세요."
    : "요청에 실패했습니다.";
  const errorMessage = data?.error?.message || data?.message || fallbackMessage;

  return new ApiError({
    status: response.status,
    code: errorCode,
    message: errorMessage,
    data,
  });
};

const buildNetworkError = (error) => {
  const isTimeoutError = error?.name === "AbortError";

  return new ApiError({
    status: 0,
    code: isTimeoutError ? "TIMEOUT_ERROR" : "NETWORK_ERROR",
    message: isTimeoutError
      ? "요청 시간이 초과되었습니다."
      : "서버에 연결할 수 없습니다.",
  });
};

export { ApiError, buildApiError, buildNetworkError };
