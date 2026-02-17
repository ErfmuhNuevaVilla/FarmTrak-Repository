import DashboardLayout from "../components/layout/DashboardLayout"
import { useState, useEffect } from "react"
import ConfirmModal from "../components/ui/ConfirmModal"
import { apiFetch } from "../lib/api"
import { getToken } from "../lib/auth"
import { useToast } from "../contexts/ToastContext"

export default function Mortality() {
  const [count, setCount] = useState("")
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
        console.log('Mortality: Starting to fetch buildings...')
        const data = await apiFetch("/buildings")
        console.log('Mortality: Buildings data received:', data)
        setBuildings(data || [])
        console.log('Mortality: Buildings state set:', data || [])
      } catch (err) {
        console.error('Mortality: Failed to load buildings:', err)
        setError(err?.message || "Failed to load buildings")
      } finally {
        setLoadingBuildings(false)
      }
    }
    fetchBuildings()
  }, [])

  const getBuildingStock = (buildingId) => {
    if (!buildingId || buildingId === "") {
      console.warn('No building ID provided to getBuildingStock')
      return 0
    }
    
    // Check if buildings data is loaded
    if (!buildings || buildings.length === 0) {
      console.warn('Buildings data not loaded yet in getBuildingStock')
      return 0
    }
    
    const buildingIdNum = Number(buildingId)
    if (isNaN(buildingIdNum)) {
      console.warn('Invalid building ID provided to getBuildingStock:', buildingId)
      return 0
    }
    
    console.log('Looking for building with ID:', buildingIdNum, 'Available buildings:', buildings.map(b => ({ id: b.id, name: b.name, stock: b.stock_count })))
    
    const selectedBuilding = buildings.find(b => {
      // Try both number and string comparisons
      return b.id === buildingIdNum || String(b.id) === String(buildingIdNum)
    })
    
    if (!selectedBuilding) {
      console.warn('Building not found for ID:', buildingIdNum, 'Available buildings:', buildings.map(b => ({ id: b.id, name: b.name, stock: b.stock_count })))
      return 0
    }
    
    const stock = selectedBuilding.stock_count || 0
    console.log(`Building "${selectedBuilding.name}" (ID: ${buildingIdNum}) has stock count: ${stock}`)
    return stock
  }

  const handleMortalityChange = (e) => {
    const value = e.target.value
    
    // Only allow whole numbers
    if (value === '' || /^[0-9]*$/.test(value)) {
      setCount(value)
      setError("") // Clear error when input is valid
    } else {
      setError("Please enter whole numbers only (no decimals or letters).")
    }
  }

  const submit = async () => {
    if (!buildingId || !count) {
      setError("Please fill out all fields.")
      return
    }

    const countNum = Number(count)
    if (isNaN(countNum) || countNum < 0) {
      setError("Mortality count must be a valid non-negative number.")
      return
    }

    // Additional validation for whole numbers
    if (!Number.isInteger(countNum)) {
      setError("Mortality count must be a whole number (no decimals allowed).")
      return
    }

    // Validate against building stock count (silent validation)
    const buildingStock = getBuildingStock(buildingId)
    if (countNum > buildingStock) {
      setError("Mortality count cannot exceed the number of livestock in the selected building.")
      return
    }

    setLoading(true)
    setError("")

    try {
      const user = JSON.parse(localStorage.getItem('farmtrak_user'))
      const buildingIdNum = Number(buildingId)
      
      console.log('Mortality Debug:', {
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
      
      console.log('Mortality: Selected building:', selectedBuilding)
      
      await apiFetch("/reports", {
        method: "POST",
        body: JSON.stringify({
          report_type: "Mortality",
          building_id: buildingIdNum,
          building_name: selectedBuilding.name,
          user_id: user?.id || null,
          data_value: countNum,
          submitted_by: user?.name || "Unknown"
        })
      })

      setCount("")
      setBuildingId("")
      success("Mortality record saved successfully!")
    } catch (err) {
      console.error('Mortality: Submit error:', err)
      setError(err?.message || "Failed to save mortality record")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitClick = () => {
    if (!buildingId || !count) {
      setError("Please fill out all fields.")
      return
    }

    const countNum = Number(count)
    if (isNaN(countNum) || countNum < 0) {
      setError("Mortality count must be a valid non-negative number.")
      return
    }

    // Additional validation for whole numbers
    if (!Number.isInteger(countNum)) {
      setError("Mortality count must be a whole number (no decimals allowed).")
      return
    }

    // Validate against building stock count (silent validation)
    const buildingStock = getBuildingStock(buildingId)
    if (countNum > buildingStock) {
      setError("Mortality count cannot exceed the number of livestock in the selected building.")
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
        <h2 className="text-xl sm:text-2xl font-bold text-red-700">
          Mortality Recording
        </h2>
        <p className="text-xs sm:text-sm text-gray-600">
          Log daily poultry mortality per building
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
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
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

        {/* Mortality Count */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">
            Mortality Count
          </label>

          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={count}
            onChange={handleMortalityChange}
            placeholder="Enter number of mortalities"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
          />

          <p className="text-xs text-gray-500">
            Whole numbers only (no decimals or letters)
          </p>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmitClick}
          disabled={loading}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 rounded-lg transition disabled:opacity-60"
        >
          {loading ? "Saving..." : "Save Mortality"}
        </button>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        open={modalOpen}
        title="Confirm Mortality Recording"
        message={`Record ${count} mortalities in ${selectedBuilding?.name || "selected building"}?`}
        confirmText="Yes, Save"
        confirmColor="red"
        onConfirm={() => {
          submit()
          setModalOpen(false)
        }}
        onCancel={() => setModalOpen(false)}
      />
    </DashboardLayout>
  )
}
