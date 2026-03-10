# SmartFarm UI/UX Redesign Roadmap

> วิเคราะห์ระบบทั้งหมดและวางแผนปรับปรุง UI/UX ทุกหน้าจอ
> สถานะ: **In Progress** | วันที่วิเคราะห์: 5 มี.ค. 2569 | อัปเดตล่าสุด: 10 มี.ค. 2569 (Session 2)

---

## สรุปภาพรวมระบบปัจจุบัน

### Tech Stack
- **Frontend:** React 19, MUI 7, Vite 6, GridStack 12, Socket.IO, MUI X-Charts 8
- **Backend:** Express.js, MongoDB, MQTT, Socket.IO, JWT Auth, RBAC
- **Layout:** Toolpad Core DashboardLayout (sidebar + appbar)

### หน้าจอทั้งหมด (28 หน้า)
| กลุ่ม | หน้าจอ | สถานะ UX |
|-------|--------|----------|
| Auth | Login, Register, Forgot Password, Reset Password | ปรับปรุงแล้ว |
| หลัก | Dashboard, Devices, GridStack, Sensor History | ปรับปรุงแล้ว |
| ใหม่ | Notifications, Settings, Thresholds, AutomationRules, Schedules | สร้างใหม่แล้ว |
| ใหม่ (Session 2) | **Farms, FarmDetail, Analytics** | **สร้างใหม่แล้ว** |
| ข้อมูล | About, Help, 404 | ดีอยู่แล้ว |
| Admin | Dashboard, Users, Devices, Sensors, Notifications, AuditLogs, DeviceLogs, Settings, Menus | ปรับปรุงแล้ว |

### ฟีเจอร์ Backend ที่ยังไม่มี UI
| ฟีเจอร์ | API พร้อม | มี UI |
|---------|----------|-------|
| Automation Rules (if-then) | Yes | **Yes** (สร้างแล้ว) |
| Schedules (cron jobs) | Yes | **Yes** (สร้างแล้ว) |
| Sensor Thresholds (alerts) | Yes | **Yes** (สร้างแล้ว) |
| Notifications (user-facing) | Yes | **Yes** (สร้างแล้ว) |
| User Settings + Telegram | Yes | **Yes** (สร้างแล้ว) |
| Device Commands (MQTT) | Yes | **Yes** (DeviceCommandDialog — Session 2) |
| Farms & Zones management | Yes | **Yes** (FarmsPage + FarmDetailPage — Session 2) |
| Analytics (trend, compare) | Yes | **Yes** (AnalyticsPage — Session 2) |
| Device Profiles | Yes | **No** |
| Weather (current) | Yes | **Yes** (Dashboard widget) |

---

## Phase 1: Foundation & Layout -- DONE

### 1.1 ปรับ DashboardLayout (Sidebar + AppBar)
**ไฟล์:** `src/layouts/DashboardLayout.jsx`

**สิ่งที่ทำแล้ว:**
- [x] เพิ่ม Notification Bell icon ที่ AppBar พร้อม badge จำนวน unread
- [x] เพิ่ม Notification Popover dropdown (แสดงรายการ, อ่านทีละรายการ, อ่านทั้งหมด, ดูทั้งหมด)
- [x] เพิ่ม Profile Dropdown Menu (ชื่อ, email, role chip, theme toggle, ตั้งค่า, ออกจากระบบ)
- [x] Profile chip แสดง initials แทน icon ทั่วไป

### 1.2 ปรับ Theme ให้สอดคล้อง
**ไฟล์:** `src/theme.js`

**สิ่งที่ทำแล้ว:**
- [x] ปรับ dark mode background colors ให้มี tint สีเขียวอ่อน
- [x] ปรับ card shadows ให้นุ่มนวลขึ้น
- [x] เพิ่ม component overrides: MuiPaper, MuiTableHead, MuiTooltip, MuiDialog, MuiMenu
- [x] เพิ่ม Card transition สำหรับ hover effect

---

## Phase 2: Auth Pages -- DONE

### 2.2 ปรับ Register Page
**ไฟล์:** `src/pages/auth/register.jsx`

**สิ่งที่ทำแล้ว:**
- [x] เพิ่ม password strength bar (LinearProgress 5 ระดับ)
- [x] เพิ่ม password rules checklist พร้อม green checkmarks
- [x] เพิ่ม show/hide password toggle
- [x] เพิ่ม real-time confirm password mismatch error

**ยังไม่ได้ทำ:**
- [ ] 2-column layout สำหรับ login/register (ซ้ายเป็น illustration)
- [ ] "จดจำฉัน" checkbox ที่ login

---

## Phase 3: Dashboard -- DONE

### 3.1 ปรับ Dashboard Page ใหม่
**ไฟล์:** `src/pages/DashboardPage.jsx`

**สิ่งที่ทำแล้ว:**
- [x] แก้ Sensor count ดึงจาก API จริง (iterate devices + count sensors)
- [x] เพิ่ม Weather Card (ดึงจาก `/api/weather/Bangkok`)
- [x] เพิ่ม Recent Notifications feed
- [x] ปรับ layout เป็น 2-column: ซ้าย devices + actions, ขวา weather + notifications
- [x] StatCard มี onClick พร้อม hover effect
- [x] Device preview cards คลิกได้ (navigate to GridStack)
- [x] ปรับ Welcome gradient

---

## Phase 4: Farm Control -- DONE

### 4.1 ปรับ Device List (FarmControlDevices)
**ไฟล์:** `src/pages/farm/FarmControlDevices.jsx`

**สิ่งที่ทำแล้ว:**
- [x] เพิ่ม Search bar + ToggleButtonGroup filter (ทั้งหมด/ออนไลน์/ออฟไลน์) พร้อม count chips
- [x] เพิ่ม useMemo สำหรับ client-side filtering
- [x] ปรับ Grid responsive (xs:12, sm:6, md:4, lg:3)
- [x] เพิ่ม empty search results state
- [x] Header responsive

### 4.2 ปรับ DeviceWidget
**ไฟล์:** `src/components/DeviceWidget.jsx`

**สิ่งที่ทำแล้ว:**
- [x] ออกแบบ card layout ใหม่: compact header (Avatar + name + signal + status chip) + action bar
- [x] ย้าย signal indicator เข้าไปอยู่ใน header inline
- [x] ลดขนาดรูปเป็น small Avatar thumbnail
- [x] Hover effect: translateY(-2px)

### 4.3 ปรับ GridStack Dashboard
**ไฟล์:** `src/pages/farm/FarmGridStackOverview.jsx`

**สิ่งที่ทำแล้ว:**
- [x] จัด toolbar ใหม่ใน Paper outlined: แบ่ง primary (เพิ่มวิดเจ็ต) / secondary (บันทึก, ลบ)
- [x] เพิ่ม Lock/Unlock mode (ล็อคตำแหน่งวิดเจ็ต)
- [x] ปรับ empty state มี action buttons
- [x] แก้ deprecated InputProps -> slotProps.input (MUI v7)
- [x] Header responsive + widget count chip

### 4.4 Sensor History Page
**ไฟล์:** `src/pages/farm/SensorHistoryPage.jsx`
**สถานะ:** ออกแบบใหม่ทั้งหมดแล้ว (session ก่อนหน้า)
- [x] เพิ่ม Export CSV (ส่งออกข้อมูลเซ็นเซอร์เป็น CSV รองรับ UTF-8 BOM)

---

## Phase 5: หน้าจอใหม่ -- บางส่วนเสร็จ

### 5.1 Notification Center -- DONE
**ไฟล์:** `src/pages/NotificationsPage.jsx` (สร้างใหม่)
**Route:** `/notifications`

**สิ่งที่ทำแล้ว:**
- [x] หน้ารวมแจ้งเตือนทั้งหมด
- [x] Tabs: ทั้งหมด / ยังไม่อ่าน / อ่านแล้ว
- [x] กดอ่านทีละรายการ / อ่านทั้งหมด / ลบ
- [x] แสดง severity ด้วย chip สี
- [x] Pagination
- [x] Link "ดูแจ้งเตือนทั้งหมด" ใน Notification Popover ที่ AppBar

### 5.2 Sensor Thresholds -- DONE
**ไฟล์:** `src/pages/farm/ThresholdsPage.jsx` (สร้างใหม่)
**Route:** `/farm_control_system/thresholds`

**สิ่งที่ทำแล้ว:**
- [x] CRUD threshold ต่ออุปกรณ์/เซ็นเซอร์
- [x] เลือก device → sensor dropdown (cascade)
- [x] ตั้งค่า min/max + notify_type (in_app/push/both)
- [x] Empty state + DialogConfirm สำหรับลบ

### 5.3 Automation Rules -- DONE
**ไฟล์:** `src/pages/farm/AutomationRulesPage.jsx` (สร้างใหม่)
**Route:** `/farm_control_system/automation-rules`

**สิ่งที่ทำแล้ว:**
- [x] Rule builder: conditions (device/sensor/operator/value) + actions (notify/command/log)
- [x] AND/OR logic สำหรับ conditions
- [x] Toggle active/inactive
- [x] Expandable detail view per rule
- [x] Execution logs dialog
- [x] Sensor caching เพื่อลด API calls

### 5.4 Schedules -- DONE
**ไฟล์:** `src/pages/farm/SchedulesPage.jsx` (สร้างใหม่)
**Route:** `/farm_control_system/schedules`

**สิ่งที่ทำแล้ว:**
- [x] Cron preset selector (7 presets + custom)
- [x] Actions builder (notify/command/log)
- [x] แสดง next_run / last_run
- [x] Toggle active/inactive
- [x] Execution logs dialog

### 5.5 User Settings -- DONE
**ไฟล์:** `src/pages/SettingsPage.jsx` (สร้างใหม่)
**Route:** `/settings`

**สิ่งที่ทำแล้ว:**
- [x] โปรไฟล์ (แก้ไขชื่อ-นามสกุล)
- [x] เปลี่ยนรหัสผ่าน (show/hide toggle, mismatch validation)
- [x] ตั้งค่าการแจ้งเตือน (in-app, email, Telegram toggles)
- [x] Quiet Hours (เวลาปิดแจ้งเตือน)
- [x] Telegram Bot (generate link code / unlink) — แทนที่ LINE Notify
- [x] Profile menu links to Settings page

---

## Phase 6: Admin Pages -- DONE (บางส่วน)

**สิ่งที่ทำแล้ว:**
- [x] AdminUsersPage ใช้ AdminPageWrapper (เดิมไม่ใช้)
- [x] แก้ deprecated `InputProps` -> `slotProps.input` ใน AdminUsersPage
- [x] แก้ `DialogContent sx={{ pt: "16px !important" }}` -> `DialogContent dividers` ใน 4 ไฟล์ (AdminDevices, AdminSensors, AdminNotifications, AdminMenus)
- [x] BulkActionBar component สร้างแล้ว (`src/components/admin/BulkActionBar.jsx`)
- [x] AdminFilterBar, AdminSearchBar components สร้างแล้ว
- [x] **ผูก BulkActionBar เข้า AdminUsersPage** (row checkboxes + select all + bulk CSV export — Session 2)

**ยังไม่ได้ทำ:**
- [ ] ปรับ tables ให้มี sticky header
- [ ] เพิ่ม mini charts ใน Admin Dashboard

---

## Phase 7-8: Static Pages & Shared Components -- บางส่วนเสร็จ

About, Help, 404 pages: ไม่ต้องแก้ไข (สถานะดีอยู่แล้ว)

**สิ่งที่ทำแล้ว (Session 2):**
- [x] **Skeleton loading** (`SkeletonCardGrid` component) แทน `BoxLoading` spinner ใน ThresholdsPage, AutomationRulesPage, SchedulesPage, FarmsPage, FarmDetailPage

**ยังไม่ได้ทำ:**
- [ ] สร้าง shared EmptyState component
- [ ] ปรับ DeviceFormDialog เพิ่ม image upload

---

## สรุป Progress

| Phase | รายละเอียด | สถานะ |
|-------|-----------|-------|
| Phase 1 | Layout + Theme | DONE |
| Phase 2 | Auth Pages | DONE (บางส่วน) |
| Phase 3 | Dashboard | DONE |
| Phase 4 | Farm Control (Devices, GridStack, History) | DONE |
| Phase 5.1 | Notification Center | DONE |
| Phase 5.5 | User Settings | DONE |
| Phase 5.2 | Sensor Thresholds | DONE |
| Phase 5.3 | Automation Rules | DONE |
| Phase 5.4 | Schedules | DONE |
| Phase 6 | Admin Pages | DONE (บางส่วน) |
| Phase 7-8 | Static + Shared Components | บางส่วนเสร็จ |
| **Session 2** | **Bug Fixes + Refactor + New Features** | **DONE** |

### ไฟล์ที่แก้ไข/สร้าง (Session 1)

**แก้ไข (27 ไฟล์):**
- `src/layouts/DashboardLayout.jsx` - Notification bell, profile dropdown, "ดูทั้งหมด" link
- `src/theme.js` - Dark mode colors, shadows, component overrides
- `src/pages/DashboardPage.jsx` - Weather card, notifications, real sensor count
- `src/pages/farm/FarmControlDevices.jsx` - Search, filter, responsive grid
- `src/components/DeviceWidget.jsx` - Compact card layout
- `src/pages/farm/FarmGridStackOverview.jsx` - Toolbar, lock mode, edit dialog
- `src/pages/farm/SensorHistoryPage.jsx` - Full redesign
- `src/pages/auth/register.jsx` - Password strength, show/hide toggle
- `src/pages/admin/AdminUsersPage.jsx` - AdminPageWrapper, slotProps fix
- `src/pages/admin/AdminDevicesPage.jsx` - DialogContent dividers
- `src/pages/admin/AdminSensorsPage.jsx` - DialogContent dividers
- `src/pages/admin/AdminNotificationsPage.jsx` - DialogContent dividers
- `src/pages/admin/AdminMenusPage.jsx` - DialogContent dividers
- `src/constants/routes.js` - NOTIFICATIONS, SETTINGS, THRESHOLDS, AUTOMATION_RULES, SCHEDULES routes
- `src/main.jsx` - NotificationsPage, SettingsPage, ThresholdsPage, AutomationRulesPage, SchedulesPage routes
- `src/pages/farm/SensorHistoryPage.jsx` - Export CSV button

**สร้างใหม่ (11 ไฟล์):**
- `src/pages/NotificationsPage.jsx` - Notification Center
- `src/pages/SettingsPage.jsx` - User Settings + Telegram (แทนที่ LINE Notify)
- `src/pages/farm/ThresholdsPage.jsx` - Sensor Thresholds (CRUD)
- `src/pages/farm/AutomationRulesPage.jsx` - Automation Rules Builder
- `src/pages/farm/SchedulesPage.jsx` - Schedule Management
- `src/components/admin/BulkActionBar.jsx` - Bulk action toolbar
- `src/components/admin/AdminFilterBar.jsx` - Filter bar
- `src/components/admin/AdminSearchBar.jsx` - Search bar
- `src/components/admin/AdminDataTable.jsx` - Reusable admin table
- `src/components/admin/ExportButton.jsx` - CSV export button
- `src/components/ListButtonMenu.jsx` - List button menu component

---

### ไฟล์ที่แก้ไข/สร้าง (Session 2)

**Bug Fixes:**
- `src/pages/admin/AdminUsersPage.jsx` - เพิ่ม `Alert` import (crash fix)
- `src/layouts/DashboardLayout.jsx` - `useRef` stable ref, `APP_CONFIG.NOTIF_POLL_INTERVAL`
- `src/pages/DashboardPage.jsx` - `Promise.all` parallel fetch, shared constants
- `src/pages/farm/ThresholdsPage.jsx` - min < max validation
- `src/pages/farm/AutomationRulesPage.jsx` - await getSensors race condition fix

**Refactor:**
- `src/services/global_variable.jsx` - เพิ่ม `SEVERITY_COLORS`, `APP_CONFIG`, `STATUS`
- `src/constants/automation.js` - สร้างใหม่ (OPERATORS, ACTION_TYPES, CRON_PRESETS, DEFAULT_TIMEZONE)
- `src/pages/farm/SchedulesPage.jsx` - ใช้ constants จาก automation.js
- `src/pages/farm/AutomationRulesPage.jsx` - ใช้ constants จาก automation.js

**New Features:**
- `src/services/device_service.js` - เพิ่ม `SysSendDeviceCommand`
- `src/components/DeviceCommandDialog.jsx` - สร้างใหม่ (ส่งคำสั่ง MQTT)
- `src/components/DeviceWidget.jsx` - เพิ่มปุ่ม "ส่งคำสั่ง" (disabled เมื่อ offline)
- `src/services/farm_service.js` - สร้างใหม่ (Farms + Zones CRUD)
- `src/services/analytics_service.js` - สร้างใหม่ (summary, trend, compare, recommendations)
- `src/pages/farm/FarmsPage.jsx` - สร้างใหม่ (Farm list + CRUD)
- `src/pages/farm/FarmDetailPage.jsx` - สร้างใหม่ (Farm detail + Zone management)
- `src/pages/farm/AnalyticsPage.jsx` - สร้างใหม่ (4 tabs: summary/trend/compare/recommendations)
- `src/constants/routes.js` - เพิ่ม FARMS, FARM_DETAIL, ANALYTICS
- `src/main.jsx` - เพิ่ม routes ใหม่ 3 เส้น

**UX Polish:**
- `src/pages/admin/AdminUsersPage.jsx` - row checkboxes + select all + BulkActionBar + bulk CSV export
- `src/components/SkeletonCardGrid.jsx` - สร้างใหม่ (skeleton loading component)
- `src/pages/farm/ThresholdsPage.jsx` - ใช้ SkeletonCardGrid
- `src/pages/farm/AutomationRulesPage.jsx` - ใช้ SkeletonCardGrid
- `src/pages/farm/SchedulesPage.jsx` - ใช้ SkeletonCardGrid
- `src/pages/farm/FarmsPage.jsx` - ใช้ SkeletonCardGrid
- `src/pages/farm/FarmDetailPage.jsx` - ใช้ SkeletonCardGrid

---

## งานที่เหลือ (Backlog)

| งาน | Priority | หมายเหตุ |
|-----|----------|---------|
| Device Profile management | ต่ำ | Admin feature |
| Auth 2-column layout + remember me | ต่ำ | UX nice-to-have |
| Sticky header ใน Admin tables | ต่ำ | UX polish |
| Mini charts ใน Admin Dashboard | ต่ำ | UX polish |
| DeviceFormDialog image upload | ต่ำ | UX enhancement |
