# ChuFarm - CLAUDE.md

> Smart Farm IoT Platform — Monorepo
> Version: 3.0.0

## Repo Structure

```
ChuFarm/
├── api/    # Backend: Node.js + Express + MongoDB + MQTT + Socket.IO
└── app/    # Frontend: React 19 + MUI 7 + Vite 6
```

Each subdirectory has its own `CLAUDE.md` with detailed documentation:
- **[api/CLAUDE.md](api/CLAUDE.md)** — API endpoints, models, middleware, MQTT, auth
- **[app/CLAUDE.md](app/CLAUDE.md)** — Pages, services, components, patterns, routes

## Quick Start

```bash
# API (terminal 1)
cd api && yarn install && yarn dev     # port 3000

# App (terminal 2)
cd app && yarn install && npm run dev  # port 5173
```

## Key Architecture

### Data Flow
```
IoT Device → MQTT Broker → api/mqttHandler
  → MongoDB (SensorData) + Socket.IO emit
  → app/ receives via MqttProvider + useSensorValue() hook
  → Real-time UI update with animated values

Threshold exceeded → Notification + LINE Notify
Rule conditions met → actionExecutor (MQTT command / notification / log)
Cron schedule → scheduleEngine → actionExecutor
```

### Auth Flow
```
Login → POST /api/users/login → JWT access (12h) + refresh (7d)
  → Stored in localStorage → Axios interceptor adds Bearer token
  → 401 → Auto refresh → Retry request
  → Refresh fails → Force logout
```

### Tech Stack
| Component | API | App |
|-----------|-----|-----|
| Runtime | Node.js + Express 4 | React 19 + Vite 6 |
| Database | MongoDB + Mongoose 6 | — |
| UI | — | MUI 7 + Emotion |
| Real-time | MQTT 5 + Socket.IO 4 | Socket.IO Client 4 |
| Auth | JWT + bcrypt + RBAC | Axios interceptors |
| Validation | Joi 18 | Local validation utils |
| Charts | — | MUI X-Charts 8 |
| Widgets | — | GridStack 12 |
| Scheduling | node-cron 4 | — |
| Notifications | LINE Notify + Resend | Notistack 3 |

## Conventions (Both Projects)

- **Language:** Thai UI strings, English code/variables
- **Soft deletes:** `status: 'A'` (active) / `'D'` (deleted)
- **API response:** `{ message: 'OK', data: ..., pagination?: {...} }`
- **Error handling:** API throws → global error middleware; App catches → snackbar
- **MUI v7:** `slotProps.input` (not InputProps), `DialogContent dividers`, Grid `size=` prop
- **Async:** API uses `express-async-handler`; App uses `useCallback` + `useEffect`

## Environment Variables

### API (`api/.env`)
```env
TOKEN_KEY="jwt-secret"           # Required
MONGO_URL="mongodb+srv://..."    # Required
PORT=3000
FRONTEND="http://localhost:5173" # CORS
MQTT_URL="mqtt://broker:1883"
OPEN_WEATHER_KEY="..."
RESEND_API_KEY="..."
```

### App (`app/.env`)
```env
VITE_API="http://localhost:3000"
```

## Database Models (19)

Core: User, Device, Sensor, SensorData (TTL 90d), SensorWidget, SensorThreshold
Organization: Farm, Zone, DeviceProfile
Automation: AutomationRule, Schedule, RuleExecutionLog (TTL 30d)
System: Notification, DeviceLog (TTL 30d), AuditLog (TTL 365d), Permission, Menu, UserMenu, UserSetting

## MQTT Topics

| Pattern | Direction | Purpose |
|---------|-----------|---------|
| `device/+/temperature` | Device → Server | Sensor readings |
| `device/+/humidity` | Device → Server | Sensor readings |
| `device/+/light` | Device → Server | Sensor readings |
| `device/+/soil` | Device → Server | Sensor readings |
| `device/+/checkin` | Device → Server | Heartbeat (online) |
| `device/+/will` | Device → Server | LWT (offline) |
| `device/+/health` | Device → Server | Battery, RSSI, firmware |
| `request/{id}/{cmd}` | Server → Device | Commands |
