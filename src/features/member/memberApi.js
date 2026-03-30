import { apiClient } from '../../api/client';

const unwrapResponse = (response) => response?.data?.data ?? null;

export async function getMemberByIdApi(memberId) {
  if (!memberId) {
    return null;
  }

  const response = await apiClient(`/api/v1/members/${memberId}`);
  return unwrapResponse(response);
}
