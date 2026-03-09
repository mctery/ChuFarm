import { useEffect, useState } from "react";
import { SocketConnect, SocketSubscribe } from "../../../services/socket_service";
import { SysGetLatestSensorData } from "../../../services/sensor_service";
import { MqttDataContext } from "./MqttContext";

export function MqttProvider({ topics = [], deviceId, children }) {
  const [mqttData, setMqttData] = useState({});

  // Fetch latest values from API on mount (so widgets show data immediately)
  useEffect(() => {
    if (!deviceId) return;

    async function fetchInitial() {
      try {
        const latest = await SysGetLatestSensorData(deviceId);
        // latest = { "temperature": { device_id, v: { sensorId: value } }, ... }
        // Convert to topic-keyed format: { "device/{id}/temperature": { device_id, v: {...} } }
        const initial = {};
        for (const [sensorType, payload] of Object.entries(latest)) {
          const topic = `device/${deviceId}/${sensorType}`;
          initial[topic] = payload;
        }
        setMqttData(initial);
      } catch (err) {
        console.warn("Failed to fetch initial sensor data:", err);
      }
    }

    fetchInitial();
  }, [deviceId]);

  // Subscribe to real-time MQTT updates via Socket.IO
  useEffect(() => {
    let subscribes = [];

    async function initial() {
      await SocketConnect();

      for (const topic of topics) {
        const unsubscribe = await SocketSubscribe(topic, (payload) => {
          setMqttData((prev) => ({ ...prev, [topic]: payload }));
        });
        subscribes.push(unsubscribe);
      }
    }

    initial();

    return () => { subscribes.forEach((unsub) => unsub?.()); };
  }, [topics.join(",")]);

  return (
    <MqttDataContext.Provider value={mqttData}>
      {children}
    </MqttDataContext.Provider>
  );
}
