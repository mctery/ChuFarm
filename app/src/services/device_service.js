import { makeRequest } from "./apiClient";

export async function SysGetDevices() {
  const res = await makeRequest((api) => api.get("/api/devices"), { fallback: [], label: "SysGetDevices" });
  return res.data ?? [];
}

export async function SysGetDevicesPaginated(page = 1, limit = 12) {
  const res = await makeRequest(
    (api) => api.get(`/api/devices?page=${page}&limit=${limit}`),
    { fallback: [], label: "SysGetDevicesPaginated" }
  );
  return { devices: res.data ?? [], pagination: res.pagination ?? null };
}

export async function SysGetDeviceById(deviceId) {
  const res = await makeRequest(
    (api) => api.get(`/api/devices/${deviceId}`),
    { fallback: null, label: "SysGetDeviceById" }
  );
  return res.data ?? null;
}

export async function SysCreateDevice(payload) {
  const res = await makeRequest((api) => api.post("/api/devices", payload), { label: "SysCreateDevice" });
  return res.data ?? null;
}

export async function SysUpdateDevice(id, payload) {
  const res = await makeRequest((api) => api.put(`/api/devices/${id}`, payload), { label: "SysUpdateDevice" });
  return res.data ?? null;
}

export async function SysDeleteDevice(id) {
  const res = await makeRequest((api) => api.delete(`/api/devices/${id}`), { fallback: false, label: "SysDeleteDevice" });
  return res.message === "OK";
}

export async function SysGetDeviceHealth(id) {
  const res = await makeRequest(
    (api) => api.get(`/api/devices/${id}/health`),
    { fallback: null, label: "SysGetDeviceHealth" }
  );
  return res.data ?? null;
}

export async function SysGetDeviceLogs(deviceId, params = {}) {
  const res = await makeRequest(
    (api) => api.get(`/api/device-logs/${deviceId}`, { params }),
    { fallback: null, label: "SysGetDeviceLogs" }
  );
  return res ?? null;
}

export async function SysSendDeviceCommand(id, command, payload = {}) {
  const res = await makeRequest(
    (api) => api.post(`/api/devices/${id}/commands`, { command, payload }),
    { label: "SysSendDeviceCommand" }
  );
  return res.data ?? null;
}
