import { useEffect, useState } from "react"
import DashboardLayout from "../components/layout/DashboardLayout"
import { apiFetch } from "../lib/api"
import { getToken, getUser, setSession, updateUser, verifyCurrentPassword } from "../lib/auth"
import { useToast } from "../contexts/ToastContext"
import PasswordChangeModal from "../components/ui/PasswordChangeModal"

export default function Settings() {
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState("")
  const { success, error: toastError } = useToast()

  // Pre-fill with current user info
  useEffect(() => {
    const user = getUser()
    if (user?.name) setName(user.name)
  }, [])

  const saveChanges = async () => {
    try {
      setLoading(true)
      
      const currentUser = getUser()
      if (!currentUser) throw new Error("Not authenticated")

      // Only update name if changed
      if (name && name !== currentUser.name) {
        const { user: updatedUser } = await updateUser({ name })
        
        // Update localStorage immediately
        setSession({
          token: getToken(),
          user: updatedUser
        })
      }

      success("Profile updated successfully")
    } catch (err) {
      toastError(err?.message || "Failed to update profile")
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async (oldPassword, newPassword) => {
    try {
      setPasswordLoading(true)
      setPasswordError("")
      
      const currentUser = getUser()
      if (!currentUser) throw new Error("Not authenticated")

      // Verify old password without affecting current session
      const { valid, error: verifyError } = await verifyCurrentPassword(currentUser.email, oldPassword)
      if (!valid) {
        throw new Error("Current password is incorrect")
      }

      // Update password
      const { user: updatedUser } = await updateUser({ password: newPassword })
      
      // Update localStorage immediately
      setSession({
        token: getToken(),
        user: updatedUser
      })

      success("Password changed successfully")
      setShowPasswordModal(false)
    } catch (err) {
      setPasswordError(err?.message || "Failed to change password")
    } finally {
      setPasswordLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-xl">
        <h2 className="text-2xl font-bold text-green-900 mb-2">
          User Settings
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          Update your personal information and password
        </p>

        {/* Current account info (read-only) */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-md space-y-3 mb-6">
          <h3 className="text-sm font-semibold text-gray-800">Current Account</h3>
          <div className="text-sm text-gray-700">
            <div className="flex items-center gap-2">
              <span className="font-medium">Name:</span>
              <span>{getUser()?.name || "Unknown user"}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Email:</span>
              <span>{getUser()?.email || "Unknown email"}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Role:</span>
              <span className="capitalize">{getUser()?.role || "worker"}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-md space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your name"
              className="
                w-full border-2 border-gray-400 rounded-lg px-3 py-2
                focus:outline-none focus:border-green-600
                focus:ring-2 focus:ring-green-200
              "
            />
          </div>

          {/* Password Reset Button */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <button
              onClick={() => setShowPasswordModal(true)}
              className="
                w-full bg-gray-100 hover:bg-gray-200
                text-gray-700 py-2 rounded-lg transition
                border-2 border-gray-300
              "
            >
              Reset Password
            </button>
          </div>

          <button
            onClick={saveChanges}
            disabled={loading}
            className="
              w-full bg-green-600 hover:bg-green-700
              text-white py-2 rounded-lg transition
              disabled:opacity-60
            "
          >
            Save Changes
          </button>
        </div>

        {/* Password Change Modal */}
        <PasswordChangeModal
          open={showPasswordModal}
          onClose={() => {
            setShowPasswordModal(false)
            setPasswordError("")
          }}
          onConfirm={handleChangePassword}
          loading={passwordLoading}
          error={passwordError}
        />
      </div>
    </DashboardLayout>
  )
}
