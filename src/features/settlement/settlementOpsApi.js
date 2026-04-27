import { apiClient } from "../../api/client";

function getApiPayload(data) {
  return data?.data ?? data;
}

async function requestManualFailedPayoutApi(settlementId) {
  const response = await apiClient("/api/settlements/failed-payout/manual-retry", {
    method: "POST",
    body: {
      settlementId,
    },
  });

  return getApiPayload(response.data);
}

async function replayFailedPayoutsApi(settlementIds) {
  const response = await apiClient("/api/settlements/failed-payout/replay", {
    method: "POST",
    body: {
      settlementIds,
    },
  });

  return getApiPayload(response.data);
}

export { replayFailedPayoutsApi, requestManualFailedPayoutApi };
