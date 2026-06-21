import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "./auth/useAuth";
import { Navbar } from "./components/Navbar";
import { DashboardLayout } from "./components/DashboardLayout";

export default function App() {
  const location = useLocation();
  const { user, loading } = useAuth();
  const isAuthRoute = location.pathname === "/login" || location.pathname === "/auth/callback";
  const isScoreDashboardRoute = location.pathname === "/dashboard";
  const isLandingRoute = location.pathname === "/";
  const isPricingRoute = location.pathname === "/pricing";
  const isBloodTestRoute = location.pathname === "/blood-test";
  const isWearablesRoute = location.pathname === "/wearables";
  const isPublicRoute = isLandingRoute || isScoreDashboardRoute || isPricingRoute || isBloodTestRoute || isWearablesRoute;

  if (!isAuthRoute) {
    if (loading) {
      return <div className="min-h-screen grid place-items-center text-[var(--color-text-muted)]">Vérification de la session...</div>;
    }

    if (!user && !isPublicRoute) {
      return <Navigate to="/login" replace />;
    }


  }

  if (isAuthRoute && !loading && user) {
    return <Navigate to="/dashboard" replace />;
  }

  const isImageBackgroundRoute = isAuthRoute;

  const appClass = isImageBackgroundRoute
    ? "min-h-screen bg-[var(--color-page-bg)] bg-[url('/young-fitness-instructor.jpg')] bg-cover bg-no-repeat bg-right bg-fixed text-[var(--color-page-text)]"
    : "min-h-screen bg-[var(--color-page-bg)] text-[var(--color-page-text)]";

  // Use DashboardLayout for all dashboard-specific views
  const isDashboardView = !isAuthRoute;

  if (isDashboardView) {
    return (
      <DashboardLayout>
        <Outlet />
      </DashboardLayout>
    );
  }

  const mainClass = isAuthRoute
    ? "min-h-[calc(100vh-92px)] grid items-center pt-2 px-4 pb-10"
    : "w-full p-0";

  return (
    <div className={appClass}>
      <Navbar />
      <main className={mainClass}>
        <Outlet />
      </main>
    </div>
  );
}

