# ChuFarm

ระบบจัดการฟาร์มอัจฉริยะ (Smart Farm IoT Platform)

## Overview

ChuFarm เป็นแพลตฟอร์ม IoT สำหรับจัดการฟาร์มอัจฉริยะ รองรับการเชื่อมต่ออุปกรณ์เซ็นเซอร์ ติดตามข้อมูลแบบเรียลไทม์ ตั้งค่าแจ้งเตือนอัตโนมัติ และควบคุมอุปกรณ์ผ่าน MQTT

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, MUI 7, Vite 6, GridStack 12, Socket.IO, MUI X-Charts 8 |
| **Backend** | Node.js, Express 4, MongoDB, Mongoose 6 |
| **Real-time** | MQTT 5 (IoT devices), Socket.IO 4 (WebSocket push) |
| **Auth** | JWT (access + refresh tokens), bcrypt, RBAC |
| **Automation** | node-cron, rule engine (AND/OR conditions), threshold alerts |
| **Notifications** | In-app, LINE Notify, Email (Resend) |

## Project Structure

```
ChuFarm/
├── api/          # Backend REST API (Express + MongoDB + MQTT)
├── app/          # Frontend SPA (React + MUI + Vite)
├── README.md
└── CLAUDE.md
```

## Getting Started

### Prerequisites

- Node.js >= 16
- MongoDB (Atlas or local)
- MQTT Broker (e.g., EMQX, Mosquitto)

### Backend (API)

```bash
cd api
cp .env.example .env    # Configure environment variables
yarn install
yarn dev                # Development (port 3000)
```

**Required environment variables:**
- `MONGO_URL` - MongoDB connection string
- `TOKEN_KEY` - JWT secret key

### Frontend (App)

```bash
cd app
cp .env.example .env    # Set VITE_API=http://localhost:3000
yarn install
npm run dev             # Development (port 5173)
```

## Features

### User Features
- Dashboard with device stats, weather, recent notifications
- Device management with drag-drop GridStack widget dashboard
- Real-time sensor monitoring (temperature, humidity, light, soil)
- Sensor data history with charts and CSV export
- Automation rules (if-then conditions with AND/OR logic)
- Scheduled actions (cron-based)
- Sensor threshold alerts
- Notification center (in-app, LINE Notify, email)
- User settings (profile, password, notification preferences)

### Admin Features
- System dashboard with platform statistics
- User management with RBAC permissions
- Device and sensor management
- Audit logs and device logs
- Dynamic menu configuration
- System-wide notifications

### IoT Integration
- MQTT topics: `device/{id}/{temperature|humidity|light|soil|checkin|will|health}`
- Device health monitoring (battery, RSSI, firmware, uptime)
- Remote device commands via MQTT
- Automatic online/offline detection (LWT)

## Documentation

- **API docs:** See [`api/CLAUDE.md`](api/CLAUDE.md) for full endpoint reference
- **App docs:** See [`app/CLAUDE.md`](app/CLAUDE.md) for frontend architecture
- **UI Roadmap:** See [`app/REDESIGN_ROADMAP.md`](app/REDESIGN_ROADMAP.md) for UI/UX progress

## License

MIT
