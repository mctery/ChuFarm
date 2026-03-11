import { makeRequest } from "./apiClient";

export async function SysGetDeviceProfiles() {
  const res = await makeRequest((api) => api.get("/api/device-profiles"), { fallback: [], label: "SysGetDeviceProfiles" });
  return res.data ?? [];
}

export async function SysGetDeviceProfileById(id) {
  const res = await makeRequest((api) => api.get(`/api/device-profiles/${id}`), { fallback: null, label: "SysGetDeviceProfileById" });
  return res.data ?? null;
}

export async function SysCreateDeviceProfile(payload) {
  const res = await makeRequest((api) => api.post("/api/device-profiles", payload), { label: "SysCreateDeviceProfile" });
  return res.data ?? null;
}

export async function SysUpdateDeviceProfile(id, payload) {
  const res = await makeRequest((api) => api.put(`/api/device-profiles/${id}`, payload), { label: "SysUpdateDeviceProfile" });
  return res.data ?? null;
}

export async function SysDeleteDeviceProfile(id) {
  const res = await makeRequest((api) => api.delete(`/api/device-profiles/${id}`), { fallback: false, label: "SysDeleteDeviceProfile" });
  return res.message === "OK";
}
