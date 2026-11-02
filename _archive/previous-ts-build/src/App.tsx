import { AppShell } from "./components/layout/AppShell";
import { DashboardProvider } from "./context/DashboardContext";
import { DashboardPage } from "./pages/DashboardPage";

/** Standalone prototype entry. The main app should import from "./index.public" instead. */
export default function App() {
  return (
    <DashboardProvider>
      <AppShell>
        <DashboardPage />
      </AppShell>
    </DashboardProvider>
  );
}
