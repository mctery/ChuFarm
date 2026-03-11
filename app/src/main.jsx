import * as React from "react";
import * as ReactDOM from "react-dom/client";
import "weather-icons/css/weather-icons.css";
import "gridstack/dist/gridstack.min.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import App from "./App";
import Layout from "./layouts/DashboardLayout";
import AdminLayout from "./layouts/AdminLayout";
import BoxLoading from "./components/BoxLoading";

// Lazy-loaded pages
const LoginPage = React.lazy(() => import("./pages/auth/login"));
const RegisterPage = React.lazy(() => import("./pages/auth/register"));
const ForgotPasswordPage = React.lazy(() => import("./pages/auth/forgot-password"));
const ResetPasswordPage = React.lazy(() => import("./pages/auth/reset-password"));
const DashboardPage = React.lazy(() => import("./pages/DashboardPage"));
const AboutPage = React.lazy(() => import("./pages/AboutPage"));
const HelpPage = React.lazy(() => import("./pages/HelpPage"));
const FarmControlDevices = React.lazy(() => import("./pages/farm/FarmControlDevices"));
const FarmGridStackOverview = React.lazy(() => import("./pages/farm/FarmGridStackOverview"));
const SensorHistoryPage = React.lazy(() => import("./pages/farm/SensorHistoryPage"));
const NotificationsPage = React.lazy(() => import("./pages/NotificationsPage"));
const SettingsPage = React.lazy(() => import("./pages/SettingsPage"));
const AdminUsersPage = React.lazy(() => import("./pages/admin/AdminUsersPage"));
const AdminDashboardPage = React.lazy(() => import("./pages/admin/AdminDashboardPage"));
const AdminDevicesPage = React.lazy(() => import("./pages/admin/AdminDevicesPage"));
const AdminSensorsPage = React.lazy(() => import("./pages/admin/AdminSensorsPage"));
const AdminAuditLogsPage = React.lazy(() => import("./pages/admin/AdminAuditLogsPage"));
const AdminDeviceLogsPage = React.lazy(() => import("./pages/admin/AdminDeviceLogsPage"));
const AdminNotificationsPage = React.lazy(() => import("./pages/admin/AdminNotificationsPage"));
const AdminMenusPage = React.lazy(() => import("./pages/admin/AdminMenusPage"));
const AdminSettingsPage = React.lazy(() => import("./pages/admin/AdminSettingsPage"));
const ThresholdsPage = React.lazy(() => import("./pages/farm/ThresholdsPage"));
const AutomationRulesPage = React.lazy(() => import("./pages/farm/AutomationRulesPage"));
const SchedulesPage = React.lazy(() => import("./pages/farm/SchedulesPage"));
const FarmsPage = React.lazy(() => import("./pages/farm/FarmsPage"));
const FarmDetailPage = React.lazy(() => import("./pages/farm/FarmDetailPage"));
const AnalyticsPage = React.lazy(() => import("./pages/farm/AnalyticsPage"));
const DeviceProfilesPage = React.lazy(() => import("./pages/farm/DeviceProfilesPage"));
const PageNotFound = React.lazy(() => import("./pages/PageNotFound"));

function SuspenseWrapper({ children }) {
  return <React.Suspense fallback={<BoxLoading />}>{children}</React.Suspense>;
}

function lazyElement(Component) {
  return {
    element: (
      <SuspenseWrapper>
        <Component />
      </SuspenseWrapper>
    ),
  };
}

const router = createBrowserRouter([
  {
    path: "/",
    Component: App,
    errorElement: (
      <SuspenseWrapper>
        <PageNotFound />
      </SuspenseWrapper>
    ),
    children: [
      {
        index: true,
        ...lazyElement(LoginPage),
      },
      {
        path: "register",
        ...lazyElement(RegisterPage),
      },
      {
        path: "forgot-password",
        ...lazyElement(ForgotPasswordPage),
      },
      {
        path: "reset-password",
        ...lazyElement(ResetPasswordPage),
      },
      {
        Component: Layout,
        children: [
          {
            path: "dashboard",
            ...lazyElement(DashboardPage),
          },
          {
            path: "about",
            ...lazyElement(AboutPage),
          },
          {
            path: "help",
            ...lazyElement(HelpPage),
          },
          {
            path: "notifications",
            ...lazyElement(NotificationsPage),
          },
          {
            path: "settings",
            ...lazyElement(SettingsPage),
          },
          {
            path: "farm_control_system/devices",
            ...lazyElement(FarmControlDevices),
          },
          {
            path: "farm_control_system/devices/gridstack/:deviceId",
            ...lazyElement(FarmGridStackOverview),
          },
          {
            path: "farm_control_system/devices/history/:deviceId",
            ...lazyElement(SensorHistoryPage),
          },
          {
            path: "farm_control_system/thresholds",
            ...lazyElement(ThresholdsPage),
          },
          {
            path: "farm_control_system/automation-rules",
            ...lazyElement(AutomationRulesPage),
          },
          {
            path: "farm_control_system/schedules",
            ...lazyElement(SchedulesPage),
          },
          {
            path: "farm_control_system/farms",
            ...lazyElement(FarmsPage),
          },
          {
            path: "farm_control_system/farms/:farmId",
            ...lazyElement(FarmDetailPage),
          },
          {
            path: "farm_control_system/analytics",
            ...lazyElement(AnalyticsPage),
          },
          {
            path: "farm_control_system/device-profiles",
            ...lazyElement(DeviceProfilesPage),
          },
        ],
      },
      {
        Component: AdminLayout,
        children: [
          {
            path: "admin/dashboard",
            ...lazyElement(AdminDashboardPage),
          },
          {
            path: "admin/users",
            ...lazyElement(AdminUsersPage),
          },
          {
            path: "admin/devices",
            ...lazyElement(AdminDevicesPage),
          },
          {
            path: "admin/sensors",
            ...lazyElement(AdminSensorsPage),
          },
          {
            path: "admin/audit-logs",
            ...lazyElement(AdminAuditLogsPage),
          },
          {
            path: "admin/device-logs",
            ...lazyElement(AdminDeviceLogsPage),
          },
          {
            path: "admin/notifications",
            ...lazyElement(AdminNotificationsPage),
          },
          {
            path: "admin/menus",
            ...lazyElement(AdminMenusPage),
          },
          {
            path: "admin/settings",
            ...lazyElement(AdminSettingsPage),
          },
        ],
      },
      {
        path: "*",
        ...lazyElement(PageNotFound),
      },
    ],
  },
]);
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
