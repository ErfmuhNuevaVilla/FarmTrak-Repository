import DashboardLayout from "../components/layout/DashboardLayout"
import { useState, useEffect } from "react"
import ConfirmModal from "../components/ui/ConfirmModal"
import { apiFetch } from "../lib/api"
import { getToken } from "../lib/auth"
import { useToast } from "../contexts/ToastContext"

export default function Harvest() {
  const [eggs, setEggs] = useState("")
  const [buildingId, setBuildingId] = useState("")
  const [workerName, setWorkerName] = useState("")
  const [buildings, setBuildings] = useState([])
  const [allBuildings, setAllBuildings] = useState([]) // For validation
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [error, setError] = useState("")
  const [loadingBuildings, setLoadingBuildings] = useState(true)
  const { success } = useToast()

  useEffect(() => {
    const fetchBuildings = async () => {
      try {
        console.log('Harvest: Starting to fetch buildings...')
        const data = await apiFetch("/buildings")
        console.log('Harvest: Buildings data received:', data)
        // Store all buildings for validation
        setAllBuildings(data || [])
        // Filter out maintenance buildings for dropdown
        const activeBuildings = (data || []).filter(building => !building.maintenance)
        console.log('Harvest: Active buildings (filtered):', activeBuildings)
        setBuildings(activeBuildings)
        console.log('Harvest: Buildings state set:', activeBuildings)
      } catch (err) {
        console.error('Harvest: Failed to load buildings:', err)
        setError(err?.message || "Failed to load buildings")
      } finally {
        setLoadingBuildings(false)
      }
    }
    fetchBuildings()
  }, [])

  const validateEggInput = (value) => {
    // Allow only whole numbers (no decimals, no letters, no negatives)
    const wholeNumberRegex = /^[0-9]*$/
    return wholeNumberRegex.test(value)
  }

  const handleEggChange = (e) => {
    const value = e.target.value
    
    // Only allow whole numbers
    if (value === '' || validateEggInput(value)) {
      setEggs(value)
      setError("") // Clear error when input is valid
    } else {
      setError("Please enter whole numbers only (no decimals or letters).")
    }
  }

  const submit = async () => {
    if (!buildingId || !eggs || !workerName.trim()) {
      setError("Please fill out all fields.")
      return
    }

    const eggsNum = Number(eggs)
    if (isNaN(eggsNum) || eggsNum < 0) {
      setError("Egg count must be a valid non-negative number.")
      return
    }

    // Additional validation for whole numbers
    if (!Number.isInteger(eggsNum)) {
      setError("Egg count must be a whole number (no decimals allowed).")
      return
    }

    setLoading(true)
    setError("")

    try {
      const user = JSON.parse(localStorage.getItem('farmtrak_user'))
      const buildingIdNum = Number(buildingId)
      
      console.log('Harvest Debug:', {
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
      
      console.log('Harvest: Selected building:', selectedBuilding)
      
      await apiFetch("/reports", {
        method: "POST",
        body: JSON.stringify({
          report_type: "Egg Harvest",
          building_id: buildingIdNum,
          building_name: selectedBuilding.name,
          user_id: user?.id || null,
          data_value: eggsNum,
          submitted_by: user?.name || "Unknown",
          worker_name: workerName.trim()
        })
      })

      setEggs("")
      setBuildingId("")
      setWorkerName("")
      success("Harvest saved successfully!")
    } catch (err) {
      console.error('Harvest: Submit error:', err)
      setError(err?.message || "Failed to save harvest")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitClick = () => {
    if (!buildingId || !eggs || !workerName.trim()) {
      setError("Please fill out all fields.")
      return
    }
    
    // Check if selected building has 0 livestock using all buildings
    console.log('Harvest validation - buildingId:', buildingId)
    console.log('Harvest validation - buildingId type:', typeof buildingId)
    console.log('Harvest validation - allBuildings:', allBuildings)
    console.log('Harvest validation - allBuildings.length:', allBuildings?.length)
    
    // Make sure all buildings data is available
    if (!allBuildings || allBuildings.length === 0) {
      setError("Building data not loaded. Please wait and try again.")
      return
    }
    
    // Try multiple ways to find the building
    let selectedBuilding = allBuildings.find(b => b.id === Number(buildingId))
    console.log('Harvest validation - selectedBuilding (Number match):', selectedBuilding)
    
    // If not found, try string comparison
    if (!selectedBuilding) {
      selectedBuilding = allBuildings.find(b => String(b.id) === String(buildingId))
      console.log('Harvest validation - selectedBuilding (String match):', selectedBuilding)
    }
    
    // If still not found, try parsing as number again
    if (!selectedBuilding) {
      const buildingIdNum = parseInt(buildingId, 10)
      if (!isNaN(buildingIdNum)) {
        selectedBuilding = allBuildings.find(b => b.id === buildingIdNum)
        console.log('Harvest validation - selectedBuilding (Parsed Number):', selectedBuilding)
      }
    }
    
    console.log('Harvest validation - final selectedBuilding:', selectedBuilding)
    console.log('Harvest validation - stock_count:', selectedBuilding?.stock_count)
    console.log('Harvest validation - stock_count type:', typeof selectedBuilding?.stock_count)
    
    if (!selectedBuilding) {
      console.log('Harvest validation - ERROR: Building not found after all attempts')
      setError(`Selected building not found. Building ID: ${buildingId}`)
      return
    }
    
    if (selectedBuilding.stock_count === 0) {
      console.log('Harvest validation - BLOCKING: Building has 0 livestock')
      setError("Cannot submit harvest report for buildings with 0 livestock.")
      return
    }
    
    const eggsNum = Number(eggs)
    if (isNaN(eggsNum) || eggsNum < 0) {
      setError("Egg count must be a valid non-negative number.")
      return
    }
    // Additional validation for whole numbers
    if (!Number.isInteger(eggsNum)) {
      setError("Egg count must be a whole number (no decimals allowed).")
      return
    }
    
    // All validations passed - clear error and open modal
    setError("")
    setModalOpen(true)
  }

  // Get selected building for modal display
  const selectedBuilding = allBuildings.find(b => b.id === Number(buildingId))

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
            onChange={handleEggChange}
            placeholder="Enter total trays collected"
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
            Whole numbers only (no decimals or letters)
          </p>
        </div>

        {/* Worker Name Input */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">
            Worker Name
          </label>

          <input
            type="text"
            value={workerName}
            onChange={(e) => setWorkerName(e.target.value)}
            placeholder="Enter worker name"
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
            Name of the worker who performed the harvest
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
