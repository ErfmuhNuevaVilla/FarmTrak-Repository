import DashboardLayout from "../components/layout/DashboardLayout"
import { useState, useEffect } from "react"
import ConfirmModal from "../components/ui/ConfirmModal"
import { apiFetch } from "../lib/api"
import { getToken } from "../lib/auth"
import { useToast } from "../contexts/ToastContext"

export default function Deliveries() {
  const [client, setClient] = useState("")
  const [eggTrays, setEggTrays] = useState("")
  const [workerName, setWorkerName] = useState("")
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [error, setError] = useState("")
  const { success } = useToast()

  const handleEggTraysChange = (e) => {
    const value = e.target.value
    
    // Only allow whole numbers
    if (value === '' || /^[0-9]*$/.test(value)) {
      setEggTrays(value)
      setError("") // Clear error when input is valid
    } else {
      setError("Please enter whole numbers only (no decimals or letters).")
    }
  }

  const submit = async () => {
    if (!client || !eggTrays || !workerName.trim()) {
      setError("Please fill out all fields.")
      return
    }

    const eggTraysNum = Number(eggTrays)
    if (isNaN(eggTraysNum) || eggTraysNum < 0) {
      setError("Egg trays must be a valid non-negative number.")
      return
    }

    // Additional validation for whole numbers
    if (!Number.isInteger(eggTraysNum)) {
      setError("Egg trays must be a whole number (no decimals allowed).")
      return
    }

    setLoading(true)
    setError("")

    try {
      const user = JSON.parse(localStorage.getItem('farmtrak_user'))
      
      await apiFetch("/deliveries", {
        method: "POST",
        body: JSON.stringify({
          client: client.trim(),
          egg_trays: eggTraysNum,
          delivery_type: "Outgoing Eggs",
          worker_name: workerName.trim(),
          submitted_by: user?.name || "Unknown",
          user_id: user?.id || null
        })
      })

      setClient("")
      setEggTrays("")
      setWorkerName("")
      success("Egg delivery recorded successfully!")
    } catch (err) {
      console.error('Deliveries: Submit error:', err)
      setError(err?.message || "Failed to record egg delivery")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitClick = () => {
    if (!client || !eggTrays || !workerName.trim()) {
      setError("Please fill out all fields.")
      return
    }

    const eggTraysNum = Number(eggTrays)
    if (isNaN(eggTraysNum) || eggTraysNum < 0) {
      setError("Egg trays must be a valid non-negative number.")
      return
    }

    // Additional validation for whole numbers
    if (!Number.isInteger(eggTraysNum)) {
      setError("Egg trays must be a whole number (no decimals allowed).")
      return
    }

    // All validations passed - clear error and open modal
    setError("")
    setModalOpen(true)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-yellow-700">
            Egg Delivery Recording
          </h2>
          <p className="text-xs sm:text-sm text-gray-600">
            Record egg deliveries to clients
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-md space-y-4 max-w-md">
          {/* Client Input */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              Client Name
            </label>

            <input
              type="text"
              value={client}
              onChange={(e) => setClient(e.target.value)}
              placeholder="Enter client name"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />

            <p className="text-xs text-gray-500">
              Name of the client receiving the delivery
            </p>
          </div>

          {/* Egg Trays Input */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              Egg Trays Delivered
            </label>

            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={eggTrays}
              onChange={handleEggTraysChange}
              placeholder="Enter number of egg trays"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
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
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />

            <p className="text-xs text-gray-500">
              Name of worker who handled the delivery
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmitClick}
            disabled={loading}
            className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-2.5 rounded-lg transition disabled:opacity-60"
          >
            {loading ? "Saving..." : "Record Delivery"}
          </button>
        </div>

        {/* Confirmation Modal */}
        <ConfirmModal
          open={modalOpen}
          title="Confirm Egg Delivery Recording"
          message={`Record ${eggTrays} egg trays delivered to ${client}?`}
          confirmText="Yes, Record"
          confirmColor="yellow"
          onConfirm={() => {
            submit()
            setModalOpen(false)
          }}
          onCancel={() => setModalOpen(false)}
        />
      </div>
    </DashboardLayout>
  )
}
