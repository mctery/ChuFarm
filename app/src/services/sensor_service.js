import { makeRequest } from "./apiClient";

export async function SysGetDeviceSensorsById(deviceId) {
  const res = await makeRequest(
    (api) => api.get(`/api/sensors/device/${deviceId}`),
    { fallback: [], label: "SysGetDeviceSensorsById" }
  );
  return res.data ?? [];
}

export async function SysCreateSensor(payload) {
  const res = await makeRequest((api) => api.post("/api/sensors/", payload), { label: "SysCreateSensor" });
  return res.data ?? null;
}

export async function SysUpdateDeviceSensors(id, payload) {
  const res = await makeRequest((api) => api.put(`/api/sensors/${id}`, payload), { label: "SysUpdateDeviceSensors" });
  return res.data ?? null;
}

export async function SysGetSensorDataAggregate(deviceId, sensor, sensorId, startDate, endDate, groupBy = "hour") {
  const res = await makeRequest(
    (api) => api.post("/api/sensorsdata/aggregate", {
      device_id: deviceId, sensor, sensor_id: sensorId, startDate, endDate, groupBy,
    }),
    { fallback: [], label: "SysGetSensorDataAggregate" }
  );
  return res.data ?? [];
}

export async function SysDeleteSensor(id) {
  const res = await makeRequest((api) => api.delete(`/api/sensors/${id}`), { fallback: false, label: "SysDeleteSensor" });
  return res.message === "OK";
}

export async function SysGetLatestSensorData(deviceId) {
  const res = await makeRequest(
    (api) => api.get(`/api/sensorsdata/latest/${deviceId}`),
    { fallback: {}, label: "SysGetLatestSensorData" }
  );
  return res.data ?? {};
}
