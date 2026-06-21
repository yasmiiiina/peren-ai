import { lazy, Suspense } from "react";
import { createBrowserRouter } from "react-router-dom";

import App from "../App";
import AuthCallback from "../pages/AuthCallback";
import LandingPage from "../pages/LandingPage";
import Login from "../pages/Login";
import PaymentFailure from "../pages/PaymentFailure";
import PaymentSuccess from "../pages/PaymentSuccess";
import { useAuth } from "../auth/useAuth";
import { ProtectedRoute } from "./ProtectedRoute";

const ScoreDashboard = lazy(() => import("../pages/ScoreDashboard"));
const DoctorDashboard = lazy(() => import("../pages/DoctorDashboard"));
const LabDashboard = lazy(() => import("../pages/LabDashboard"));
const ResearchDashboard = lazy(() => import("../pages/ResearchDashboard"));
const PharmaDashboard = lazy(() => import("../pages/PharmaDashboard"));
const Backoffice = lazy(() => import("../pages/Backoffice"));
const Onboarding = lazy(() => import("../pages/Onboarding"));
const FaceScanPage = lazy(() => import("../pages/FaceScanPage"));
const PricingPage = lazy(() => import("../pages/PricingPage"));
const BloodTestPage = lazy(() => import("../pages/BloodTestPage"));
const WearablesPage = lazy(() => import("../pages/WearablesPage"));

function PageLoader() {
  return <div className="min-h-[40vh] grid place-items-center text-slate-400">Loading...</div>;
}

function LazyPage({ children }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

function DashboardRouter() {
  const { user } = useAuth();
  const profile = user?.profile_type || "individu";

  if (profile === "medecin") {
    return <LazyPage><DoctorDashboard /></LazyPage>;
  }
  if (profile === "lab") {
    return <LazyPage><LabDashboard /></LazyPage>;
  }
  if (profile === "recherche") {
    return <LazyPage><ResearchDashboard /></LazyPage>;
  }
  if (profile === "pharma") {
    return <LazyPage><PharmaDashboard /></LazyPage>;
  }
  return <LazyPage><ScoreDashboard /></LazyPage>;
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
        element: <LandingPage />,
      },
      {
        path: "dashboard",
        element: (
          <ProtectedRoute>
            <DashboardRouter />
          </ProtectedRoute>
        ),
      },
      {
        path: "backoffice",
        element: (
          <ProtectedRoute>
            <LazyPage><Backoffice /></LazyPage>
          </ProtectedRoute>
        ),
      },
      {
        path: "onboarding",
        element: (
          <ProtectedRoute>
            <LazyPage><Onboarding /></LazyPage>
          </ProtectedRoute>
        ),
      },
      {
        path: "blood-test",
        element: <LazyPage><BloodTestPage /></LazyPage>,
      },
      {
        path: "wearables",
        element: <LazyPage><WearablesPage /></LazyPage>,
      },
      {
        path: "facescan",
        element: (
          <ProtectedRoute>
            <LazyPage><FaceScanPage /></LazyPage>
          </ProtectedRoute>
        ),
      },
      {
        path: "pricing",
        element: <LazyPage><PricingPage /></LazyPage>,
      },
      {
        path: "login",
        element: <Login />,
      },
      {
        path: "auth/callback",
        element: <AuthCallback />,
      },
      {
        path: "payment/success",
        element: (
          <ProtectedRoute>
            <LazyPage><PaymentSuccess /></LazyPage>
          </ProtectedRoute>
        ),
      },
      {
        path: "payment/failure",
        element: (
          <ProtectedRoute>
            <LazyPage><PaymentFailure /></LazyPage>
          </ProtectedRoute>
        ),
      },
    ],
  },
]);
