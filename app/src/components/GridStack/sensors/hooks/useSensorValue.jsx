import { useState, useEffect, useContext, useRef } from "react";
import { MqttDataContext } from "../../context/MqttContext";

export default function useSensorValue(topic, key) {
  const mqtt   = useContext(MqttDataContext);
  const [val , setVal ] = useState(null);
  const [load, setLoad] = useState(true);
  const timeoutRef = useRef(null);

  useEffect(() => {
    const payload = mqtt[topic];
    if (payload?.v?.[key] !== undefined) {
      setVal(payload.v[key]);
      setLoad(false);
      // Clear timeout since we got data
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }
  }, [mqtt, topic, key]);

  // Stop loading after 5s even if no data arrives (show "no data" instead of infinite spinner)
  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      setLoad((prev) => {
        if (prev) return false; // stop loading
        return prev;
      });
    }, 5000);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return [val, load];
}
