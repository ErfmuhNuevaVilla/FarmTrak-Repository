import DashboardLayout from "../components/layout/DashboardLayout"
import { useState, useEffect } from "react"
import ConfirmModal from "../components/ui/ConfirmModal"
import { apiFetch } from "../lib/api"
import { getToken } from "../lib/auth"
import { useToast } from "../contexts/ToastContext"

export default function Feed() {
  const [feedBags, setFeedBags] = useState("")
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
        console.log('Feed: Starting to fetch buildings...')
        const data = await apiFetch("/buildings")
        console.log('Feed: Buildings data received:', data)
        setBuildings(data || [])
        console.log('Feed: Buildings state set:', data || [])
      } catch (err) {
        console.error('Feed: Failed to load buildings:', err)
        setError(err?.message || "Failed to load buildings")
      } finally {
        setLoadingBuildings(false)
      }
    }
    fetchBuildings()
  }, [])

  const validateFeedInput = (value) => {
    // Allow only whole numbers (no decimals, no letters, no negatives)
    const wholeNumberRegex = /^[0-9]*$/
    return wholeNumberRegex.test(value)
  }

  const handleFeedChange = (e) => {
    const value = e.target.value
    
    // Only allow whole numbers
    if (value === '' || validateFeedInput(value)) {
      setFeedBags(value)
      setError("") // Clear error when input is valid
    } else {
      setError("Please enter whole numbers only (no decimals or letters).")
    }
  }

  const submit = async () => {
    if (!buildingId || !feedBags) {
      setError("Please fill out all fields.")
      return
    }

    const feedNum = Number(feedBags)
    if (isNaN(feedNum) || feedNum < 0) {
      setError("Feed amount must be a valid non-negative number.")
      return
    }

    // Additional validation for whole numbers
    if (!Number.isInteger(feedNum)) {
      setError("Feed amount must be a whole number (no decimals allowed).")
      return
    }

    setLoading(true)
    setError("")

    try {
      const user = JSON.parse(localStorage.getItem('farmtrak_user'))
      const buildingIdNum = Number(buildingId)
      
      console.log('Feed Debug:', {
        buildingId,
        buildingIdNum,
        buildingsLength: buildings.length,
        buildings: buildings.map(b => ({ id: b.id, name: b.name }))
      })
      
      // More robust building lookup
      let selectedBuilding = buildings.find(b => b.id === buildingIdNum)
      
      // If not found by ID, try string comparison (in case IDs are strings)
      if (!selectedBuilding) {
        selectedBuilding = buildings.find(b => String(b.id) === String(buildingId))
      }
      
      // Final fallback - create a building object with the ID
      if (!selectedBuilding) {
        console.warn('Building not found in list, creating fallback object')
        selectedBuilding = {
          id: buildingIdNum,
          name: `Building ${buildingIdNum}`
        }
      }
      
      console.log('Feed: Selected building:', selectedBuilding)
      
      await apiFetch("/reports", {
        method: "POST",
        body: JSON.stringify({
          report_type: "Feed Usage",
          building_id: buildingIdNum,
          building_name: selectedBuilding.name,
          user_id: user?.id || null,
          data_value: feedNum,
          submitted_by: user?.name || "Unknown"
        })
      })

      setFeedBags("")
      setBuildingId("")
      success("Feed usage recorded successfully!")
    } catch (err) {
      console.error('Feed: Submit error:', err)
      setError(err?.message || "Failed to record feed usage")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitClick = () => {
    if (!buildingId || !feedBags) {
      setError("Please fill out all fields.")
      return
    }
    const feedNum = Number(feedBags)
    if (isNaN(feedNum) || feedNum < 0) {
      setError("Feed amount must be a valid non-negative number.")
      return
    }
    // Additional validation for whole numbers
    if (!Number.isInteger(feedNum)) {
      setError("Feed amount must be a whole number (no decimals allowed).")
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
          Feed Usage Recording
        </h2>
        <p className="text-xs sm:text-sm text-gray-600">
          Record daily feed consumption per building
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
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
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

        {/* Feed Input */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">
            Feed Used (Bags)
          </label>

          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={feedBags}
            onChange={handleFeedChange}
            placeholder="Enter feed used in Bags"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
          />

          <p className="text-xs text-gray-500">
            Whole numbers only (no decimals or letters)
          </p>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmitClick}
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 rounded-lg transition disabled:opacity-60"
        >
          {loading ? "Saving..." : "Save Feed Usage"}
        </button>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        open={modalOpen}
        title="Confirm Feed Usage Recording"
        message={`Record ${feedBags} bags of feed used in ${selectedBuilding?.name || "selected building"}?`}
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
