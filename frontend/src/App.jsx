import { Routes, Route, Navigate } from "react-router-dom"
import Login from "./pages/Login"
import Register from "./pages/Register"
import EmailVerified from "./pages/EmailVerified"
import ForgotPassword from "./pages/ForgotPassword"
import UpdatePassword from "./pages/UpdatePassword"
import Dashboard from "./pages/Dashboard"
import Harvest from "./pages/Harvest"
import Feed from "./pages/Feed"
import Mortality from "./pages/Mortality"
import Reports from "./pages/Reports"
import WorkerReports from "./pages/WorkerReports"
import Buildings from "./pages/Buildings"
import Inventory from "./pages/Inventory"
import Deliveries from "./pages/Deliveries"
import IngoingFeed from "./pages/IngoingFeed"
import Settings from "./pages/Settings"
import Users from "./pages/Users"
import ProtectedRoute from "./components/auth/ProtectedRoute"
import ToastContainer from "./components/ui/ToastContainer"
import { ToastProvider, useToast } from "./contexts/ToastContext"
import { getUserRole, isAuthenticated, roleHome } from "./lib/auth"

function AppRoutes() {
  const authed = isAuthenticated()
  const role = getUserRole()

  return (
    <Routes>
      {/* ROOT ROUTE */}
      <Route
        path="/"
        element={
          authed ? (
            <Navigate to={roleHome(role)} replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* PUBLIC ROUTES */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/email-verified" element={<EmailVerified />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/update-password" element={<UpdatePassword />} />

      {/* PROTECTED ROUTES */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute roles={["manager"]}>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/inventory"
        element={
          <ProtectedRoute roles={["manager"]}>
            <Inventory />
          </ProtectedRoute>
        }
      />

      <Route
        path="/deliveries"
        element={
          <ProtectedRoute roles={["manager"]}>
            <Deliveries />
          </ProtectedRoute>
        }
      />

      <Route
        path="/ingoing-feed"
        element={
          <ProtectedRoute roles={["manager"]}>
            <IngoingFeed />
          </ProtectedRoute>
        }
      />

      <Route
        path="/buildings"
        element={
          <ProtectedRoute roles={["manager"]}>
            <Buildings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/harvest"
        element={
          <ProtectedRoute roles={["worker"]}>
            <Harvest />
          </ProtectedRoute>
        }
      />

      <Route
        path="/feed"
        element={
          <ProtectedRoute roles={["worker"]}>
            <Feed />
          </ProtectedRoute>
        }
      />

      <Route
        path="/mortality"
        element={
          <ProtectedRoute roles={["worker"]}>
            <Mortality />
          </ProtectedRoute>
        }
      />

      <Route
        path="/my-reports"
        element={
          <ProtectedRoute roles={["worker"]}>
            <WorkerReports />
          </ProtectedRoute>
        }
      />

      <Route
        path="/reports"
        element={
          <ProtectedRoute roles={["manager"]}>
            <Reports />
          </ProtectedRoute>
        }
      />

      <Route
        path="/users"
        element={
          <ProtectedRoute roles={["admin"]}>
            <Users />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />


      {/* FALLBACK (IMPORTANT) */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function AppContent() {
  const { toasts, removeToast } = useToast()

  return (
    <>
      <AppRoutes />
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </>
  )
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  )
}
