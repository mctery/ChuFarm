import { makeRequest } from "./apiClient";

export async function getWidgetLayout(deviceId) {
  const res = await makeRequest(
    (api) => api.get(`/api/sensorWidget/${deviceId}`),
    { fallback: [], label: "getWidgetLayout" }
  );
  if (Array.isArray(res.data) && res.data.length > 0) {
    return JSON.parse(res.data[0].widget_json || "[]");
  }
  return [];
}

export async function saveWidgetLayout(deviceId, widgets) {
  const res = await makeRequest(
    (api) => api.put(`/api/sensorWidget/${deviceId}`, widgets),
    { fallback: [], label: "saveWidgetLayout" }
  );
  if (res.data) {
    return JSON.parse(res.data.widget_json || "[]");
  }
  return [];
}

export async function deleteWidgetLayout(deviceId) {
  const res = await makeRequest(
    (api) => api.delete(`/api/sensorWidget/${deviceId}`),
    { fallback: false, label: "deleteWidgetLayout" }
  );
  return res.message === "OK";
}
