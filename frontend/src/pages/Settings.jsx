import { useEffect, useState } from "react"
import DashboardLayout from "../components/layout/DashboardLayout"
import { apiFetch } from "../lib/api"
import { getToken, getUser, setSession } from "../lib/auth"
import { useToast } from "../contexts/ToastContext"

export default function Settings() {
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const { success, error: toastError } = useToast()

  // Pre-fill with current user info
  useEffect(() => {
    const user = getUser()
    if (user?.name) setName(user.name)
  }, [])

  const saveChanges = async () => {
    try {
      setLoading(true)
      const token = getToken()
      if (!token) throw new Error("Not authenticated")

      const res = await apiFetch("/api/users/me", {
        token,
        method: "PUT",
        body: JSON.stringify({
          name,
          ...(password && { password })
        })
      })

      // Update stored user so Topbar + Settings reflect the new name immediately
      if (res?.user) {
        setSession({ token, user: res.user })
      }

      success("Profile updated successfully")
      setPassword("")
    } catch (err) {
      toastError(err?.message || "Failed to update profile")
    } finally {
      setLoading(false)
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
              <span className="font-medium">Password:</span>
              <span>•••••• (hidden for security)</span>
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

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Leave blank to keep current password"
              className="
                w-full border-2 border-gray-400 rounded-lg px-3 py-2
                focus:outline-none focus:border-green-600
                focus:ring-2 focus:ring-green-200
              "
            />
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
      </div>
    </DashboardLayout>
  )
}
