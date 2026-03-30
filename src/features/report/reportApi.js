import { apiClient } from '../../api/client';

export async function createMemberReport(payload) {
  const response = await apiClient('/api/v1/member-reports', {
    method: 'POST',
    body: payload,
  });

  return response.data?.data ?? response.data;
}

export async function getMyMemberReports() {
  const response = await apiClient('/api/v1/member-reports/me');

  return response.data?.data ?? response.data ?? [];
}

export async function getAdminMemberReports() {
  const response = await apiClient('/api/v1/admin/member-reports');

  return response.data?.data ?? response.data ?? [];
}

export async function getAdminMemberReportDetail(reportId) {
  const response = await apiClient(`/api/v1/admin/member-reports/${reportId}`);

  return response.data?.data ?? response.data;
}

export async function approveAdminMemberReport(reportId, payload) {
  const response = await apiClient(`/api/v1/admin/member-reports/${reportId}/approve`, {
    method: 'PATCH',
    body: payload,
  });

  return response.data?.data ?? response.data;
}

export async function rejectAdminMemberReport(reportId, payload) {
  const response = await apiClient(`/api/v1/admin/member-reports/${reportId}/reject`, {
    method: 'PATCH',
    body: payload,
  });

  return response.data?.data ?? response.data;
}

export async function getAdminMemberRestrictions(memberId) {
  const response = await apiClient(`/api/v1/admin/member-restrictions/members/${memberId}`);

  return response.data?.data ?? response.data ?? [];
}

export async function createAdminMemberRestriction(payload) {
  const response = await apiClient('/api/v1/admin/member-restrictions', {
    method: 'POST',
    body: payload,
  });

  return response.data?.data ?? response.data;
}

export async function deactivateAdminMemberRestriction(restrictionId) {
  const response = await apiClient(`/api/v1/admin/member-restrictions/${restrictionId}/deactivate`, {
    method: 'PATCH',
  });

  return response.data?.data ?? response.data;
}
