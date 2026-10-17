import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import LandingPage from "./pages/LandingPage";
import HowItWorksPage from "./pages/HowItWorksPage";
import UseCasesPage from "./pages/UseCasesPage";
import UserGuidePage from "./pages/UserGuidePage";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import DashboardPage from "./pages/dashboard/DashboardPage";
import DecisionsPage from "./pages/dashboard/DecisionsPage";
import DecisionDetailPage from "./pages/dashboard/DecisionDetailPage";
import DecisionWizardPage from "./pages/wizard/DecisionWizardPage";
import ScenarioLabPage from "./pages/dashboard/ScenarioLabPage";
import SimulationRunDetailPage from "./pages/dashboard/SimulationRunDetailPage";
import WorkflowEditorPage from "./pages/dashboard/WorkflowEditorPage";
import WorkflowsPage from "./pages/dashboard/WorkflowsPage";
import ReportsPage from "./pages/dashboard/ReportsPage";
import SettingsPage from "./pages/dashboard/SettingsPage";
import BusinessDecisionWizard from "./pages/wizard/BusinessDecisionWizard";
import InventoryPage from "./pages/dashboard/InventoryPage";
import SuppliersPage from "./pages/dashboard/SuppliersPage";
import SalesPage from "./pages/dashboard/SalesPage";
import SharedDecisionPage from "./pages/SharedDecisionPage";
import PrivacyPage from "./pages/PrivacyPage";
import TermsPage from "./pages/TermsPage";
import NotFoundPage from "./pages/NotFoundPage";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center" data-testid="loading">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center" data-testid="loading">Loading...</div>;
  if (user) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/how-it-works" element={<HowItWorksPage />} />
      <Route path="/use-cases" element={<UseCasesPage />} />
      <Route path="/guide" element={<UserGuidePage />} />
      <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
      <Route path="/register" element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>} />
      <Route path="/forgot-password" element={<PublicOnlyRoute><ForgotPasswordPage /></PublicOnlyRoute>} />
      <Route path="/reset-password" element={<PublicOnlyRoute><ResetPasswordPage /></PublicOnlyRoute>} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/terms" element={<TermsPage />} />

      <Route path="/shared/:token" element={<SharedDecisionPage />} />

      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="wizard" element={<BusinessDecisionWizard />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="suppliers" element={<SuppliersPage />} />
        <Route path="sales" element={<SalesPage />} />
        <Route path="decisions" element={<DecisionsPage />} />
        <Route path="decisions/new" element={<DecisionWizardPage />} />
        <Route path="decisions/:id" element={<DecisionDetailPage />} />
        <Route path="decisions/:id/edit" element={<DecisionWizardPage />} />
        <Route path="scenarios" element={<ScenarioLabPage />} />
        <Route path="scenarios/:decisionId" element={<ScenarioLabPage />} />
        <Route path="decisions/:decisionId/simulations/runs/:runId" element={<SimulationRunDetailPage />} />
        <Route path="workflows" element={<WorkflowsPage />} />
        <Route path="workflows/:workflowId" element={<WorkflowEditorPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}