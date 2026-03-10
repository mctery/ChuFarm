# SmartFarm App - CLAUDE.md

> React frontend for SmartFarm IoT platform
> Version: 3.0.0 | React 19 + MUI 7 + Vite 6

## Quick Reference

```bash
npm run dev       # Development (Vite, port 5173)
npm run build     # Production build (drops console/debugger)
npm run lint      # ESLint
npm run preview   # Preview production build
```

## Deployment (fly.io)

- **URL:** https://chufarm-app.fly.dev
- Multi-stage Docker: Node 20 build → nginx 1.27 serve
- Region: Singapore (`sin`), 256MB RAM
- `VITE_API` baked-in at build time via `[build.args]` in [fly.toml](fly.toml)

```bash
# Deploy
cd app && fly deploy --ha=false

# Update API URL (triggers rebuild)
# Edit fly.toml → [build.args] VITE_API = "..."
# then fly deploy --ha=false
```

## Tech Stack

- **Framework:** React 19 (functional components + hooks only)
- **UI Library:** MUI 7 (Material UI) + Emotion CSS-in-JS
- **Build:** Vite 6
- **Routing:** React Router 7 (lazy-loaded pages)
- **HTTP Client:** Axios 1.9 (with interceptors)
- **Real-time:** Socket.IO Client 4.7
- **Charts:** MUI X-Charts 8
- **Dashboard Widgets:** GridStack 12 (drag & drop)
- **Layout:** Toolpad Core 0.14 (DashboardLayout)
- **Notifications:** Notistack 3 (snackbar toasts)
- **Animations:** React Spring 10
- **Language:** Thai (ภาษาไทย) as primary UI language

## Project Structure

```
src/
├── main.jsx                   # Entry: router + lazy imports (25 pages)
├── App.jsx                    # Root: theme provider, navigation, context
├── theme.js                   # MUI theme (light/dark, Thai fonts, green primary)
├── layouts/
│   └── DashboardLayout.jsx    # Toolpad layout: notifications bell, profile menu
├── pages/
│   ├── auth/                  # login, register, forgot-password, reset-password
│   ├── farm/                  # FarmControlDevices, FarmGridStackOverview,
│   │                          # SensorHistoryPage, ThresholdsPage,
│   │                          # AutomationRulesPage, SchedulesPage
│   ├── admin/                 # 9 admin pages (all use AdminPageWrapper)
│   ├── DashboardPage.jsx      # Main dashboard (stats, weather, notifications)
│   ├── NotificationsPage.jsx  # Notification center
│   ├── SettingsPage.jsx       # User settings (profile, password, notifications, Telegram)
│   └── ...                    # About, Help, PageNotFound
├── components/
│   ├── GridStack/             # Widget dashboard (MqttContext, sensor widgets)
│   │   ├── context/           # MqttProvider for real-time data
│   │   └── sensors/           # GenericSensor, SensorCard, hooks
│   ├── admin/                 # AdminPageWrapper, AdminDataTable, AdminFilterBar,
│   │                          # AdminSearchBar, BulkActionBar, ExportButton, StatCard
│   ├── AuthLayout.jsx         # Auth page container
│   ├── BoxLoading.jsx         # Spinner/loading component
│   ├── DeviceWidget.jsx       # Device card (compact layout with action bar)
│   ├── DeviceFormDialog.jsx   # Device CRUD dialog
│   ├── DialogConfirm.jsx      # Confirmation modal
│   ├── ListButtonMenu.jsx     # List button menu component
│   └── ErrorBoundary.jsx      # Error boundary
├── services/
│   ├── apiClient.js           # Axios: base URL, token, refresh, retry
│   ├── auth_service.js        # Login, register, password reset
│   ├── storage_service.js     # localStorage: tokens, user info
│   ├── device_service.js      # Device CRUD
│   ├── sensor_service.js      # Sensor data + aggregation
│   ├── socket_service.jsx     # Socket.IO connection + subscriptions
│   ├── menu_service.jsx       # Dynamic nav menus from DB
│   ├── permission_service.js  # RBAC: isAdmin, hasPermission
│   ├── widget_service.js      # GridStack layout persistence
│   └── global_variable.jsx    # Constants: sensor types, device status, etc.
├── constants/
│   └── routes.js              # Route path constants
└── utils/
    ├── validation.js          # Form validation (Thai error messages)
    └── csvExport.js           # CSV export with UTF-8 BOM
```

## Environment

```env
VITE_API="http://localhost:3000"   # Backend API URL
```

Access via `import.meta.env.VITE_API` in code.

## Architecture

### State Management
- **No Redux.** Uses React Context + localStorage + component state
- Theme mode: `ThemeContext` in App.jsx (persisted in localStorage `theme-mode`)
- Auth: Tokens + user info in localStorage
- Real-time: `MqttProvider` context inside GridStack widgets
- Navigation: Dynamic menus from DB, rebuilt on `menus-updated` window event

### Authentication Flow
```
Login → POST /api/users/login → Store tokens in localStorage
  → Store user_info (role, permissions, menus)
  → Fire 'menus-updated' event → Navigation rebuilds
  → Redirect to /dashboard

Token Refresh (automatic):
  401 response → POST /api/users/refresh with refresh_token
  → Queue concurrent requests → Retry with new token
  → If refresh fails → forceLogout() (clear storage + redirect /)
```

### Real-time Data Flow
```
Socket.IO connect (with auth token) → Join device rooms
  → Subscribe to 'device/{deviceId}/{sensorType}'
  → MqttProvider receives data → useSensorValue() hook updates UI
  → Animated number transitions via React Spring
```

### API Client (apiClient.js)
- Base URL: `VITE_API` env var
- 15s timeout
- Request interceptor: Adds `Authorization: Bearer {token}`
- Response interceptors:
  - 401 → Token refresh with queue
  - 403 → Permission denied logging
  - 5xx → Auto-retry once
- `makeRequest(fn, {fallback, label})` wrapper for try/catch elimination

## Key Patterns

### Page Pattern
```jsx
export default function ExamplePage() {
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);

  const fetchData = useCallback(async () => {
    try {
      const { data } = await apiClient.get('/api/...');
      setData(data.data || []);
    } catch {
      enqueueSnackbar("โหลดข้อมูลไม่สำเร็จ", { variant: "error" });
    }
  }, []);

  useEffect(() => { fetchData().then(() => setLoading(false)); }, [fetchData]);

  if (loading) return <BoxLoading />;
  return ( /* MUI components */ );
}
```

### Form Pattern
- Local state: `useState({})` for form + `useState({})` for errors
- Controlled inputs with `onChange` handler
- `validateForm()` before submit (Thai error messages)
- Loading state on submit button
- Success/error via `enqueueSnackbar()`

### Dialog Pattern
- State: `{ open: boolean, item: object|null }` (null = create, object = edit)
- Form mirrors initial data when opening edit
- Close on save success, keep open on error

### Admin Page Pattern
- Wrapped in `AdminPageWrapper` (permission gated, shows error if not admin)
- Reusable `AdminDataTable` with pagination
- Search + filter bar, bulk actions, CSV export

### MUI v7 Conventions
- Use `slotProps.input` instead of deprecated `InputProps`
- Use `<DialogContent dividers>` instead of `sx={{ pt: "16px !important" }}`
- Grid uses `size={{ xs: 12, sm: 6 }}` prop (not `item xs={12} sm={6}`)

## Routes (25 pages)

### Auth (no layout)
| Path | Component |
|------|-----------|
| `/` | LoginPage |
| `/register` | RegisterPage |
| `/forgot-password` | ForgotPasswordPage |
| `/reset-password` | ResetPasswordPage |

### Protected (DashboardLayout)
| Path | Component |
|------|-----------|
| `/dashboard` | DashboardPage |
| `/notifications` | NotificationsPage |
| `/settings` | SettingsPage |
| `/farm_control_system/devices` | FarmControlDevices |
| `/farm_control_system/devices/gridstack/:deviceId` | FarmGridStackOverview |
| `/farm_control_system/devices/history/:deviceId` | SensorHistoryPage |
| `/farm_control_system/thresholds` | ThresholdsPage |
| `/farm_control_system/automation-rules` | AutomationRulesPage |
| `/farm_control_system/schedules` | SchedulesPage |

### Admin (DashboardLayout + AdminPageWrapper)
| Path | Component |
|------|-----------|
| `/admin/dashboard` | AdminDashboardPage |
| `/admin/users` | AdminUsersPage |
| `/admin/devices` | AdminDevicesPage |
| `/admin/sensors` | AdminSensorsPage |
| `/admin/audit-logs` | AdminAuditLogsPage |
| `/admin/device-logs` | AdminDeviceLogsPage |
| `/admin/notifications` | AdminNotificationsPage |
| `/admin/menus` | AdminMenusPage |
| `/admin/settings` | AdminSettingsPage |

## Service Functions → API Mapping

### auth_service.js
| Function | Method | Endpoint |
|----------|--------|----------|
| `SysLogin(email, password)` | POST | `/api/users/login` |
| `SysRegister(first, last, email, pwd)` | POST | `/api/users/register` |
| `SysForgotPassword(email)` | POST | `/api/users/forgot-password` |
| `SysResetPassword(token, pwd)` | POST | `/api/users/reset-password` |
| `SysCheckToken()` | POST | `/api/users/token` |

### device_service.js
| Function | Method | Endpoint |
|----------|--------|----------|
| `SysGetDevices()` | GET | `/api/devices` |
| `SysGetDevicesPaginated(page, limit)` | GET | `/api/devices?page&limit` |
| `SysGetDeviceById(id)` | GET | `/api/devices/{id}` |
| `SysCreateDevice(payload)` | POST | `/api/devices` |
| `SysUpdateDevice(id, payload)` | PUT | `/api/devices/{id}` |
| `SysDeleteDevice(id)` | DELETE | `/api/devices/{id}` |

### sensor_service.js
| Function | Method | Endpoint |
|----------|--------|----------|
| `SysGetDeviceSensorsById(deviceId)` | GET | `/api/sensors/device/{id}` |
| `SysCreateSensor(payload)` | POST | `/api/sensors/` |
| `SysUpdateDeviceSensors(id, payload)` | PUT | `/api/sensors/{id}` |
| `SysDeleteSensor(id)` | DELETE | `/api/sensors/{id}` |
| `SysGetSensorDataAggregate(...)` | POST | `/api/sensorsdata/aggregate` |
| `SysGetLatestSensorData(deviceId)` | GET | `/api/sensorsdata/latest/{id}` |

## Theme

- **Primary:** #2E7D5F (farm green)
- **Secondary:** #FF8F00 (orange)
- **Font:** Noto Sans Thai + Roboto
- **Border radius:** 12px default
- **Dark mode:** Toggle via localStorage `theme-mode`
- `responsiveFontSizes()` enabled

## Key Constants (global_variable.jsx)

```javascript
SENSORS_TYPE     // temperature, humidity, light, soil (with icons, units)
DEVICE_STATUS    // ONLINE, OFFLINE, MAINTENANCE
GRID_CONFIG      // 5 cols, 200px cells, 5px margin
PAGINATION       // DEVICES_PER_PAGE: 12
VALIDATION       // minPasswordLength: 8
RSSI_THRESHOLD   // GOOD: -40, MEDIUM: -70, BAD: -90
```

## Navigation (Dynamic Menus)

Menus are fetched from DB at login, stored in `user_info.menus`.
`menu_service.jsx` converts DB structure to Toolpad navigation format.
Admin menus separated by dividers. Icons mapped via `ICON_MAP`.
Menu management via `/admin/menus` page.

## Coding Conventions

- All pages lazy-loaded via `React.lazy()` with `SuspenseWrapper`
- Thai language UI (all user-facing strings in Thai)
- `useCallback` for fetch functions, `useMemo` for filtered/derived data
- Image upload: compressed client-side (max 0.2MB, 720px) via `browser-image-compression`
- CSV export: UTF-8 BOM prefix for Thai character support
- Socket.IO: auto-reconnect with exponential backoff
- Error boundary wraps the app for graceful crash handling

## Backend API Companion

- **Repo:** SmartFarm-vite-api (same parent directory)
- **See:** `CLAUDE.md` in API repo for full endpoint docs
- **Default API URL:** `http://localhost:3000`
- **Response format:** `{ message: 'OK', data: ..., pagination?: {...} }`
