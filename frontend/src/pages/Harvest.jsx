import DashboardLayout from "../components/layout/DashboardLayout"
import { useState, useEffect } from "react"
import ConfirmModal from "../components/ui/ConfirmModal"
import { apiFetch } from "../lib/api"
import { getToken } from "../lib/auth"
import { useToast } from "../contexts/ToastContext"

export default function Harvest() {
  const [eggs, setEggs] = useState("")
  const [buildingId, setBuildingId] = useState("")
  const [buildings, setBuildings] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [error, setError] = useState("")
  const [loadingBuildings, setLoadingBuildings] = useState(true)
  const { success } = useToast()

  useEffect(() => {
    const fetchBuildings = async () => {
      try {
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
        setLoadingBuildings(false)
      }
    }
    fetchBuildings()
  }, [])

  const submit = async () => {
    if (!buildingId || !eggs) {
      setError("Please fill out all fields.")
      return
    }

    const eggsNum = Number(eggs)
    if (isNaN(eggsNum) || eggsNum < 0) {
      setError("Egg count must be a valid non-negative number.")
      return
    }

    setLoading(true)
    setError("")

    try {
      const token = getToken()
      if (!token) {
        setError("Not authenticated")
        return
      }

      await apiFetch("/api/reports/harvest", {
        token,
        method: "POST",
        body: JSON.stringify({ eggs: eggsNum, building_id: Number(buildingId) })
      })

      setEggs("")
      setBuildingId("")
      success("Harvest saved successfully!")
    } catch (err) {
      setError(err?.message || "Failed to save harvest")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitClick = () => {
    if (!buildingId || !eggs) {
      setError("Please fill out all fields.")
      return
    }
    const eggsNum = Number(eggs)
    if (isNaN(eggsNum) || eggsNum < 0) {
      setError("Egg count must be a valid non-negative number.")
      return
    }
    setError("")
    setModalOpen(true)
  }

  const selectedBuilding = buildings.find(b => b.id === Number(buildingId))

  return (
    <DashboardLayout>
      {/* Page Header */}
      <div className="mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-green-900">
          Egg Harvest Recording
        </h2>
        <p className="text-xs sm:text-sm text-gray-600">
          Record daily egg collection per building
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 max-w-md">
          {error}
        </div>
      )}

      {/* Form Card */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-md w-full max-w-md space-y-4 sm:space-y-5">
        
        {/* Building Dropdown */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">
            Building
          </label>

          <select
            value={buildingId}
            onChange={e => setBuildingId(e.target.value)}
            disabled={loadingBuildings}
            className="
              w-full
              border
              border-gray-300
              rounded-lg
              px-3
              py-2
              text-gray-900
              bg-white
              focus:outline-none
              focus:ring-2
              focus:ring-green-500
              disabled:opacity-50
              disabled:cursor-not-allowed
            "
          >
            <option value="">Select a building</option>
            {buildings.map(building => (
              <option key={building.id} value={building.id}>
                {building.name}
              </option>
            ))}
          </select>

          {loadingBuildings && (
            <p className="text-xs text-gray-500">Loading buildings...</p>
          )}
        </div>

        {/* Egg Count Input */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">
            Egg Count
          </label>

          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={eggs}
            onChange={e => setEggs(e.target.value)}
            placeholder="Enter total eggs collected"
            className="
              w-full
              border
              border-gray-300
              rounded-lg
              px-3
              py-2
              text-gray-900
              bg-white
              focus:outline-none
              focus:ring-2
              focus:ring-green-500
            "
          />

          <p className="text-xs text-gray-500">
            Numbers only (no commas)
          </p>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmitClick}
          disabled={loading}
          className="
            w-full
            bg-green-600
            hover:bg-green-700
            text-white
            font-medium
            py-2.5
            rounded-lg
            transition
            disabled:opacity-60
          "
        >
          {loading ? "Saving..." : "Save Harvest"}
        </button>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        open={modalOpen}
        title="Confirm Harvest Recording"
        message={`Record ${eggs} eggs collected from ${selectedBuilding?.name || "selected building"}?`}
        confirmText="Yes, Save"
        confirmColor="green"
        onConfirm={() => {
          submit()
          setModalOpen(false)
        }}
        onCancel={() => setModalOpen(false)}
      />
    </DashboardLayout>
  )
}
