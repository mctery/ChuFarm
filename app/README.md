# SmartFarm App

Frontend สำหรับระบบ Smart Farm — Dashboard สำหรับจัดการอุปกรณ์ IoT, ดูข้อมูลเซ็นเซอร์แบบ real-time ผ่าน Socket.IO, วิเคราะห์ข้อมูลย้อนหลัง, ระบบ Widget แบบลากวาง และระบบเมนู Dynamic ตาม RBAC

## Tech Stack

| เทคโนโลยี | เวอร์ชัน | หน้าที่ |
|-----------|---------|--------|
| React | 19 | UI library |
| Vite | 6.3 | Build tool |
| React Router | 7.6 | Routing |
| MUI (Material-UI) | 7.x | UI components |
| MUI X-Charts | 8.x | Charts (LineChart, Gauge) |
| Toolpad Core | 0.14 | DashboardLayout |
| GridStack | 12.2 | Draggable widget grid |
| Socket.IO Client | 4.7 | Real-time sensor data via API bridge |
| Axios | 1.9 | HTTP client |
| React Spring | 10.x | Animations |
| notistack | 3.x | Snackbar notifications |

## Project Structure

```
src/
├── App.jsx                     # Root component + theme provider
├── main.jsx                    # Entry point + lazy routing
├── theme.js                    # MUI theme (light/dark)
├── components/
│   ├── ErrorBoundary.jsx       # Error catch + fallback UI
│   ├── AuthLayout.jsx          # Login/register wrapper
│   ├── BoxLoading.jsx          # Loading spinner
│   ├── DaialogConfirm.jsx      # Confirmation dialog
│   ├── DeviceWidget.jsx        # Device card + Socket.IO status
│   ├── DeviceFormDialog.jsx    # Device form (modal/drawer)
│   ├── ListButtonMenu.jsx      # Dropdown menu
│   └── GridStack/
│       ├── GridStackWidgetCore.jsx    # Widget renderer
│       ├── DrawerWidgetManager.jsx    # Sensor/widget manager drawer
│       ├── WidgetLiveWather.jsx       # Weather widget
│       ├── WidgetBoxLoading.jsx       # Widget loading state
│       ├── context/
│       │   ├── MqttContext.jsx        # Real-time data context
│       │   └── MqttProvider.jsx       # Socket.IO subscription provider
│       └── sensors/
│           ├── GenericSensor.jsx      # Sensor wrapper
│           ├── components/
│           │   ├── SensorCard.jsx     # Gauge widget (animated)
│           │   └── SensorFrame.jsx    # Gradient background
│           ├── hooks/
│           │   ├── useSensorValue.jsx # Read real-time sensor value
│           │   └── useAnimatedNumber.jsx # Smooth number transition
│           └── utils/
│               └── number.jsx         # Number formatting
├── pages/
│   ├── _router.jsx             # Re-exports getNavigation from menu_service
│   ├── DashboardPage.jsx       # Home dashboard + stats
│   ├── AboutPage.jsx           # About page
│   ├── HelpPage.jsx            # FAQ page
│   ├── PageNotFound.jsx        # 404 page
│   ├── auth/
│   │   ├── login.jsx           # Login form
│   │   └── register.jsx        # Register form
│   ├── farm/
│   │   ├── FarmControlDevices.jsx     # Device list (paginated)
│   │   ├── FarmGridStackOverview.jsx  # Widget dashboard
│   │   └── SensorHistoryPage.jsx      # Sensor history charts
│   └── admin/
│       └── AdminUsersPage.jsx         # User management (admin)
├── services/
│   ├── apiClient.js            # Axios instance + interceptors
│   ├── auth_service.js         # Login/register/signout
│   ├── device_service.js       # Device CRUD + pagination
│   ├── sensor_service.js       # Sensor CRUD + aggregate
│   ├── widget_service.js       # Widget layout persistence
│   ├── menu_service.jsx        # Dynamic navigation from DB menus
│   ├── permission_service.js   # RBAC permission checks
│   ├── socket_service.jsx      # Socket.IO connect/subscribe/disconnect
│   ├── storage_service.js      # localStorage helpers
│   └── global_variable.jsx     # Constants + icons
├── constants/
│   └── routes.js               # Route path constants
├── layouts/
│   └── DashboardLayout.jsx     # Sidebar + toolbar + ErrorBoundary
└── assets/                     # Static images
.github/workflows/ci.yml        # GitHub Actions CI
```

## Getting Started

```bash
# 1. Clone & install
git clone <repo-url>
cd SmartFarm-vite-app
yarn install

# 2. Environment setup
cp .env.example .env
# แก้ไข .env

# 3. Run
yarn dev          # Dev server (port 5173)
yarn build        # Production build
yarn preview      # Preview build
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API` | Yes | API base URL (e.g. `http://localhost:3000`) — ใช้สำหรับทั้ง REST API และ Socket.IO |

## Pages & Routes

| Path | Page | Description |
|------|------|-------------|
| `/` | Login | Email + password login, auto-login with stored token |
| `/register` | Register | New user registration |
| `/dashboard` | Dashboard | Stats overview, welcome, quick actions |
| `/farm_control_system/devices` | Devices | Paginated device list (12/page), CRUD, real-time status |
| `/farm_control_system/devices/gridstack/:deviceId` | Widget Dashboard | Drag-drop sensor widgets, weather widget, save layout |
| `/farm_control_system/devices/history/:deviceId` | Sensor History | Time-range chart (1h-30d), aggregate data (avg/min/max) |
| `/about` | About | App info + tech stack |
| `/help` | Help | FAQ accordion |
| `/admin/users` | Admin Users | User management (admin only) |

All dashboard routes are protected — redirects to login if no valid token.

## Key Features

### Real-time Sensor Monitoring (Socket.IO Bridge)
- ข้อมูล real-time ผ่าน Socket.IO bridge (API รับจาก MQTT → emit ไปยัง App)
- JWT authentication บน Socket.IO handshake — user เห็นแค่ device ของตัวเอง
- Device rooms: `device:{id}` — user-scoped broadcasting
- Events: `device/{id}/temperature`, `humidity`, `light`, `soil`, `checkin`, `will`
- ข้อมูลแสดงผ่าน Gauge widget แบบ animated (2.5s easing)
- Signal strength indicator จาก RSSI ใน checkin payload
- Auto-reconnect (3s-10s backoff) + SocketRefreshRooms หลัง device CRUD

### Draggable Widget Dashboard (GridStack)
- Drag-to-reorder widgets แบบ responsive (5 columns)
- Widget types: Sensor gauge, Weather live
- Edit widget config: ชื่อ, สี, หน่วย, min/max
- Save/restore layout via API (per device)
- Add sensors/widgets จาก drawer panel

### Sensor History & Analytics
- Time range: 1h, 6h, 24h, 7 days, 30 days
- Auto groupBy: hour (< 7 days) / day (>= 7 days)
- Line chart แสดง avg, min, max (MUI X-Charts)
- Summary cards แสดงค่า avg, min, max, count

### Dynamic Menu System (RBAC)
- Navigation สร้างจาก DB menus ที่ได้รับตอน login
- Admin เห็นทุกเมนู, User เห็นเฉพาะเมนูที่ได้รับสิทธิ์
- Icon mapping จาก string → MUI icon component
- Reactive update ผ่าน custom event `menus-updated`

### Weather Widget (Backend Proxy)
- เรียก weather data ผ่าน API proxy (`/api/weather/:city`)
- ไม่ expose API key ใน client bundle
- Cache ฝั่ง backend (configurable TTL)

### RBAC Permission System
- Permission checks ผ่าน `permission_service.js`
- `isAdmin()`, `hasPermission(key)`, `hasAllPermissions()`, `hasAnyPermission()`
- Permissions มาจาก login response + เก็บใน localStorage

### Pagination
- Device list: 12 items per page
- MUI Pagination component
- Re-fetch on page change

### Dark Mode
- Toggle light/dark theme
- Persisted ใน localStorage
- Custom MUI theme: Green primary (#2E7D5F), Orange secondary

### Image Compression
- Device images compressed via `browser-image-compression`
- Max 200KB, max 720px width
- Preview before upload

## Architecture

### Auth Flow
```
Login → POST /api/users/login
     → Response: { token, data: { role, permissions, menus, ... } }
     → Store token + user_info (incl. menus) in localStorage
     → Dispatch "menus-updated" event → Navigation rebuilds
     → Navigate to /dashboard

Protected pages → useEffect → SysCheckToken()
     → Valid → Show content
     → Invalid (401) → Clear localStorage → Redirect to /

API calls → Axios interceptor adds Authorization header
     → 401 response → Auto-redirect to /
     → 403 response → Permission denied warning
     → 5xx response → Retry once
```

### Menu Flow
```
Login success → user_info.menus stored in localStorage
            → "menus-updated" event dispatched
            → App.jsx navKey increments
            → useMemo recalculates navigation
            → menu_service.getNavigation()
                 → getMenusFromStorage() reads menus
                 → buildNavigation() maps to Toolpad format
                      → Icon string → MUI component
                      → Regular menus + admin menus (with divider)
                 → Sidebar re-renders with new navigation
```

### Real-time Data Flow (Socket.IO Bridge)
```
Device → MQTT Broker → API (save DB + emit Socket.IO) → App (display)

FarmControlDevices
  └── SocketConnect() on mount (JWT auth → join device rooms)
       └── DeviceWidget: SocketSubscribe device/{id}/checkin + will

FarmGridStackOverview
  └── <MqttProvider topics={[device/{id}/temperature, ...]}>
       └── SocketSubscribe per topic → MqttDataContext stores payloads
            └── useSensorValue(topic, key) reads value
                 └── useAnimatedNumber eases to new value
                      └── SensorCard renders Gauge

Device CRUD → SocketRefreshRooms() → server updates room memberships
```

### State Management
- **Theme**: React Context (`useThemeMode()`)
- **Real-time Data**: React Context (`MqttDataContext`) via Socket.IO
- **Everything else**: Local component state (`useState`)
- **Persistence**: `localStorage` (token, user_info, theme-mode)

## Services API Reference

### `auth_service.js`
| Function | Description |
|----------|-------------|
| `SysLogin(email, password)` | Login + store token |
| `SysRegister(name, surname, email, password)` | Register user |
| `SysCheckToken(options?)` | Validate stored token |
| `SysSignout()` | Clear storage + redirect |

### `device_service.js`
| Function | Description |
|----------|-------------|
| `SysGetDevices()` | Get all devices |
| `SysGetDevicesPaginated(page, limit)` | Get paginated devices |
| `SysCreateDevice(payload)` | Create device |
| `SysUpdateDevice(id, payload)` | Update device |
| `SysDeleteDevice(id)` | Soft delete device |

### `menu_service.jsx`
| Function | Description |
|----------|-------------|
| `getMenusFromStorage()` | Read menus from localStorage user_info |
| `buildNavigation(menus)` | Convert DB menus → Toolpad navigation format |
| `getNavigation()` | Get navigation (calls above two) |

### `permission_service.js`
| Function | Description |
|----------|-------------|
| `isAdmin()` | Check if user is admin |
| `hasPermission(key)` | Check single permission |
| `hasAllPermissions(...keys)` | Check all permissions |
| `hasAnyPermission(...keys)` | Check any permission |

### `sensor_service.js`
| Function | Description |
|----------|-------------|
| `SysGetDeviceSensorsById(deviceId)` | Get device's sensors |
| `SysCreateSensor(payload)` | Create sensor |
| `SysUpdateDeviceSensors(id, payload)` | Update sensor |
| `SysDeleteSensor(id)` | Delete sensor |
| `SysGetSensorDataAggregate(...)` | Aggregate sensor data |

### `socket_service.jsx`
| Function | Description |
|----------|-------------|
| `SocketConnect()` | Connect Socket.IO with JWT auth + auto-reconnect (3-10s backoff) |
| `SocketDisconnect()` | Close connection + cleanup listeners |
| `SocketSubscribe(event, handler)` | Listen to event + returns unsubscribe fn |
| `SocketRefreshRooms()` | Request server to refresh device room memberships |

## Scripts

```bash
yarn dev          # Vite dev server
yarn build        # Production build
yarn preview      # Preview production build
yarn lint         # ESLint check
```

## Deployment

App ถูก deploy บน **Vercel** (auto-deploy on push):
- Framework: Vite
- Build command: `yarn build`
- Output: `dist/`

## Changelog

### v3.1.0 — Socket.IO Real-time Bridge (Current)
- **Socket.IO Migration**: เปลี่ยนจาก direct MQTT browser connection → Socket.IO bridge ผ่าน API
- **JWT Auth on WebSocket**: Socket.IO handshake verify JWT token — ไม่ต้อง expose MQTT broker
- **User-scoped Broadcasting**: แต่ละ user เห็นแค่ device ของตัวเอง (device rooms)
- **SocketRefreshRooms**: หลัง device CRUD จะ refresh room memberships อัตโนมัติ
- **Single Port**: Socket.IO รันบน port เดียวกับ API (ลบ standalone socketServer.js)
- **Removed**: `mqtt` package, `VITE_MQTT_HOST` env var, `mqtt_service.jsx`

### v3.0.0 — API Alignment + RBAC + Dynamic Menus
- **Dynamic Menu System**: Navigation สร้างจาก DB menus ตาม user role/permissions
- **RBAC Permission Service**: `isAdmin()`, `hasPermission()`, role-based access control
- **Weather Backend Proxy**: Weather widget เรียกผ่าน API proxy แทน direct OpenWeatherMap call
- **Service Layer Fix**: Unwrap API response envelope `{ message, data }` ทุก service (sensor, widget)
- **Sensor History Fix**: Aggregate data access แก้ให้อ่าน unwrapped array ถูกต้อง
- **Widget Type**: เพิ่ม soil sensor type ใน WIDGET_TYPE
- **SENSOR_TYPES Dynamic**: Derive จาก SENSORS_TYPE แทน hardcode
- **Auth Flow**: Login dispatch `menus-updated` event → reactive navigation update
- **401 Redirect Fix**: Redirect ไป `/` (login) แทน `/login` ที่ไม่มี

### v2.0.0 — Phase 2-7 Improvements
- **ErrorBoundary**: Thai fallback UI + retry button, wraps all dashboard pages
- **Code Splitting**: React.lazy() all 10 pages + Suspense with BoxLoading fallback
- **Pagination**: Device list 12/page with MUI Pagination
- **API Client Retry**: 15s timeout, 401→redirect, 5xx→retry once
- **MQTT Reconnect**: reconnectPeriod 5s, auto re-subscribe on reconnect
- **Empty States**: GridStack widget empty state
- **GitHub Actions CI**: Build pipeline

### v1.0.0 — Frontend Re-design
- React 19 + Vite 6 + MUI 7
- Toolpad Core DashboardLayout
- GridStack draggable widget dashboard
- MQTT real-time sensor monitoring
- Sensor history with time-range charts
- Dark/light theme toggle
- Spring animations
- Weather widget (OpenWeatherMap)
- Image compression for device photos
- Thai language UI

### v0.x — Initial Development
- Basic device management
- Login/register flow
- MQTT integration
- Sensor display

## Roadmap

### Completed

#### Phase 1 — Frontend Re-design `v1.0.0`
- [x] React 19 + Vite 6 + MUI 7 — modern stack
- [x] Toolpad Core DashboardLayout — sidebar + toolbar
- [x] GridStack draggable widget dashboard (5 columns, drag/resize/save)
- [x] MQTT real-time sensor monitoring (Gauge widgets + animated numbers)
- [x] Sensor history — LineChart (avg/min/max) + time range (1h-30d)
- [x] Dark/light theme toggle — persisted ใน localStorage
- [x] Spring animations — device cards, group cards
- [x] Weather widget (OpenWeatherMap live)
- [x] Image compression — device photos (max 200KB, 720px)
- [x] Thai language UI

#### Phase 2 — Stability & Performance `v2.0.0`
- [x] ErrorBoundary — Thai fallback UI + retry button, ครอบทุก dashboard page
- [x] Code splitting — React.lazy() ทุกหน้า (10 pages) + Suspense fallback
- [x] Pagination — device list 12/page + MUI Pagination
- [x] API client retry — 15s timeout, 401 redirect, 5xx retry once
- [x] MQTT auto-reconnect — 5s interval, auto re-subscribe on reconnect
- [x] Empty states — GridStack widget empty message
- [x] GitHub Actions CI — build pipeline on push/PR

#### Phase 2.5 — API Alignment + RBAC + Dynamic Menus `v3.0.0`
- [x] Dynamic Menu System — navigation จาก DB menus ตาม role/permissions
- [x] RBAC Permission Service — isAdmin(), hasPermission(), role-based access
- [x] Weather Backend Proxy — เรียกผ่าน API `/api/weather/:city` แทน direct call
- [x] Service Layer Fix — unwrap response envelope ทุก service
- [x] Admin User Management — หน้าจัดการ user (admin only)
- [x] Sensor model enhancement — เพิ่ม max, min, ratio fields
- [x] 401 redirect fix — redirect ไป `/` แทน `/login`

#### Phase 2.6 — Socket.IO Real-time Bridge `v3.1.0`
- [x] Socket.IO Migration — เปลี่ยนจาก direct MQTT → Socket.IO bridge ผ่าน API
- [x] JWT Auth on WebSocket — handshake verify token, user-scoped device rooms
- [x] SocketRefreshRooms — refresh rooms หลัง device CRUD
- [x] Removed MQTT from client — ลบ mqtt package, VITE_MQTT_HOST, mqtt_service.jsx
- [x] Single port deployment — Socket.IO + API บน port เดียว (ลบ socketServer.js)

---

### Phase 2.7 — Admin Panel Expansion (In Progress)

> เพิ่ม 8 หน้า admin + shared components + CSV export + bulk operations

| Phase | Feature | Status |
|-------|---------|--------|
| 0 | Shared Components (AdminPageWrapper, AdminDataTable, AdminSearchBar, AdminFilterBar, StatCard, ExportButton, csvExport) | Planned |
| 1 | Admin Dashboard — ภาพรวมระบบ (StatCards + recent logs) | Planned |
| 2 | Device Management — จัดการอุปกรณ์ทั้งหมด + edit/delete | Planned |
| 3 | Sensor Management — จัดการเซ็นเซอร์ + filter by device/type | Planned |
| 4 | Audit Log Viewer — ล็อกการตรวจสอบ + detail dialog | Planned |
| 5 | Device Log Viewer — ล็อกการเชื่อมต่ออุปกรณ์ | Planned |
| 6 | Notification Management — แจ้งเตือน + สร้างแจ้งเตือนถึงทุก user | Planned |
| 7 | Menu Management — จัดการเมนู (hierarchical cards) | Planned |
| 8 | System Settings — สถานะระบบ (read-only) | Planned |
| 9 | CSV Export — เพิ่ม ExportButton ใน 6 หน้า | Planned |
| 10 | Bulk Operations — multi-select + bulk role/delete | Planned |

New admin pages:
| Path | Page | Description |
|------|------|-------------|
| `/admin/dashboard` | Admin Dashboard | ภาพรวมระบบ — stats + recent activities |
| `/admin/users` | Admin Users | จัดการผู้ใช้ (existing) |
| `/admin/devices` | Admin Devices | จัดการอุปกรณ์ทั้งหมด |
| `/admin/sensors` | Admin Sensors | จัดการเซ็นเซอร์ |
| `/admin/audit-logs` | Audit Logs | ล็อกการตรวจสอบ |
| `/admin/device-logs` | Device Logs | ล็อกการเชื่อมต่อ |
| `/admin/notifications` | Notifications | จัดการแจ้งเตือน |
| `/admin/menus` | Menu Management | จัดการเมนู |
| `/admin/settings` | System Settings | ตั้งค่าระบบ |

---

### Phase 3 — Security & Auth (Planned)

> แก้ไขช่องโหว่ security ฝั่ง frontend

- [x] **ย้าย Weather API key ไป backend** — ~~ตอนนี้ `VITE_WATHER_KEY` ถูก bundle ไปใน JS~~ แก้แล้ว v3.0.0: เรียกผ่าน `/api/weather/:city`
- [ ] **Token storage migration** — ย้าย JWT จาก localStorage (เสี่ยง XSS) ไปใช้ httpOnly cookie หรือ sessionStorage
- [ ] **Refresh token flow** — silent refresh เมื่อ token ใกล้หมดอายุ แทนการ redirect ไป login ทันที
- [ ] **Session timeout warning** — แจ้งเตือน user ก่อน token หมดอายุ 5 นาที
- [ ] **Form input sanitization** — sanitize HTML/script ใน input fields (device name, group name, description)
- [ ] **CSRF protection** — เพิ่ม CSRF token สำหรับ state-changing requests

### Phase 4 — User Experience (Planned)

> ปรับปรุง UX ให้ใช้งานง่ายขึ้น

- [ ] **User profile page** — หน้าดู/แก้ข้อมูลส่วนตัว, เปลี่ยน password, upload avatar
- [ ] **Device search & filter** — ค้นหา device ตามชื่อ, filter ตาม status (online/offline), sort
- [ ] **GridStack auto-save** — auto-save layout เมื่อ drag/resize เสร็จ (debounce 2s) แทนการกดปุ่ม Save
- [ ] **Loading indicators บน buttons** — แสดง spinner บนปุ่มที่กำลัง submit/save
- [ ] **Optimistic UI updates** — update UI ทันทีก่อนรอ API response (create/update/delete)
- [ ] **Breadcrumbs** — แสดง navigation path สำหรับหน้าลึก (Devices → GridStack → History)
- [ ] **Confirmation ก่อน leave page** — เตือนเมื่อ user มี unsaved changes แล้วจะออกจากหน้า
- [ ] **Keyboard shortcuts** — Ctrl+S save layout, Escape close dialog

### Phase 5 — Data Visualization (Planned)

> เพิ่มความสามารถในการวิเคราะห์ข้อมูล

- [ ] **History chart zoom/pan** — zoom in/out + drag pan บน chart
- [ ] **Multi-sensor comparison** — เปรียบเทียบ sensor หลายตัวในกราฟเดียว
- [ ] **Data export** — export ข้อมูล sensor เป็น CSV/PDF ตาม date range
- [ ] **Dashboard stats enhancement** — เพิ่ม charts บนหน้า Dashboard (trend lines, pie charts)
- [ ] **Sensor threshold visualization** — แสดงเส้น threshold บน gauge + chart
- [ ] **Real-time chart** — live streaming chart แสดงข้อมูลแบบ real-time (ไม่ต้อง refresh)
- [ ] **Custom date range picker** — เลือก date range แบบ custom แทน preset (1h, 6h, 24h, 7d, 30d)

### Phase 6 — Notifications & Alerts (Planned)

> ระบบแจ้งเตือน

- [ ] **In-app notifications** — notification bell icon + dropdown list
- [ ] **Sensor threshold alerts** — ตั้งค่า min/max ต่อ sensor, แจ้งเตือนเมื่อค่าเกิน threshold
- [ ] **Push notifications** — browser push notification สำหรับ alert สำคัญ
- [ ] **Notification preferences** — user เลือกได้ว่าจะรับ notification ประเภทไหน
- [ ] **Alert history** — ดูประวัติ alerts ย้อนหลัง

### Phase 7 — Device Management (Planned)

> เพิ่มความสามารถการจัดการ device

- [x] **Device online/offline tracking** — real-time status ผ่าน Socket.IO (checkin/will events)
- [ ] **Batch operations** — multi-select devices เพื่อ delete/move group ทีเดียว
- [ ] **Device detail page** — หน้า detail แสดง device info, sensors, last seen, connection history
- [ ] **Group dashboard** — หน้า overview ของ group แสดง devices ทั้งหมด + sensor summary ในกลุ่ม
- [ ] **Device command UI** — UI สำหรับส่ง command ไปยัง device ผ่าน REST API (relay on/off, restart)
- [ ] **QR code scan** — เพิ่ม device ด้วยการ scan QR code แทนการพิมพ์ device_id

### Phase 8 — Mobile & Responsive (Planned)

> ปรับปรุงการใช้งานบน mobile

- [ ] **Mobile-responsive optimization** — ปรับ GridStack, device cards, sidebar สำหรับหน้าจอเล็ก
- [ ] **PWA support** — Service Worker + offline mode, installable app
- [ ] **Touch gestures** — swipe actions บน device cards (swipe to delete/edit)
- [ ] **Bottom navigation** — navigation bar ด้านล่างสำหรับ mobile แทน sidebar
- [ ] **Responsive GridStack** — auto-adjust column count ตาม screen size (5→3→1)

### Phase 9 — Internationalization (Planned)

> รองรับหลายภาษา

- [ ] **i18n framework** — ติดตั้ง react-i18next
- [ ] **Thai + English** — แปล UI ทั้งหมด 2 ภาษา
- [ ] **Language switcher** — เลือกภาษาใน toolbar
- [ ] **Date/number locale** — format วันที่และตัวเลขตาม locale

### Phase 10 — Testing (Planned)

> เพิ่ม test coverage

- [ ] **Unit tests (Vitest)** — test components, hooks, services
- [ ] **React Testing Library** — test user interactions (form submit, button click, navigation)
- [ ] **E2E tests (Playwright)** — test full flow: login → create device → view dashboard → history
- [ ] **Visual regression tests** — screenshot comparison สำหรับ UI changes
- [ ] **Accessibility audit** — ARIA labels, keyboard navigation, WCAG compliance

### Phase 11 — Code Quality (Planned)

> ปรับปรุงคุณภาพ code

- [ ] **TypeScript migration** — เพิ่ม type safety, refactor ง่ายขึ้น
- [ ] **Component documentation** — PropTypes หรือ JSDoc สำหรับทุก component
- [ ] **Storybook** — component catalog + visual testing
- [ ] **State management upgrade** — พิจารณา Zustand/Jotai แทน multiple Context providers
- [ ] **Bundle analysis** — วิเคราะห์ bundle size + tree-shaking optimization

---

### Priority Matrix

| Priority | Phase | เหตุผล |
|----------|-------|--------|
| High | Phase 3 (Security) | token ใน localStorage เสี่ยง XSS — ควรย้ายไป httpOnly cookie |
| High | Phase 4 (UX) | ปรับปรุงประสบการณ์ user โดยตรง — search, auto-save, profile |
| High | Phase 7 (Device Mgmt) | online tracking + batch ops เป็น feature ที่ user ต้องใช้ |
| Medium | Phase 5 (Visualization) | เพิ่ม value ด้าน analytics — export, comparison, zoom |
| Medium | Phase 6 (Notifications) | สำคัญสำหรับ IoT monitoring — alert เมื่อค่าผิดปกติ |
| Medium | Phase 8 (Mobile) | จำเป็นเมื่อ user ใช้งานผ่าน mobile มากขึ้น |
| Low | Phase 9 (i18n) | จำเป็นเมื่อขยาย user base ไป international |
| Low | Phase 10 (Testing) | เพิ่มความมั่นใจ แต่ไม่กระทบ user โดยตรง |
| Low | Phase 11 (Code Quality) | long-term maintainability |

## Known Issues

| Issue | Severity | รายละเอียด |
|-------|----------|-----------|
| Token ใน localStorage | High | เสี่ยงต่อ XSS attack — ควรย้ายไป httpOnly cookie |
| GridStack ต้องกด Save | Medium | ไม่มี auto-save — user อาจลืมกด Save แล้วเสีย layout |
| Mobile responsive ไม่ดี | Medium | GridStack + cards layout พังบนหน้าจอเล็ก |
| No loading state on buttons | Low | กดปุ่มแล้วไม่มี feedback ว่ากำลัง submit |
| ไม่มี breadcrumbs | Low | หน้าลึก (GridStack, History) ไม่มี navigation path |

## License

ISC
