import { Navigate } from "react-router-dom"
import { getUserRole, isAuthenticated, roleHome } from "../../lib/auth"

export default function ProtectedRoute({ children, roles }) {
  const authed = isAuthenticated()
  const role = getUserRole()

  if (!authed) return <Navigate to="/login" replace />

  if (roles && roles.length) {
    const allowed = Array.isArray(roles) ? roles : [roles]
    if (!allowed.includes(role)) {
      return <Navigate to={roleHome(role)} replace />
    }
  }

  return children
}
