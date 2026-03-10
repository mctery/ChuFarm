import { makeRequest } from "./apiClient";

export async function SysGetAnalyticsSummary(deviceId, { period = "daily", startDate, endDate } = {}) {
  const params = new URLSearchParams({ period });
  if (startDate) params.set("start_date", startDate);
  if (endDate) params.set("end_date", endDate);
  const res = await makeRequest(
    (api) => api.get(`/api/analytics/summary/${deviceId}?${params}`),
    { fallback: null, label: "SysGetAnalyticsSummary" }
  );
  return res.data ?? null;
}

export async function SysGetAnalyticsTrend(deviceId) {
  const res = await makeRequest(
    (api) => api.get(`/api/analytics/trend/${deviceId}`),
    { fallback: null, label: "SysGetAnalyticsTrend" }
  );
  return res.data ?? null;
}

export async function SysGetAnalyticsCompare(deviceId1, deviceId2, { startDate, endDate } = {}) {
  const params = new URLSearchParams({ device_id_1: deviceId1, device_id_2: deviceId2 });
  if (startDate) params.set("start_date", startDate);
  if (endDate) params.set("end_date", endDate);
  const res = await makeRequest(
    (api) => api.get(`/api/analytics/compare?${params}`),
    { fallback: null, label: "SysGetAnalyticsCompare" }
  );
  return res.data ?? null;
}

export async function SysGetAnalyticsRecommendations(deviceId, farmType) {
  const params = farmType ? `?farm_type=${farmType}` : "";
  const res = await makeRequest(
    (api) => api.get(`/api/analytics/recommendations/${deviceId}${params}`),
    { fallback: null, label: "SysGetAnalyticsRecommendations" }
  );
  return res.data ?? null;
}
