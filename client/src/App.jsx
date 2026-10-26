import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LoginPage } from "./pages/LoginPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { ChangePasswordPage } from "./pages/ChangePasswordPage";
import { DashboardPage } from "./pages/DashboardPage";
import { TeamPage } from "./pages/TeamPage";
import { AuditPage } from "./pages/AuditPage";
import { WebStatsPage } from "./pages/WebStatsPage";
import { CustomersPage } from "./pages/CustomersPage";
import { CustomerFormPage } from "./pages/CustomerFormPage";
import { CustomerDetailPage } from "./pages/CustomerDetailPage";
import { GardenPage } from "./pages/GardenPage";
import { GardenFormPage } from "./pages/GardenFormPage";
import { RequestsPage } from "./pages/RequestsPage";
import { NewRequestPage } from "./pages/NewRequestPage";
import { RequestDetailPage } from "./pages/RequestDetailPage";
import { CalendarPage } from "./pages/CalendarPage";
import { PlannerPage } from "./pages/PlannerPage";
import { MaterialsPage } from "./pages/MaterialsPage";
import { VisitPage } from "./pages/VisitPage";
import { RoutePage } from "./pages/RoutePage";
import { PortalPage } from "./pages/PortalPage";

const STAFF_PAGES = [
  ["/customers", CustomersPage],
  ["/customers/new", CustomerFormPage],
  ["/customers/:id", CustomerDetailPage],
  ["/customers/:id/edit", CustomerFormPage],
  ["/customers/:customerId/gardens/new", GardenFormPage],
  ["/gardens/:id", GardenPage],
  ["/gardens/:id/edit", GardenFormPage],
  ["/requests", RequestsPage],
  ["/requests/new", NewRequestPage],
  ["/requests/:id", RequestDetailPage],
  ["/calendar", CalendarPage],
  ["/calendar/planner", PlannerPage],
  ["/calendar/route", RoutePage],
  ["/materials", MaterialsPage],
  ["/visits/:id", VisitPage],
];

export const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route
            path="/change-password"
            element={
              <ProtectedRoute allowPendingPasswordChange allowCustomer>
                <ChangePasswordPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/portal"
            element={
              <ProtectedRoute requireRole="CUSTOMER">
                <PortalPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/team"
            element={
              <ProtectedRoute requireRole="OWNER">
                <TeamPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/stats"
            element={
              <ProtectedRoute requireRole="OWNER">
                <WebStatsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/audit"
            element={
              <ProtectedRoute requireRole="OWNER">
                <AuditPage />
              </ProtectedRoute>
            }
          />
          {STAFF_PAGES.map(([path, Page]) => (
            <Route
              key={path}
              path={path}
              element={
                <ProtectedRoute>
                  <Page />
                </ProtectedRoute>
              }
            />
          ))}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
