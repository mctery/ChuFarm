# SmartFarm API - CLAUDE.md

> REST API backend for SmartFarm IoT platform
> Version: 3.0.0 | Node.js + Express + MongoDB + MQTT

## Quick Reference

```bash
yarn dev          # Development (nodemon)
yarn start        # Production
yarn test         # Run tests
yarn lint         # ESLint
yarn lint:fix     # ESLint auto-fix
yarn format       # Prettier
```

## Tech Stack

- **Runtime:** Node.js + Express 4
- **Database:** MongoDB + Mongoose 6
- **Auth:** JWT (access 12h + refresh 7d) + bcrypt
- **Real-time:** MQTT 5 (IoT sensors) + Socket.IO 4 (WebSocket push)
- **Validation:** Joi 18
- **Logging:** Winston 3
- **Security:** Helmet 8, express-rate-limit 8, CORS
- **Scheduling:** node-cron 4
- **Email:** Resend API
- **Notifications:** Telegram Bot API
- **Deploy:** Vercel (serverless) or VPS (full features)

## Project Structure

```
server.js                    # Entry point (requires src/app.js)
src/
├── app.js                   # Express app, HTTP server, MQTT, Socket.IO setup
├── config/
│   ├── index.js             # Central config (env vars + constants)
│   ├── logger.js            # Winston logger
│   ├── mqtt.js              # MQTT client factory
│   ├── socketio.js          # Socket.IO with JWT auth
│   ├── permissions.js       # RBAC definitions (42 permissions, 17 groups)
│   └── startup.js           # Env validation
├── controllers/             # 20 controllers (request handlers)
├── middleware/
│   ├── authorization.js     # JWT verification (sets req.User_name)
│   ├── checkPermission.js   # RBAC check (admin bypass)
│   ├── ownershipCheck.js    # Device ownership verification
│   ├── validate.js          # Joi validation
│   ├── auditLogger.js       # Mutation audit trail
│   ├── requestLogger.js     # HTTP request logging
│   └── errorMiddleware.js   # Global error handler
├── models/                  # 19 Mongoose models
├── routes/                  # 20 route files
├── services/
│   ├── ruleEngine.js        # Automation rule evaluation (AND/OR logic)
│   ├── scheduleEngine.js    # Cron scheduling (node-cron)
│   ├── actionExecutor.js    # MQTT commands + notifications
│   ├── mqttHandler.js       # Sensor data ingestion + threshold checks
│   ├── telegramService.js   # Telegram Bot API (link, notify, webhook)
│   ├── emailService.js      # Password reset emails (Resend)
│   └── recommendationEngine.js  # Farm-type recommendations (Thai)
├── validations/             # 14 Joi schema files
├── utils/
│   ├── errors.js            # notFound(), checkOwner(), findAndAuthorize()
│   ├── getUserId.js         # user_id helper
│   └── pagination.js        # Pagination utilities
└── scripts/
    ├── migrateRoles.js      # Assign admin role to existing users
    ├── migrateMenus.js      # Seed menu data
    ├── migrateSensorValues.js  # Convert string sensor values to numbers
    └── seedSampleData.js    # Sample data seeder
```

## Environment Variables

```env
# Required
TOKEN_KEY="jwt-secret"
MONGO_URL="mongodb+srv://..."

# Recommended
NODE_ENV="development"
PORT=3000
FRONTEND="http://localhost:5173"      # CORS origin
MQTT_URL="mqtt://broker.emqx.io:1883"
OPEN_WEATHER_KEY="openweathermap-key"

# Optional
JWT_EXPIRY="12h"
REFRESH_TOKEN_KEY="refresh-secret"    # defaults to TOKEN_KEY + '_refresh'
REFRESH_EXPIRY="7d"
MQTT_USER=""
MQTT_PASS=""
RESEND_API_KEY=""                     # Email service
RESEND_FROM="SmartFarm <onboarding@resend.dev>"
APP_URL="http://localhost:5173"       # Reset password link base URL
```

## Architecture

### Request Flow
```
Client → Rate Limit → Helmet → CORS → JSON Parser
  → requestLogger → verifyToken (JWT) → checkPermission (RBAC)
  → validate (Joi) → checkDeviceOwnership → Controller
  → auditLogger (mutations) → Response
```

### Real-time Data Flow
```
IoT Device → MQTT Broker → mqttHandler
  → SensorData (MongoDB)
  → Socket.IO emit (to device rooms)
  → checkThresholds → Notification + Telegram
  → processRules (ruleEngine) → actionExecutor → MQTT/Notification/Log

Cron Timer → scheduleEngine → actionExecutor
```

### MQTT Topics
Subscription uses wildcard `device/+/+` — any sensor type is supported dynamically.
Reserved subtopics (checkin, will, health) are routed to dedicated handlers.

| Topic Pattern | Direction | Purpose |
|---|---|---|
| `device/+/{any_sensor_type}` | Device → Server | Sensor data (dynamic — temperature, humidity, pH, CO2, etc.) |
| `device/+/checkin` | Device → Server | Heartbeat (online) — reserved |
| `device/+/will` | Device → Server | LWT (offline) — reserved |
| `device/+/health` | Device → Server | Battery, RSSI, firmware, uptime — reserved |
| `request/{device_id}/{command}` | Server → Device | Commands |

### MQTT Payload Format
```json
// Sensor data: device/{id}/{type}
{ "device_id": "esp32_001", "v": { "sensor1": 25.5, "sensor2": 30.0 } }
// Short form also accepted: { "d": "esp32_001", "v": { ... } }

// Health: device/{id}/health
{ "battery": 85, "rssi": -65, "firmware": "1.2.0", "uptime": 3600 }
```

## Authentication & Authorization

### JWT Token Structure
```javascript
// Access token payload (decoded from req.User_name)
{
  userId: "string",    // User._id or user_id
  email: "string",
  role: "admin" | "user",
  permissions: ["devices:read", "devices:write", ...],  // or ["*"] for admin
}
```

### Middleware Chain Pattern
```javascript
// Standard CRUD route pattern:
router.get('/', verifyToken, checkPermission('resource:read'), controller);
router.post('/', verifyToken, checkPermission('resource:write'), validate(schema), controller);
router.put('/:id', verifyToken, checkPermission('resource:write'), validate(schema), controller);
router.delete('/:id', verifyToken, checkPermission('resource:delete'), controller);

// With device ownership check:
router.get('/:device_id', verifyToken, checkPermission('sensor_data:read'), checkDeviceOwnership('params'), controller);

// Self-or-admin pattern:
router.get('/:user_id', verifyToken, checkPermission('settings:read'), checkSelfOrAdmin(), controller);

// Admin-only:
router.use(verifyToken, requireAdmin);
```

### Permission Strings (42 total)
```
dashboard:read
devices:read, devices:write, devices:delete, devices:command
sensors:read, sensors:write, sensors:delete
sensor_data:read, sensor_data:write
widgets:read, widgets:write, widgets:delete
thresholds:read, thresholds:write, thresholds:delete
notifications:read, notifications:write
weather:read
device_logs:read
audit_logs:read
menus:read, menus:write, menus:delete
users:read, users:write, users:delete
settings:read, settings:write
rules:read, rules:write, rules:delete
schedules:read, schedules:write, schedules:delete
farms:read, farms:write, farms:delete
zones:read, zones:write, zones:delete
admin:access
```

Admin users (`role: 'admin'` or `permissions: ['*']`) bypass all permission checks.

## Database Models (19)

### Core Models
| Model | Collection | TTL | Key Fields |
|---|---|---|---|
| User | users | - | email (unique), password, role (admin/user), status |
| Device | devices | - | device_id (unique), user_id, farm_id?, zone_id?, online_status, health fields |
| Sensor | sensors | - | device_id, sensor_type, sensor_id, unit, min, max |
| SensorData | sensordatas | 90d | device_id, sensor_id, sensor, value (Number) |
| SensorWidget | sensorwidgets | - | device_id, widget_json |
| SensorThreshold | sensorthresholds | - | device_id, sensor_id, user_id, min_value, max_value |

### Organization
| Model | Collection | Key Fields |
|---|---|---|
| Farm | farms | user_id, name, farm_type (greenhouse/openfield/indoor/hydroponic/other), location |
| Zone | zones | farm_id (ref), name, zone_type (greenhouse/field/nursery/storage/other), crop_type |
| DeviceProfile | deviceprofiles | name, expected_sensors[], default_thresholds[], checkin_interval |

### Automation
| Model | Collection | TTL | Key Fields |
|---|---|---|---|
| AutomationRule | automationrules | - | user_id, conditions[] (AND/OR logic), actions[], cooldown_seconds |
| Schedule | schedules | - | user_id, cron_expression, timezone, actions[], start_date, end_date |
| RuleExecutionLog | ruleexecutionlogs | 30d | rule_id, trigger_type (rule/schedule), status, duration_ms |

### System
| Model | Collection | TTL | Key Fields |
|---|---|---|---|
| Notification | notifications | - | user_id, type (threshold_alert/device_offline/device_online/system), severity |
| DeviceLog | devicelogs | 30d | device_id, event (online/offline/command_sent/command_ack) |
| AuditLog | auditlogs | 365d | user_id, action, resource_type, changes, ip_address |
| Permission | permissions | - | user_id (unique), permissions[] |
| Menu | menus | - | key (unique), name, path, parent_id (2-level hierarchy) |
| UserMenu | usermenus | - | user_id (unique), menu_ids[] (ref Menu) |
| UserSetting | usersettings | - | user_id (unique), timezone, language, notification prefs, telegram_chat_id, quiet_hours |

### Conventions
- **Soft deletes:** `status: 'A'` (active) / `'D'` (deleted) — never hard delete
- **Timestamps:** All models use `{ timestamps: true }` (createdAt, updatedAt)
- **User reference:** `user_id` stored as String (not ObjectId ref)
- **Device reference:** `device_id` stored as String (matches Device.device_id)

## API Endpoints

### Auth (no token required)
```
POST /api/users/login          # Login → { token, refreshToken }
POST /api/users/register       # Register
POST /api/users/refresh        # Refresh token
POST /api/users/token          # Verify/decode token
POST /api/users/forgot-password
POST /api/users/reset-password
```

### Users
```
GET    /api/users              # List users (users:read)
GET    /api/users/me           # Own profile
PUT    /api/users/me           # Update own profile
GET    /api/users/:id          # Get user (users:read)
PUT    /api/users/:id          # Update user (users:write)
DELETE /api/users/:id          # Soft-delete (users:delete)
```

### Devices
```
GET    /api/devices                # List (paginated)
POST   /api/devices                # Create
GET    /api/devices/user/:user_id  # User's devices
GET    /api/devices/:id            # Get device
PUT    /api/devices/:id            # Update
DELETE /api/devices/:id            # Soft-delete
GET    /api/devices/:id/health     # Health + recent logs
POST   /api/devices/:id/commands   # Send MQTT command (ownership check)
```

### Sensors
```
GET    /api/sensors                      # List all
POST   /api/sensors                      # Create (ownership check)
GET    /api/sensors/device/:id           # By device (ownership check)
GET    /api/sensors/device/type/:id/:type # By device+type (ownership check)
GET    /api/sensors/:id                  # Get sensor
PUT    /api/sensors/:id                  # Update
DELETE /api/sensors/:id                  # Soft-delete
```

### Sensor Data
```
POST /api/sensorsdata/find       # Query (body: device_id, sensor, page, limit)
POST /api/sensorsdata/range      # By date range
POST /api/sensorsdata/create     # Bulk insert
POST /api/sensorsdata/aggregate  # Aggregated stats (avg/min/max, groupBy: day/hour)
GET  /api/sensorsdata/latest/:deviceId  # Latest values per sensor
```

### Automation Rules
```
GET    /api/rules              # List user's rules
POST   /api/rules              # Create rule
GET    /api/rules/:id          # Get rule (ownership check)
PUT    /api/rules/:id          # Update (ownership check)
DELETE /api/rules/:id          # Soft-delete (ownership check)
POST   /api/rules/:id/toggle   # Enable/disable (ownership check)
POST   /api/rules/:id/test     # Dry-run test (ownership check)
GET    /api/rules/:id/logs     # Execution logs (ownership check)
```

### Schedules
```
GET    /api/schedules              # List user's schedules
POST   /api/schedules              # Create (cron-based)
GET    /api/schedules/:id          # Get (ownership check)
PUT    /api/schedules/:id          # Update (ownership check)
DELETE /api/schedules/:id          # Soft-delete + stop cron (ownership check)
POST   /api/schedules/:id/toggle   # Enable/disable + start/stop cron
GET    /api/schedules/:id/logs     # Execution logs
```

### Farms & Zones
```
GET    /api/farms                  # List (admin: ?all=true)
POST   /api/farms                  # Create
GET    /api/farms/:id              # Get + zones (ownership check)
PUT    /api/farms/:id              # Update (ownership check)
DELETE /api/farms/:id              # Soft-delete + cascade zones
GET    /api/farms/:id/stats        # Summary stats
GET    /api/farms/:farm_id/zones   # List zones
POST   /api/farms/:farm_id/zones   # Create zone

GET    /api/zones/:id              # Get zone + devices
PUT    /api/zones/:id              # Update (ownership check)
DELETE /api/zones/:id              # Soft-delete
```

### Export & Analytics
```
GET /api/export/sensors/:device_id         # CSV export
GET /api/export/sensors/:device_id/json    # JSON export
GET /api/export/report/daily/:device_id    # Daily summary
GET /api/export/report/weekly/:device_id   # Weekly summary
# Query: start_date, end_date (required, max 31 days), sensor_type?, sensor_id?

GET /api/analytics/summary/:device_id          # Period stats (daily/weekly/monthly)
GET /api/analytics/trend/:device_id            # Trend detection
GET /api/analytics/compare?device_ids=a,b      # Compare devices
GET /api/analytics/recommendations/:device_id  # Farm-type recommendations
```

### Notifications & Settings
```
GET    /api/notifications/user/:user_id              # List
GET    /api/notifications/user/:user_id/unread-count # Unread count
PUT    /api/notifications/:id/read                   # Mark read
PUT    /api/notifications/user/:user_id/read-all     # Mark all read
DELETE /api/notifications/:id                        # Delete

GET    /api/settings/:user_id                     # Get (auto-creates defaults)
PUT    /api/settings/:user_id                     # Update
POST   /api/settings/:user_id/telegram/link       # Generate link code (6-char, 10min)
DELETE /api/settings/:user_id/telegram/link       # Unlink Telegram
GET    /api/settings/:user_id/telegram/status     # Check link status
```

### Admin (require admin role)
```
GET    /api/admin/stats                      # Platform statistics
GET    /api/admin/system-info                # System info
GET    /api/admin/users                      # List users (search + pagination)
GET    /api/admin/users/:id                  # Get user + permissions
PUT    /api/admin/users/:id/role             # Update role
GET    /api/admin/users/:id/permissions      # Get permissions
PUT    /api/admin/users/:id/permissions      # Update permissions
GET    /api/admin/users/:id/menus            # Get menu assignments
PUT    /api/admin/users/:id/menus            # Update menus
PUT    /api/admin/users/bulk-role            # Bulk role update
DELETE /api/admin/users/bulk-delete          # Bulk delete users
GET    /api/admin/devices                    # List all devices
PUT    /api/admin/devices/:id               # Update device
DELETE /api/admin/devices/:id               # Delete device
DELETE /api/admin/devices/bulk-delete        # Bulk delete devices
GET    /api/admin/sensors                    # List all sensors
PUT    /api/admin/sensors/:id               # Update sensor
DELETE /api/admin/sensors/:id               # Delete sensor
GET    /api/admin/device-logs               # List all device logs
GET    /api/admin/notifications              # List all notifications
POST   /api/admin/notifications              # Create system notification
GET    /api/admin/permissions                # Permission definitions
GET    /api/admin/menus                      # All menus
```

### Other
```
GET /api/weather              # All cached weather
GET /api/weather/:city        # Weather by city (cached 1h)
GET /api/menus/accessible     # User's menu tree
GET /api/device-logs/:device_id              # Device logs
GET /api/device-logs/:device_id/online-history
GET /api/audit-logs                          # Query audit logs
GET /api/audit-logs/:resource_type/:resource_id
GET /api/device-profiles      # CRUD for device profiles
GET /api/sensorWidget/:device_id  # CRUD for widget config
GET /health                   # Health check
```

## Key Constants (config/index.js)

```javascript
STATUS = { ACTIVE: 'A', DELETED: 'D' }
SENSOR_VALUE_RANGE = { min: -1000, max: 150000 }
DEFAULT_TIMEZONE = 'Asia/Bangkok'
NOTIFICATION_COOLDOWN_MS = 5 * 60 * 1000      // 5 min
TREND_THRESHOLD_PERCENT = 5
EXPORT = { maxDays: 31, maxRows: 100000 }
QUERY_LIMITS = { default: 20, auditLogs: 50, deviceLogs: 50, onlineHistory: 100 }
bcryptRounds = 10
rateLimitWindowMs = 15 * 60 * 1000             // 15 min
rateLimitMax = 100
authRateLimitMax = 10

// Centralized enums (ENUMS object)
ENUMS.ROLES           // ['admin', 'user']
ENUMS.FARM_TYPES      // ['greenhouse', 'openfield', 'indoor', 'hydroponic', 'other']
ENUMS.ZONE_TYPES      // ['greenhouse', 'field', 'nursery', 'storage', 'other']
ENUMS.NOTIFICATION_TYPES  // ['threshold_alert', 'device_offline', 'device_online', 'system']
ENUMS.SEVERITY        // ['info', 'warning', 'critical']
ENUMS.OPERATORS       // ['gt', 'gte', 'lt', 'lte', 'eq', 'neq', 'between']
ENUMS.ACTION_TYPES    // ['device_command', 'send_notification', 'log_event']
// ... and more (see config/index.js for full list)
```

## Coding Conventions

- **Async handlers:** Always wrap with `express-async-handler`
- **Validation:** Joi schemas with `stripUnknown: true` — validate before controller
- **Error responses:** `res.status(4xx); throw new Error('message');`
- **Success responses:** `res.json({ message: 'OK', data: ... })`
- **Pagination:** `{ page, limit }` in query/body → `{ data, pagination: { page, limit, total, totalPages } }`
- **Soft delete:** Set `status: 'D'`, never hard delete
- **Ownership:** Use `findAndAuthorize(res, req, Model, id, { name })` from `utils/errors.js`
- **Not found:** Use `notFound(res, resource, 'Name')` from `utils/errors.js`
- **Audit:** Use `auditLog(action, resourceType)` middleware on mutations
- **Device ID validation:** Regex `^[a-zA-Z0-9_-]+$` to prevent MQTT topic injection
- **Enums:** Use `ENUMS` from config — single source of truth for model enums

## Socket.IO Events

```javascript
// Client → Server
'refresh-rooms'  // Re-join device rooms after device CRUD

// Server → Client (emitted to room `device:{device_id}`)
sensorType       // e.g., 'temperature', 'humidity' — sensor data payload
'device_status'  // { device_id, online_status, last_seen }
'device_health'  // { device_id, battery_level, signal_strength, ... }
```

## Deployment

### Vercel (Serverless)
- Lazy DB connection on first request
- MQTT/Socket.IO/Cron disabled (HTTP-only)
- Config: `vercel.json` routes all to `server.js`

### VPS (Full Features)
- HTTP + Socket.IO + MQTT + Cron all active
- Graceful shutdown: stops cron, closes connections
- `NODE_ENV=production yarn start`

## Frontend Companion

- **Repo:** SmartFarm-vite-app (React 19 + MUI 7 + Vite 6)
- **Default CORS origin:** `http://localhost:5173`
- See `REDESIGN_ROADMAP.md` in frontend repo for UI status
