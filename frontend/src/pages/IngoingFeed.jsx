import DashboardLayout from "../components/layout/DashboardLayout"
import { useState, useEffect } from "react"
import ConfirmModal from "../components/ui/ConfirmModal"
import { apiFetch } from "../lib/api"
import { getToken } from "../lib/auth"
import { useToast } from "../contexts/ToastContext"

export default function IngoingFeed() {
  const [supplier, setSupplier] = useState("")
  const [feedBags, setFeedBags] = useState("")
  const [workerName, setWorkerName] = useState("")
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [error, setError] = useState("")
  const { success } = useToast()

  const handleFeedBagsChange = (e) => {
    const value = e.target.value
    
    // Only allow whole numbers
    if (value === '' || /^[0-9]*$/.test(value)) {
      setFeedBags(value)
      setError("") // Clear error when input is valid
    } else {
      setError("Please enter whole numbers only (no decimals or letters).")
    }
  }

  const submit = async () => {
    if (!supplier || !feedBags || !workerName.trim()) {
      setError("Please fill out all fields.")
      return
    }

    const feedBagsNum = Number(feedBags)
    if (isNaN(feedBagsNum) || feedBagsNum < 0) {
      setError("Feed bags must be a valid non-negative number.")
      return
    }

    // Additional validation for whole numbers
    if (!Number.isInteger(feedBagsNum)) {
      setError("Feed bags must be a whole number (no decimals allowed).")
      return
    }

    setLoading(true)
    setError("")

    try {
      const user = JSON.parse(localStorage.getItem('farmtrak_user'))
      
      await apiFetch("/deliveries", {
        method: "POST",
        body: JSON.stringify({
          client: supplier.trim(),
          feed_bags: feedBagsNum,
          delivery_type: "Ingoing Feed",
          worker_name: workerName.trim(),
          submitted_by: user?.name || "Unknown",
          user_id: user?.id || null
        })
      })

      setSupplier("")
      setFeedBags("")
      setWorkerName("")
      success("Ingoing feed recorded successfully!")
    } catch (err) {
      console.error('IngoingFeed: Submit error:', err)
      setError(err?.message || "Failed to record ingoing feed")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitClick = () => {
    if (!supplier || !feedBags || !workerName.trim()) {
      setError("Please fill out all fields.")
      return
    }

    const feedBagsNum = Number(feedBags)
    if (isNaN(feedBagsNum) || feedBagsNum < 0) {
      setError("Feed bags must be a valid non-negative number.")
      return
    }

    // Additional validation for whole numbers
    if (!Number.isInteger(feedBagsNum)) {
      setError("Feed bags must be a whole number (no decimals allowed).")
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
          <h2 className="text-xl sm:text-2xl font-bold text-blue-700">
            Ingoing Feed Recording
          </h2>
          <p className="text-xs sm:text-sm text-gray-600">
            Record incoming feed deliveries from suppliers
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-md space-y-4 max-w-md">
          {/* Supplier Input */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              Supplier Name
            </label>

            <input
              type="text"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              placeholder="Enter supplier name"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <p className="text-xs text-gray-500">
              Name of the supplier delivering the feed
            </p>
          </div>

          {/* Feed Bags Input */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              Feed Bags Delivered
            </label>

            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={feedBags}
              onChange={handleFeedBagsChange}
              placeholder="Enter number of feed bags"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <p className="text-xs text-gray-500">
              Name of worker who received the delivery
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
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition disabled:opacity-60"
          >
            {loading ? "Saving..." : "Record Delivery"}
          </button>
        </div>

        {/* Confirmation Modal */}
        <ConfirmModal
          open={modalOpen}
          title="Confirm Ingoing Feed Recording"
          message={`Record ${feedBags} feed bags from ${supplier}?`}
          confirmText="Yes, Record"
          confirmColor="blue"
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
