import { ApiError, apiClient } from "../../api/client";

const unwrapResponse = (response) => response?.data?.data ?? null;

export async function getMemberByIdApi(memberId) {
  if (!memberId) {
    return null;
  }

  const response = await apiClient(`/api/members/${memberId}`);
  return unwrapResponse(response);
}

export async function updateCurrentMemberApi({
  nickname,
  phone = null,
  address = null,
  profileImageKey = null,
}) {
  const response = await apiClient("/api/members/me", {
    method: "PATCH",
    body: {
      nickname,
      phone,
      address,
      profileImageKey,
    },
  });

  return unwrapResponse(response);
}

export async function changeCurrentMemberPasswordApi({
  currentPassword,
  newPassword,
}) {
  const response = await apiClient("/api/members/me/password", {
    method: "PATCH",
    body: {
      currentPassword,
      newPassword,
    },
  });

  return unwrapResponse(response);
}

export async function getMyOauthAccountsApi() {
  const response = await apiClient("/api/members/me/oauth-accounts");
  return unwrapResponse(response);
}

export async function unlinkMyOauthAccountApi(provider) {
  if (!provider) {
    throw new ApiError({
      status: 400,
      code: "BAD_REQUEST",
      message: "해제할 외부 계정 정보가 필요합니다.",
    });
  }

  const response = await apiClient(
    `/api/members/me/oauth-accounts/${provider}`,
    {
      method: "DELETE",
    },
  );

  return unwrapResponse(response);
}

export async function presignProfileImageUploadApi({ fileName, contentType }) {
  const response = await apiClient("/api/auth/profile-images/presign", {
    method: "POST",
    body: { fileName, contentType },
  });

  return unwrapResponse(response);
}

export async function uploadProfileImageToS3({ uploadUrl, file, contentType }) {
  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": contentType || file?.type || "application/octet-stream",
    },
    body: file,
  });

  if (!response.ok) {
    throw new ApiError({
      status: response.status,
      code: "S3_UPLOAD_FAILED",
      message: "프로필 이미지 업로드에 실패했습니다.",
    });
  }

  return true;
}
