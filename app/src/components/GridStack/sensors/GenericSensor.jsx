import PropTypes from "prop-types";
import { SENSORS_TYPE } from "../../../services/global_variable";
import useSensorValue from "./hooks/useSensorValue";
import useAnimatedNumber from "./hooks/useAnimatedNumber";
import SensorCard from "./components/SensorCard";

export default function GenericSensor({ deviceId, widget, sensorType }) {
  const topic = `device/${deviceId}/${sensorType}`;
  const sensorConfig = SENSORS_TYPE[sensorType];
  const [val, loading] = useSensorValue(topic, widget.sensorKey);
  const display = useAnimatedNumber(val);

  return (
    <SensorCard
      icon={sensorConfig.icon}
      CenterIcon={sensorConfig.centerIcon}
      title={widget.title ?? sensorConfig.name}
      value={display}
      unit={widget.unit}
      deviceId={deviceId}
      sensorKey={widget.sensorKey}
      loading={loading}
      bgcolor={widget.bgcolor}
      max={widget.max}
      min={widget.min}
      variant={sensorType === "light" ? "light" : "gauge"}
    />
  );
}

GenericSensor.propTypes = {
  deviceId: PropTypes.string,
  sensorType: PropTypes.oneOf(["temperature", "humidity", "light", "soil"]).isRequired,
  widget: PropTypes.shape({
    title: PropTypes.string,
    sensorKey: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    unit: PropTypes.string,
    bgcolor: PropTypes.string,
    max: PropTypes.number,
    min: PropTypes.number,
  }),
};
