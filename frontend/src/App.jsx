import "./App.css";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import SignUp from "./pages/auth/SignUp";
import SignIn from "./pages/auth/SignIn";
import Landing from "./pages/Landing";
import AuthLayout from "./layouts/AuthLayout";
import DashboardLayout from "./layouts/DashboardLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import Dashboard from "./pages/Dashboard/Dashboard";
import EmailVerification from "./pages/auth/EmailVerification";
import EmailVerificationPending from "./pages/auth/EmailVerificationPending";
import UploadReport from "./pages/Dashboard/UploadReport";
import TrackVitals from "./pages/Dashboard/TrackVitals";
import Profile from "./pages/Dashboard/Profile";
import Reports from "./pages/Dashboard/Reports";
import AdminVerifications from "./pages/Dashboard/AdminVerifications";
import DoctorPatients from "./pages/Dashboard/DoctorPatients";
import AccessRequests from "./pages/Dashboard/AccessRequests";
import EmergencyProfile from "./pages/Dashboard/EmergencyProfile";
import EmergencyView from "./pages/EmergencyView";
import Appointments from "./pages/Dashboard/Appointments";
import Medications from "./pages/Dashboard/Medications";
import AccessHistory from "./pages/Dashboard/AccessHistory";
import AdminAuditLogs from "./pages/Dashboard/AdminAuditLogs";
import LabUpload from "./pages/Dashboard/LabUpload";
import NotAuthorized from './pages/NotAuthorized';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />

        {/* Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<SignIn />} />
          <Route path="/signin" element={<Navigate to="/login" replace />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/auth/email-verification" element={<EmailVerificationPending />} />
          <Route path="/verify-email/:email" element={<EmailVerification />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/not-authorized" element={<NotAuthorized />} />
        </Route>

        {/* Protected Dashboard Routes (all roles) */}
        <Route element={
          <ProtectedRoute allowedRoles={["patient", "doctor", "lab", "admin"]}>
            <DashboardLayout />
          </ProtectedRoute>
        }>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
        </Route>

        {/* Patient-only self-service routes */}
        <Route element={
          <ProtectedRoute allowedRoles={["patient"]}>
            <DashboardLayout />
          </ProtectedRoute>
        }>
          <Route path="/upload-reports" element={<UploadReport />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/vitals" element={<TrackVitals />} />
        </Route>

        {/* Admin-only routes */}
        <Route element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <DashboardLayout />
          </ProtectedRoute>
        }>
          <Route path="/dashboard/admin-verifications" element={<AdminVerifications />} />
          <Route path="/dashboard/admin-audit-logs" element={<AdminAuditLogs />} />
        </Route>

        {/* Patient & Doctor routes (appointments) */}
        <Route element={
          <ProtectedRoute allowedRoles={["patient", "doctor"]}>
            <DashboardLayout />
          </ProtectedRoute>
        }>
          <Route path="/dashboard/appointments" element={<Appointments />} />
        </Route>

        {/* Doctor-only routes */}
        <Route element={
          <ProtectedRoute allowedRoles={["doctor"]}>
            <DashboardLayout />
          </ProtectedRoute>
        }>
          <Route path="/dashboard/doctor-patients" element={<DoctorPatients />} />
        </Route>

        {/* Patient-only routes */}
        <Route element={
          <ProtectedRoute allowedRoles={["patient"]}>
            <DashboardLayout />
          </ProtectedRoute>
        }>
          <Route path="/dashboard/access-requests" element={<AccessRequests />} />
          <Route path="/dashboard/emergency-profile" element={<EmergencyProfile />} />
          <Route path="/dashboard/medications" element={<Medications />} />
          <Route path="/dashboard/access-history" element={<AccessHistory />} />
        </Route>

        {/* Lab-only routes */}
        <Route element={
          <ProtectedRoute allowedRoles={["lab"]}>
            <DashboardLayout />
          </ProtectedRoute>
        }>
          <Route path="/dashboard/lab-upload" element={<LabUpload />} />
        </Route>

        {/* Public routes - no auth required */}
        <Route path="/emergency/:userId" element={<EmergencyView />} />

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;