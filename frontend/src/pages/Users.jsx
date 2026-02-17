import { useEffect, useState } from "react"
import DashboardLayout from "../components/layout/DashboardLayout"
import ConfirmModal from "../components/ui/ConfirmModal"
import PasswordResetModal from "../components/ui/PasswordResetModal"
import { apiFetch } from "../lib/api"
import { getToken, getUser, signUp, resetPassword, updateUserPassword } from "../lib/auth"
import { useToast } from "../contexts/ToastContext"

export default function Users() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [actionType, setActionType] = useState("") // "disable" or "enable"
  const [showAddUser, setShowAddUser] = useState(false)
  const [addUserLoading, setAddUserLoading] = useState(false)
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false)
  const [showPasswordReset, setShowPasswordReset] = useState(false)
  const { success, error: toastError } = useToast()
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "worker"
  })

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError("")
      
      // Use Supabase REST API to fetch users
      const data = await apiFetch("/users")
      
      setUsers(data || [])
    } catch (err) {
      setError(err?.message || "Failed to load users")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleDisableToggle = (user, action) => {
    setSelectedUser(user)
    setActionType(action)
    setModalOpen(true)
  }

  const confirmToggle = async () => {
    if (!selectedUser) return

    try {
      setError("")
      
      // Use Supabase REST API to update user
      await apiFetch(`/users?id=eq.${selectedUser.id}`, {
        method: "PATCH",
        body: JSON.stringify({ disabled: actionType === "disable" })
      })

      await fetchUsers()
      setModalOpen(false)
      setSelectedUser(null)
    } catch (err) {
      setError(err?.message || `Failed to ${actionType} user`)
      setModalOpen(false)
    }
  }

  const handleAddUser = async (e) => {
    e.preventDefault()
    setError("")

    if (newUser.password !== newUser.confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (newUser.password.length < 6) {
      setError("Password must be at least 6 characters long")
      return
    }

    setAddUserLoading(true)
    try {
      // Use Supabase signUp instead of old API
      const result = await signUp(
        newUser.email,
        newUser.password,
        newUser.name,
        newUser.role
      )

      // Reset form and refresh users list
      setNewUser({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "worker"
      })
      setShowAddUser(false)
      await fetchUsers()
      
      // Show success message
      setError("")
      success(`User "${newUser.name}" created successfully! They can now login with their credentials.`)
    } catch (err) {
      setError(err?.message || "Failed to create user")
    } finally {
      setAddUserLoading(false)
    }
  }

  const handleNewUserChange = (e) => {
    setNewUser({ ...newUser, [e.target.name]: e.target.value })
  }

  const handlePasswordReset = (user) => {
    setSelectedUser(user)
    setShowPasswordReset(true)
    setError("")
  }

  const confirmPasswordReset = async (newPassword) => {
    if (!selectedUser) return

    setResetPasswordLoading(true)
    try {
      setError("")
      
      // Use the new admin password update function
      await updateUserPassword(selectedUser.id, newPassword)
      
      setShowPasswordReset(false)
      setSelectedUser(null)
      setError("")
      
      // Show success message
      success(`Password for "${selectedUser.name}" has been successfully updated!`)
    } catch (err) {
      console.error('Password update error:', err)
      setError(err?.message || "Failed to update password. Admin privileges may be required.")
    } finally {
      setResetPasswordLoading(false)
    }
  }

  return (
    <DashboardLayout>

      {/* Header */}
      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Users Management</h1>
          <p className="text-xs sm:text-sm text-gray-600">View all users in the system.</p>
        </div>
        <button
          onClick={() => setShowAddUser(!showAddUser)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
        >
          {showAddUser ? "Cancel" : "Add New User"}
        </button>
      </div>

      {/* Add User Form */}
      {showAddUser && (
        <div className="bg-white shadow rounded-xl p-4 sm:p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Create New User</h2>
          <form onSubmit={handleAddUser} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={newUser.name}
                  onChange={handleNewUserChange}
                  required
                  placeholder="Enter full name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={newUser.email}
                  onChange={handleNewUserChange}
                  required
                  placeholder="Enter email address"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  name="role"
                  value={newUser.role}
                  onChange={handleNewUserChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="worker">Worker</option>
                  <option value="manager">Manager</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  name="password"
                  value={newUser.password}
                  onChange={handleNewUserChange}
                  required
                  placeholder="Enter password (min 6 characters)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={newUser.confirmPassword}
                  onChange={handleNewUserChange}
                  required
                  placeholder="Confirm password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowAddUser(false)
                  setNewUser({
                    name: "",
                    email: "",
                    password: "",
                    confirmPassword: "",
                    role: "worker"
                  })
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={addUserLoading}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {addUserLoading ? "Creating..." : "Create User"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Content Card */}
      <div className="bg-white shadow rounded-xl p-4 sm:p-6">

        {loading ? (
              <p className="text-gray-600 text-sm sm:text-base">Loading users…</p>
            ) : users.length === 0 ? (
              <p className="text-gray-600">No users found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200" style={{ minWidth: '700px' }}>
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => {
                      const currentUser = getUser()
                      const isCurrentUser = currentUser?.id === user.id
                      
                      return (
                        <tr key={user.id} className={user.disabled ? "bg-gray-50 opacity-75" : ""}>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                            {user.name}
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-gray-700">
                            {user.email}
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-xs sm:text-sm font-semibold text-green-700">
                            {user.role}
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              user.disabled 
                                ? "bg-red-100 text-red-800" 
                                : "bg-green-100 text-green-800"
                            }`}>
                              {user.disabled ? "Disabled" : "Active"}
                            </span>
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                            {new Date(user.created_at).toLocaleString()}
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap">
                            {!isCurrentUser && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handlePasswordReset(user)}
                                  className="px-2 sm:px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white transition text-xs sm:text-sm"
                                >
                                  Reset Password
                                </button>
                                <button
                                  onClick={() => handleDisableToggle(user, user.disabled ? "enable" : "disable")}
                                  className={`px-2 sm:px-3 py-1 rounded transition text-xs sm:text-sm ${
                                    user.disabled
                                      ? "bg-green-600 hover:bg-green-700 text-white"
                                      : "bg-red-600 hover:bg-red-700 text-white"
                                  }`}
                                >
                                  {user.disabled ? "Enable" : "Disable"}
                                </button>
                              </div>
                            )}
                            {isCurrentUser && (
                              <span className="text-xs sm:text-sm text-gray-400 italic">
                                Current user
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
      </div>

      {/* Confirm Modal */}
      <ConfirmModal
        open={modalOpen}
        title={actionType === "disable" ? "Disable User Account" : "Enable User Account"}
        message={
          actionType === "disable"
            ? `Are you sure you want to disable "${selectedUser?.name}"? They will not be able to log in until their account is re-enabled.`
            : `Are you sure you want to enable "${selectedUser?.name}"? They will be able to log in again.`
        }
        confirmText={actionType === "disable" ? "Yes, Disable" : "Yes, Enable"}
        confirmColor={actionType === "disable" ? "red" : "green"}
        onConfirm={confirmToggle}
        onCancel={() => {
          setModalOpen(false)
          setSelectedUser(null)
        }}
      />

      {/* Password Reset Modal */}
      <PasswordResetModal
        open={showPasswordReset}
        user={selectedUser}
        onClose={() => {
          setShowPasswordReset(false)
          setSelectedUser(null)
          setError("")
        }}
        onConfirm={confirmPasswordReset}
        loading={resetPasswordLoading}
        error={error}
      />
    </DashboardLayout>
  )
}

