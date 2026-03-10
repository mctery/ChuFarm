import { makeRequest } from "./apiClient";

// ─── Farms ───────────────────────────────────────────────────────────────────

export async function SysGetFarms() {
  const res = await makeRequest((api) => api.get("/api/farms"), { fallback: [], label: "SysGetFarms" });
  return res.data ?? [];
}

export async function SysGetFarmById(id) {
  const res = await makeRequest((api) => api.get(`/api/farms/${id}`), { fallback: null, label: "SysGetFarmById" });
  return res.data ?? null;
}

export async function SysGetFarmStats(id) {
  const res = await makeRequest((api) => api.get(`/api/farms/${id}/stats`), { fallback: null, label: "SysGetFarmStats" });
  return res.data ?? null;
}

export async function SysCreateFarm(payload) {
  const res = await makeRequest((api) => api.post("/api/farms", payload), { label: "SysCreateFarm" });
  return res.data ?? null;
}

export async function SysUpdateFarm(id, payload) {
  const res = await makeRequest((api) => api.put(`/api/farms/${id}`, payload), { label: "SysUpdateFarm" });
  return res.data ?? null;
}

export async function SysDeleteFarm(id) {
  const res = await makeRequest((api) => api.delete(`/api/farms/${id}`), { fallback: false, label: "SysDeleteFarm" });
  return res.message === "OK";
}

// ─── Zones ───────────────────────────────────────────────────────────────────

export async function SysGetZonesByFarm(farmId) {
  const res = await makeRequest((api) => api.get(`/api/farms/${farmId}/zones`), { fallback: [], label: "SysGetZonesByFarm" });
  return res.data ?? [];
}

export async function SysCreateZone(farmId, payload) {
  const res = await makeRequest((api) => api.post(`/api/farms/${farmId}/zones`, payload), { label: "SysCreateZone" });
  return res.data ?? null;
}

export async function SysUpdateZone(zoneId, payload) {
  const res = await makeRequest((api) => api.put(`/api/zones/${zoneId}`, payload), { label: "SysUpdateZone" });
  return res.data ?? null;
}

export async function SysDeleteZone(zoneId) {
  const res = await makeRequest((api) => api.delete(`/api/zones/${zoneId}`), { fallback: false, label: "SysDeleteZone" });
  return res.message === "OK";
}
