import { useNavigate } from "react-router-dom"
import { Menu } from "lucide-react"
import { useState } from "react"
import { clearSession, getUser } from "../../lib/auth"
import ConfirmModal from "../ui/ConfirmModal"

export default function Topbar({ onMenuClick }) {
  const navigate = useNavigate()
  const user = getUser()
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  const handleLogoutClick = () => {
    setShowLogoutModal(true)
  }

  const confirmLogout = () => {
    clearSession()
    navigate("/login")
  }

  return (
    <header className="h-16 bg-white border-b border-green-200 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30 shadow-sm">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden text-green-700 hover:text-green-900 p-2 -ml-2"
        >
          <Menu size={24} />
        </button>
        <h2 className="text-base sm:text-lg font-semibold text-green-900 truncate">
          {user?.name ? `Welcome, ${user.name}` : "Welcome"}
        </h2>
      </div>

      <button
        onClick={handleLogoutClick}
        className="text-sm text-green-700 hover:underline whitespace-nowrap"
      >
        Logout
      </button>

      <ConfirmModal
        open={showLogoutModal}
        title="Confirm Logout"
        message="Are you sure you want to logout? You will need to login again to access the system."
        confirmText="Logout"
        confirmColor="red"
        onConfirm={confirmLogout}
        onCancel={() => setShowLogoutModal(false)}
      />
    </header>
  )
}