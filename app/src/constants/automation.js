// Shared constants for Automation Rules and Schedules pages

export const OPERATORS = [
  { value: "gt", label: ">" },
  { value: "gte", label: ">=" },
  { value: "lt", label: "<" },
  { value: "lte", label: "<=" },
  { value: "eq", label: "=" },
  { value: "neq", label: "!=" },
];

export const ACTION_TYPES = [
  { value: "send_notification", label: "ส่งแจ้งเตือน" },
  { value: "device_command", label: "ส่งคำสั่งอุปกรณ์" },
  { value: "log_event", label: "บันทึก Log" },
];

export const CRON_PRESETS = [
  { label: "ทุก 5 นาที", value: "*/5 * * * *" },
  { label: "ทุก 15 นาที", value: "*/15 * * * *" },
  { label: "ทุก 30 นาที", value: "*/30 * * * *" },
  { label: "ทุกชั่วโมง", value: "0 * * * *" },
  { label: "ทุกวัน 06:00", value: "0 6 * * *" },
  { label: "ทุกวัน 18:00", value: "0 18 * * *" },
  { label: "ทุกวัน เที่ยงคืน", value: "0 0 * * *" },
  { label: "กำหนดเอง", value: "" },
];

export const DEFAULT_TIMEZONE = "Asia/Bangkok";
