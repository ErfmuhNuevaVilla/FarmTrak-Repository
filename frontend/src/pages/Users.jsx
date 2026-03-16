import { useEffect, useState } from "react"
import DashboardLayout from "../components/layout/DashboardLayout"
import ConfirmModal from "../components/ui/ConfirmModal"
import { apiFetch } from "../lib/api"
import { getToken, getUser } from "../lib/auth"
import { useToast } from "../contexts/ToastContext"

export default function Users() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [actionType, setActionType] = useState("") // "disable" or "enable"
  const { success, error: toastError } = useToast()

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


  return (
    <DashboardLayout>

      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Users Management</h1>
          <p className="text-xs sm:text-sm text-gray-600">View all users in the system.</p>
        </div>
      </div>

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

    </DashboardLayout>
  )
}

