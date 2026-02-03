import DashboardLayout from "../components/layout/DashboardLayout"
import { useEffect, useState } from "react"
import { apiFetch } from "../lib/api"
import { getToken } from "../lib/auth"
import ConfirmModal from "../components/ui/ConfirmModal"
import InputModal from "../components/ui/InputModal"

export default function Buildings() {
  const [buildings, setBuildings] = useState([])
  const [name, setName] = useState("")
  const [stocks, setStocks] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [inputModalOpen, setInputModalOpen] = useState(false)
  const [actionType, setActionType] = useState("")
  const [selectedBuilding, setSelectedBuilding] = useState(null)

  const fetchBuildings = async () => {
    try {
      setLoading(true)
      setError("")
      const token = getToken()
      if (!token) {
        setError("Not authenticated")
        return
      }
      const data = await apiFetch("/api/buildings", { token })
      setBuildings(data || [])
    } catch (err) {
      setError(err?.message || "Failed to load buildings")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBuildings()
  }, [])

  const addBuilding = async () => {
    if (!name || !stocks) {
      alert("Please fill out all fields.")
      return
    }

    const stockNum = Number(stocks)
    if (isNaN(stockNum) || stockNum < 0) {
      alert("Stock count must be a valid non-negative number.")
      return
    }

    try {
      setError("")
      const token = getToken()
      if (!token) {
        setError("Not authenticated")
        return
      }
      await apiFetch("/api/buildings", {
        token,
        method: "POST",
        body: JSON.stringify({ name, stock_count: stockNum })
      })
      setName("")
      setStocks("")
      await fetchBuildings()
    } catch (err) {
      alert(err?.message || "Failed to add building")
    }
  }

  const confirmCullOut = async (id) => {
    try {
      setError("")
      const token = getToken()
      if (!token) {
        setError("Not authenticated")
        return
      }
      await apiFetch(`/api/buildings/${id}/cull`, {
        token,
        method: "PUT"
      })
      await fetchBuildings()
    } catch (err) {
      alert(err?.message || "Failed to cull building")
    }
  }

  const confirmDelete = async (id) => {
    try {
      setError("")
      const token = getToken()
      if (!token) {
        setError("Not authenticated")
        return
      }
      await apiFetch(`/api/buildings/${id}`, {
        token,
        method: "DELETE"
      })
      await fetchBuildings()
    } catch (err) {
      alert(err?.message || "Failed to delete building")
    }
  }

  const addLivestock = async (amount) => {
    if (!selectedBuilding) return

    const stockNum = Number(amount)
    if (isNaN(stockNum) || stockNum < 0) {
      alert("Stock count must be a valid non-negative number.")
      return
    }

    try {
      setError("")
      const token = getToken()
      if (!token) {
        setError("Not authenticated")
        return
      }
      await apiFetch(`/api/buildings/${selectedBuilding.id}/stock`, {
        token,
        method: "PUT",
        body: JSON.stringify({ stock_count: stockNum })
      })
      await fetchBuildings()
      setInputModalOpen(false)
    } catch (err) {
      alert(err?.message || "Failed to add livestock")
    }
  }

  

  return (
    <DashboardLayout>
      {/* Page Header */}
      <div className="mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-green-900">
          Buildings Overview
        </h2>
        <p className="text-xs sm:text-sm text-gray-600">
          Manage farm buildings and livestock stocks
        </p>
      </div>

      {/* Add Building Card */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-md w-full max-w-lg mb-6 sm:mb-8 space-y-4">
        <h3 className="font-semibold text-lg text-gray-800">
          Add New Building
        </h3>

        {/* Building Name */}
        <input
          type="text"
          placeholder="Building Name"
          value={name}
          onChange={e => setName(e.target.value)}
          className="
            w-full bg-white border-2 border-gray-400 rounded-lg
            px-3 py-2 text-gray-900 placeholder-gray-500
            focus:outline-none focus:border-green-600
            focus:ring-2 focus:ring-green-200
          "
        />

        {/* Livestock Count */}
        <input
          type="text"
          inputMode="numeric"
          placeholder="Number of Livestock"
          value={stocks}
          onChange={e => setStocks(e.target.value)}
          className="
            w-full bg-white border-2 border-gray-400 rounded-lg
            px-3 py-2 text-gray-900 placeholder-gray-500
            focus:outline-none focus:border-green-600
            focus:ring-2 focus:ring-green-200
          "
        />

        <button
          onClick={addBuilding}
          className="
            w-full bg-green-600 hover:bg-green-700
            text-white py-2 rounded-lg transition
          "
        >
          Add Building
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Buildings Table */}
      <div className="bg-white rounded-2xl shadow-md overflow-hidden">
        {loading ? (
          <div className="p-4 text-center text-gray-600 text-sm sm:text-base">Loading buildings...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[400px]">
              <thead className="bg-green-100 text-green-900">
                <tr>
                  <th className="p-2 sm:p-3 text-xs sm:text-sm">Building</th>
                  <th className="p-2 sm:p-3 text-xs sm:text-sm">Livestock</th>
                  <th className="p-2 sm:p-3 text-xs sm:text-sm">Actions</th>
                </tr>
              </thead>

              <tbody>
                {buildings.map(b => (
                  <tr key={b.id} className="border-t">
                    <td className="p-2 sm:p-3 text-green-900 text-xs sm:text-sm">{b.name}</td>
                    <td className="p-2 sm:p-3 font-semibold text-green-900 text-xs sm:text-sm">{b.stock_count}</td>
                    <td className="p-2 sm:p-3">
                      <div className="flex flex-wrap gap-2">
                        {b.stock_count === 0 ? (
                          <button
                            onClick={() => {
                              setSelectedBuilding(b)
                              setInputModalOpen(true)
                            }}
                            className="
                              bg-green-600 hover:bg-green-700
                              text-white px-2 sm:px-3 py-1 rounded transition text-xs sm:text-sm
                            "
                          >
                            Add Livestock
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedBuilding(b)
                              setActionType("cull")
                              setModalOpen(true)
                            }}
                            className="
                              bg-yellow-500 hover:bg-yellow-600
                              text-white px-2 sm:px-3 py-1 rounded transition text-xs sm:text-sm
                            "
                          >
                            Cull-Out
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setSelectedBuilding(b)
                            setActionType("delete")
                            setModalOpen(true)
                          }}
                          className="
                            bg-red-600 hover:bg-red-700
                            text-white px-2 sm:px-3 py-1 rounded transition text-xs sm:text-sm
                          "
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {buildings.length === 0 && (
                  <tr>
                    <td colSpan="3" className="p-4 text-center text-gray-500 text-sm sm:text-base">
                      No buildings found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        open={modalOpen}
        title={
          actionType === "cull"
            ? "Confirm Cull-Out"
            : "Confirm Delete"
        }
        message={
          actionType === "cull"
            ? `This will set the livestock count of "${selectedBuilding?.name}" to zero.`
            : `This will permanently delete "${selectedBuilding?.name}". This action cannot be undone.`
        }
        confirmText={actionType === "cull" ? "Yes, Cull-Out" : "Yes, Delete"}
        confirmColor={actionType === "cull" ? "yellow" : "red"}
        onConfirm={() => {
          if (actionType === "cull") {
            confirmCullOut(selectedBuilding.id)
          } else {
            confirmDelete(selectedBuilding.id)
          }
          setModalOpen(false)
        }}
        onCancel={() => setModalOpen(false)}
      />

      {/* Add Livestock Input Modal */}
      <InputModal
        open={inputModalOpen}
        title="Add Livestock"
        message={`Enter the number of livestock to add to "${selectedBuilding?.name}".`}
        inputLabel="Number of Livestock"
        inputPlaceholder="Enter livestock count"
        inputType="number"
        confirmText="Add Livestock"
        confirmColor="green"
        onConfirm={addLivestock}
        onCancel={() => setInputModalOpen(false)}
      />
    </DashboardLayout>
  )
}
