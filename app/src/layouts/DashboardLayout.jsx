import { Outlet } from "react-router";
import { DashboardLayout } from "@toolpad/core/DashboardLayout";
import { PageContainer } from "@toolpad/core/PageContainer";

import ErrorBoundary from "../components/ErrorBoundary";
import AppToolbarActions from "../components/AppToolbarActions";

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
