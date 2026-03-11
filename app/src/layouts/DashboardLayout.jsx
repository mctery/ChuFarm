import { Outlet, useLocation } from "react-router";
import { DashboardLayout } from "@toolpad/core/DashboardLayout";
import { PageContainer } from "@toolpad/core/PageContainer";

import ErrorBoundary from "../components/ErrorBoundary";
import AppToolbarActions from "../components/AppToolbarActions";

const ROUTE_TITLES = {
  "/dashboard": "",
  "/notifications": "การแจ้งเตือน",
  "/settings": "ตั้งค่า",
  "/about": "เกี่ยวกับ",
  "/help": "ช่วยเหลือ",
  "/farm_control_system/devices": "อุปกรณ์",
  "/farm_control_system/device-profiles": "โปรไฟล์อุปกรณ์",
  "/farm_control_system/thresholds": "ค่าขีดจำกัด",
  "/farm_control_system/automation-rules": "กฎอัตโนมัติ",
  "/farm_control_system/schedules": "ตารางเวลา",
  "/farm_control_system/farms": "ฟาร์ม",
  "/farm_control_system/analytics": "วิเคราะห์ข้อมูล",
};

function usePageTitle() {
  const { pathname } = useLocation();
  // exact match first
  if (ROUTE_TITLES[pathname]) return ROUTE_TITLES[pathname];
  // dynamic segments: /farm_control_system/devices/gridstack/:id → "ภาพรวมอุปกรณ์"
  if (pathname.includes("/gridstack/")) return "ภาพรวมอุปกรณ์";
  if (pathname.includes("/history/")) return "ประวัติเซ็นเซอร์";
  if (pathname.match(/^\/farm_control_system\/farms\/.+/)) return "รายละเอียดฟาร์ม";
  return "";
}

export default function Layout() {
  return (
    <DashboardLayout slots={{ toolbarActions: AppToolbarActions }}>
      <PageContainer title="" sx={{ maxWidth: "100% !important" }}>
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </PageContainer>
    </DashboardLayout>
  );
}
