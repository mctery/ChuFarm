# SmartFarm API

REST API server for the SmartFarm IoT platform — manages devices, sensors, real-time data, user authentication, RBAC permissions, automation rules, farm/zone hierarchy, LINE notifications, data export, device health monitoring, and analytics.

## Tech Stack

- **Runtime:** Node.js + Express
- **Database:** MongoDB (Mongoose ODM)
- **Auth:** JWT (access + refresh tokens) + bcrypt
- **Real-time:** MQTT (sensor data ingestion) + Socket.IO (WebSocket push to frontend)
- **Automation:** Rule engine (condition-based) + Schedule engine (cron-based via `node-cron`)
- **Notifications:** In-app + LINE Notify + Email (Resend)
- **Validation:** Joi
- **Security:** Helmet, CORS, rate limiting, MQTT topic injection prevention
- **Logging:** Winston

## Getting Started

### Prerequisites

- Node.js >= 16
- MongoDB instance (local or Atlas)
- MQTT broker (e.g. Mosquitto, HiveMQ)

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
PORT=3000
NODE_ENV=development
MONGO_URL=mongodb+srv://<user>:<pass>@<cluster>/<db>
TOKEN_KEY=your_jwt_secret
JWT_EXPIRY=12h
REFRESH_TOKEN_KEY=your_refresh_secret
REFRESH_EXPIRY=7d
MQTT_URL=mqtt://<broker-host>
FRONTEND=http://localhost:5173
APP_URL=http://localhost:5173
OPEN_WEATHER_KEY=your_openweathermap_key
RESEND_API_KEY=your_resend_api_key
RESEND_FROM=SmartFarm <noreply@yourdomain.com>
```

### Run

```bash
# Development (API + Socket.IO server with auto-reload)
npm start

# API server only
npm run dev

# Production
npm run serve
```

### Tests

```bash
npm test
```

16 test suites covering all controllers and middleware. Uses a lightweight custom test runner with `require.cache` patching (no external test framework).

## Project Structure

```
src/
├── config/
│   ├── index.js            # Central config (env vars + defaults + constants)
│   ├── logger.js           # Winston logger setup
│   ├── mqtt.js             # MQTT client factory + topic subscription
│   ├── socketio.js         # Socket.IO setup
│   └── permissions.js      # RBAC permission definitions (42 permissions, 18 groups)
├── controllers/            # Route handlers (20 controllers)
│   ├── analyticsController.js
│   ├── automationRuleController.js
│   ├── deviceController.js
│   ├── deviceProfileController.js
│   ├── exportController.js
│   ├── farmController.js
│   ├── scheduleController.js
│   ├── zoneController.js
│   └── ...
├── middleware/
│   ├── authorization.js    # JWT verification
│   ├── checkPermission.js  # RBAC permission + admin check
│   ├── ownershipCheck.js   # Device ownership verification
│   ├── validate.js         # Joi schema validation
│   ├── errorMiddleware.js  # Global error handler
│   ├── requestLogger.js    # HTTP request logging
│   └── auditLogger.js     # Mutation audit trail
├── models/                 # Mongoose schemas (19 models)
│   ├── automationRuleModel.js
│   ├── scheduleModel.js
│   ├── ruleExecutionLogModel.js
│   ├── farmModel.js
│   ├── zoneModel.js
│   ├── deviceProfileModel.js
│   └── ...
├── routes/                 # Express routers (20 route files)
├── services/
│   ├── actionExecutor.js   # Shared action execution (MQTT commands, notifications, logging)
│   ├── ruleEngine.js       # Automation rule evaluation (AND/OR condition groups)
│   ├── scheduleEngine.js   # Cron-based schedule management (node-cron)
│   ├── lineNotifyService.js# LINE Notify integration + quiet hours
│   ├── recommendationEngine.js # Farm-type-aware sensor recommendations
│   └── mqttHandler.js      # MQTT message processing + threshold checks
├── utils/
│   ├── getUserId.js        # User ID normalization
│   └── pagination.js       # Pagination helpers
├── validations/            # Joi schemas (14 validation files)
├── scripts/
│   ├── seedSampleData.js   # Seed test data
│   ├── migrateRoles.js     # Migrate user roles + permissions
│   └── migrateMenus.js     # Seed menus + assign to users
└── app.js                  # Express app bootstrap
server.js                   # Entry point
tests/                      # Test suites (16 files)
```

## Database Models

| Model | Collection | Description |
|-------|-----------|-------------|
| User | `users` | User accounts with email/password, role (admin/user) |
| Device | `devices` | IoT devices linked to users, farms, zones. Health fields (battery, RSSI, firmware, uptime) |
| Sensor | `sensors` | Sensors attached to devices (temperature, humidity, light, soil) |
| SensorData | `sensordatas` | Time-series sensor readings (TTL: 90 days) |
| SensorWidget | `sensorwidgets` | Dashboard widget configurations per device |
| SensorThreshold | `sensorthresholds` | Alert thresholds for sensor values |
| Notification | `notifications` | In-app notifications (threshold alerts, device status, automation) |
| DeviceLog | `devicelogs` | Device online/offline events (TTL: 30 days) |
| AuditLog | `auditlogs` | User action audit trail (TTL: 365 days) |
| UserSetting | `usersettings` | Per-user preferences (timezone, language, notifications, LINE token, quiet hours) |
| Permission | `permissions` | Per-user RBAC permissions |
| Menu | `menus` | Navigation menu items (2-level hierarchy) |
| UserMenu | `usermenus` | Per-user menu access assignments |
| AutomationRule | `automationrules` | Condition-based rules with AND/OR logic groups |
| Schedule | `schedules` | Cron-based scheduled actions with timezone support |
| RuleExecutionLog | `ruleexecutionlogs` | Execution history for rules & schedules (TTL: 30 days) |
| Farm | `farms` | Farm profiles with location, type, area |
| Zone | `zones` | Zones within farms (greenhouse, field, nursery, etc.) |
| DeviceProfile | `deviceprofiles` | Device type templates (expected sensors, thresholds, checkin interval) |

## API Endpoints

Base URL: `/api`

### Authentication (`/users`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/users/login` | No | Login (returns tokens + permissions + menus) |
| POST | `/users/register` | No | Register new user |
| POST | `/users/refresh` | No | Refresh access token |
| POST | `/users/token` | No | Verify/decode token |
| POST | `/users/forgot-password` | No | Send password reset email |
| POST | `/users/reset-password` | No | Reset password with token |

### Users (`/users`)

| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| GET | `/users` | Auth | List all active users |
| GET | `/users/me` | Auth | Get own profile |
| PUT | `/users/me` | Auth | Update own profile |
| GET | `/users/:id` | `users:read` | Get user by ID |
| PUT | `/users/:id` | `users:write` | Update user |
| DELETE | `/users/:id` | `users:delete` | Soft-delete user |

### Devices (`/devices`)

| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| GET | `/devices` | `devices:read` | List devices (paginated) |
| POST | `/devices` | `devices:write` | Create device |
| GET | `/devices/user/:user_id` | `devices:read` | Get user's devices |
| GET | `/devices/:id` | `devices:read` | Get device |
| PUT | `/devices/:id` | `devices:write` | Update device |
| DELETE | `/devices/:id` | `devices:delete` | Soft-delete device |
| GET | `/devices/:id/health` | `devices:read` | Get device health + recent logs |
| POST | `/devices/:id/commands` | `devices:command` | Send MQTT command |

### Sensors (`/sensors`)

| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| GET | `/sensors` | `sensors:read` | List all sensors |
| POST | `/sensors` | `sensors:write` | Create sensor |
| GET | `/sensors/device/:id` | `sensors:read` + ownership | Device sensors |
| GET | `/sensors/device/type/:id/:type` | `sensors:read` + ownership | Device sensors by type |
| GET | `/sensors/:id` | `sensors:read` | Get sensor |
| PUT | `/sensors/:id` | `sensors:write` | Update sensor |
| DELETE | `/sensors/:id` | `sensors:delete` | Soft-delete sensor |

### Sensor Data (`/sensorsdata`)

| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| POST | `/sensorsdata/find` | `sensor_data:read` + ownership | Query sensor data |
| POST | `/sensorsdata/range` | `sensor_data:read` + ownership | Query by date range |
| POST | `/sensorsdata/create` | `sensor_data:write` + ownership | Bulk insert data |
| POST | `/sensorsdata/aggregate` | `sensor_data:read` + ownership | Aggregated stats (avg/min/max) |

### Automation Rules (`/rules`)

| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| GET | `/rules` | `rules:read` | List user's rules |
| POST | `/rules` | `rules:write` | Create rule |
| GET | `/rules/:id` | `rules:read` | Get rule detail |
| PUT | `/rules/:id` | `rules:write` | Update rule |
| DELETE | `/rules/:id` | `rules:delete` | Soft-delete rule |
| POST | `/rules/:id/toggle` | `rules:write` | Enable/disable rule |
| POST | `/rules/:id/test` | `rules:write` | Dry-run test with custom sensor data |
| GET | `/rules/:id/logs` | `rules:read` | Execution history (with ownership check) |

### Schedules (`/schedules`)

| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| GET | `/schedules` | `schedules:read` | List user's schedules |
| POST | `/schedules` | `schedules:write` | Create schedule (cron-based) |
| GET | `/schedules/:id` | `schedules:read` | Get schedule detail |
| PUT | `/schedules/:id` | `schedules:write` | Update schedule |
| DELETE | `/schedules/:id` | `schedules:delete` | Soft-delete + stop cron |
| POST | `/schedules/:id/toggle` | `schedules:write` | Enable/disable + start/stop cron |
| GET | `/schedules/:id/logs` | `schedules:read` | Execution history (with ownership check) |

### Farms (`/farms`)

| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| GET | `/farms` | `farms:read` | List user's farms (admin: `?all=true`) |
| POST | `/farms` | `farms:write` | Create farm |
| GET | `/farms/:id` | `farms:read` | Get farm detail + zones |
| PUT | `/farms/:id` | `farms:write` | Update farm |
| DELETE | `/farms/:id` | `farms:delete` | Soft-delete farm + cascade zones |
| GET | `/farms/:id/stats` | `farms:read` | Farm summary (zones, devices, online, alerts) |
| GET | `/farms/:farm_id/zones` | `zones:read` | List zones in farm |
| POST | `/farms/:farm_id/zones` | `zones:write` | Create zone in farm |

### Zones (`/zones`)

| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| GET | `/zones/:id` | `zones:read` | Get zone detail + devices |
| PUT | `/zones/:id` | `zones:write` | Update zone |
| DELETE | `/zones/:id` | `zones:delete` | Soft-delete zone |

### Data Export (`/export`)

| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| GET | `/export/sensors/:device_id` | `sensor_data:read` + ownership | Export CSV |
| GET | `/export/sensors/:device_id/json` | `sensor_data:read` + ownership | Export JSON |
| GET | `/export/report/daily/:device_id` | `sensor_data:read` + ownership | Daily summary |
| GET | `/export/report/weekly/:device_id` | `sensor_data:read` + ownership | Weekly summary |

Query params: `start_date`, `end_date` (required, max 31 days), `sensor_type`, `sensor_id` (optional)

### Analytics (`/analytics`)

| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| GET | `/analytics/summary/:device_id` | `sensor_data:read` + ownership | Period summary (daily/weekly/monthly) |
| GET | `/analytics/trend/:device_id` | `sensor_data:read` + ownership | Trend detection (rising/falling/stable) |
| GET | `/analytics/compare` | `sensor_data:read` | Compare two devices |
| GET | `/analytics/recommendations/:device_id` | `sensor_data:read` + ownership | Recommendations per farm type |

### Device Profiles (`/device-profiles`)

| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| GET | `/device-profiles` | `devices:read` | List profiles |
| POST | `/device-profiles` | `devices:write` | Create profile |
| GET | `/device-profiles/:id` | `devices:read` | Get profile |
| PUT | `/device-profiles/:id` | `devices:write` | Update profile |
| DELETE | `/device-profiles/:id` | `devices:delete` | Soft-delete profile |

### Sensor Widgets (`/sensorWidget`)

| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| GET | `/sensorWidget/:device_id` | `widgets:read` | Get widget config |
| POST | `/sensorWidget` | `widgets:write` | Create widget |
| PUT | `/sensorWidget/:device_id` | `widgets:write` | Update widget |
| DELETE | `/sensorWidget/:device_id` | `widgets:delete` | Delete widget |

### Thresholds (`/thresholds`)

| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| POST | `/thresholds` | `thresholds:write` | Create threshold |
| GET | `/thresholds/device/:device_id` | `thresholds:read` | Get by device |
| GET | `/thresholds/user/:user_id` | `thresholds:read` | Get by user |
| PUT | `/thresholds/:id` | `thresholds:write` | Update threshold |
| DELETE | `/thresholds/:id` | `thresholds:delete` | Deactivate threshold |

### Notifications (`/notifications`)

| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| GET | `/notifications/user/:user_id` | `notifications:read` | Get notifications |
| GET | `/notifications/user/:user_id/unread-count` | `notifications:read` | Unread count |
| PUT | `/notifications/:id/read` | `notifications:write` | Mark as read |
| PUT | `/notifications/user/:user_id/read-all` | `notifications:write` | Mark all as read |
| DELETE | `/notifications/:id` | `notifications:write` | Delete notification |

### User Settings (`/settings`)

| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| GET | `/settings/:user_id` | `settings:read` | Get settings (auto-creates defaults) |
| PUT | `/settings/:user_id` | `settings:write` | Update settings |
| POST | `/settings/:user_id/line/connect` | `settings:write` | Connect LINE Notify token |
| DELETE | `/settings/:user_id/line/disconnect` | `settings:write` | Disconnect LINE |
| POST | `/settings/:user_id/line/test` | `settings:write` | Send test LINE message |

### Weather (`/weather`)

| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| GET | `/weather` | `weather:read` | All cached weather data |
| GET | `/weather/:city` | `weather:read` | Weather by city (cached 1h) |

### Menus (`/menus`)

| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| GET | `/menus/accessible` | Auth (any) | User's accessible menus (hierarchy) |
| GET | `/menus` | `menus:read` | List all menus |
| POST | `/menus` | `menus:write` | Create menu |
| GET | `/menus/:id` | `menus:read` | Get menu |
| PUT | `/menus/:id` | `menus:write` | Update menu |
| DELETE | `/menus/:id` | `menus:delete` | Soft-delete menu |

### Device Logs (`/device-logs`)

| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| GET | `/device-logs/:device_id` | `device_logs:read` | Device event logs |
| GET | `/device-logs/:device_id/online-history` | `device_logs:read` | Online/offline history |

### Audit Logs (`/audit-logs`)

| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| GET | `/audit-logs` | `audit_logs:read` | Query audit logs (filterable) |
| GET | `/audit-logs/:resource_type/:resource_id` | `audit_logs:read` | Logs by resource |

### Admin (`/admin`)

All routes require admin role.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/users` | List users (search + pagination) |
| GET | `/admin/users/:id` | Get user + permissions |
| PUT | `/admin/users/:id/role` | Update user role |
| GET | `/admin/users/:id/permissions` | Get user permissions |
| PUT | `/admin/users/:id/permissions` | Update user permissions |
| GET | `/admin/users/:id/menus` | Get user menu assignments |
| PUT | `/admin/users/:id/menus` | Update user menu assignments |
| GET | `/admin/permissions` | Permission group definitions |
| GET | `/admin/menus` | All active menus |

### Health Check

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Returns `{ status: 'ok' }` |

---

## Architecture

### Automation System

```
Sensor Data (MQTT) → mqttHandler → ruleEngine → actionExecutor → MQTT/Notification/Log
                                                      ↑
Cron Timer → scheduleEngine ─────────────────────────┘
```

- **Rule Engine**: Evaluates conditions with AND/OR logic groups when sensor data arrives
- **Schedule Engine**: Runs cron jobs with timezone support, auto-deactivates expired schedules
- **Action Executor**: Shared execution layer with MQTT topic injection prevention (`/^[a-zA-Z0-9_-]+$/` device_id validation)

### Condition Logic

Conditions are split into OR-separated groups. Within each group, AND logic applies:

```
[A(AND), B(OR), C(AND), D]
→ Group 1: [A, B] (all must be true)
→ Group 2: [C, D] (all must be true)
→ Result: Group1 OR Group2
```

### Recommendation Engine

Rule-based recommendations per farm type (default, greenhouse, hydroponic) with Thai language messages and severity levels (critical/warning/info).

---

## MQTT Topics

| Topic Pattern | Description |
|---------------|-------------|
| `device/+/temperature` | Temperature readings |
| `device/+/humidity` | Humidity readings |
| `device/+/light` | Light intensity readings |
| `device/+/soil` | Soil moisture readings |
| `device/+/checkin` | Device online heartbeat |
| `device/+/will` | Device offline (LWT) |
| `device/+/health` | Device health report (battery, RSSI, uptime, firmware) |

Command publishing: `request/{device_id}/{command}`

## Security Features

- **JWT Authentication** — access token (12h) + refresh token (7d)
- **RBAC Permissions** — 42 granular permissions across 18 groups; admin wildcard (`*`)
- **Per-user Menu Access** — dynamic navigation based on DB-driven menu assignments
- **Device Ownership** — middleware verifies user owns the device before data access
- **Ownership Checks** — all rule/schedule/farm/zone endpoints verify ownership (admin bypass)
- **MQTT Topic Injection Prevention** — device_id validated with regex before MQTT publish
- **Rate Limiting** — global (100 req/15min) + auth endpoints (10 req/15min)
- **Helmet** — secure HTTP headers
- **CORS** — configurable origin whitelist
- **Input Validation** — Joi schemas on all endpoints with `stripUnknown`
- **Audit Logging** — all mutations recorded with user, action, changes, IP
- **Soft Deletes** — data preserved with status flag (`A`/`D`)
- **TTL Indexes** — automatic cleanup: sensor data (90d), device logs (30d), execution logs (30d), audit logs (365d)
- **Notification Cooldown** — prevents threshold alert spam (configurable, default 5min)
- **LINE Quiet Hours** — respects user-defined do-not-disturb periods

## Configuration Constants

All configurable values are centralized in `src/config/index.js`:

| Constant | Default | Description |
|----------|---------|-------------|
| `NOTIFICATION_COOLDOWN_MS` | 5 min | Threshold notification cooldown |
| `LINE_NOTIFY_URL` | LINE API | LINE Notify endpoint |
| `LINE_NOTIFY_TIMEOUT_MS` | 10s | LINE API timeout |
| `DEFAULT_TIMEZONE` | Asia/Bangkok | Default timezone for schedules |
| `TREND_THRESHOLD_PERCENT` | 5% | Analytics trend detection threshold |
| `EXPORT.maxDays` | 31 | Max export date range |
| `EXPORT.maxRows` | 100,000 | Max export rows per request |
| `sensorDataTTL` | 90 days | Sensor data auto-delete |
| `weatherCacheTTL` | 1 hour | Weather API cache duration |

## Migration Scripts

```bash
# Seed menu data and assign to existing users
node src/scripts/migrateMenus.js

# Migrate user roles and create permission documents
node src/scripts/migrateRoles.js

# Seed sample data (development only — clears existing data)
node src/scripts/seedSampleData.js
```

All migration scripts are idempotent (safe to run multiple times).

## Deployment

### Vercel (Serverless)

The API supports Vercel serverless deployment with lazy database connection and lazy-loaded MQTT/Socket.IO (skipped in serverless mode).

### Local / VPS

```bash
NODE_ENV=production npm run serve
```

Starts HTTP server + Socket.IO + MQTT client + cron scheduler. Graceful shutdown stops all cron jobs and disconnects cleanly.
