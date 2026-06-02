import { DashboardErrorBoundary } from "./ErrorBoundary";
import { DashboardClient } from "./DashboardClient";

export default function DashboardPage() {
  return (
    <DashboardErrorBoundary>
      <DashboardClient />
    </DashboardErrorBoundary>
  );
}
