import DashboardLayout from "../components/layout/DashboardLayout"
import { useEffect, useState } from "react"
import { apiFetch } from "../lib/api"
import { getToken } from "../lib/auth"
import ConfirmModal from "../components/ui/ConfirmModal"

export default function Reports() {
  const [reports, setReports] = useState([])
  const [buildings, setBuildings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedReports, setSelectedReports] = useState(new Set())
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const [typeFilter, setTypeFilter] = useState("All")
  const [buildingFilter, setBuildingFilter] = useState("All")
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth()) // Current month

  const fetchReports = async () => {
    try {
      const data = await apiFetch("/reports")
      setReports(data || [])
    } catch (err) {
      setError(err?.message || "Failed to load reports")
    }
  }

  const fetchBuildings = async () => {
    try {
      const data = await apiFetch("/buildings")
      setBuildings(data || [])
    } catch (err) {
      console.error("Failed to load buildings:", err)
    }
  }

  const handleDeleteReports = async () => {
    try {
      const token = getToken()
      if (!token) {
        setError("Authentication required")
        return
      }

      // Delete selected reports
      const deletePromises = Array.from(selectedReports).map(reportId => 
        apiFetch(`/reports?id=eq.${reportId}`, {
          method: "DELETE",
          token
        })
      )

      await Promise.all(deletePromises)
      
      // Refresh reports list
      await fetchReports()
      
      // Reset selection mode
      setSelectionMode(false)
      setSelectedReports(new Set())
      setShowDeleteModal(false)
    } catch (err) {
      console.error("Failed to delete reports:", err)
      setError("Failed to delete reports")
    }
  }

  const toggleReportSelection = (reportId) => {
    const newSelected = new Set(selectedReports)
    if (newSelected.has(reportId)) {
      newSelected.delete(reportId)
    } else {
      newSelected.add(reportId)
    }
    setSelectedReports(newSelected)
  }

  const toggleSelectAll = () => {
    if (selectedReports.size === filteredReports.length) {
      setSelectedReports(new Set())
    } else {
      setSelectedReports(new Set(filteredReports.map(r => r.id)))
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setError("")
      await Promise.all([fetchReports(), fetchBuildings()])
      setLoading(false)
    }
    loadData()
  }, [])

  const filteredReports = reports.filter(r => {
    const typeMatch =
      typeFilter === "All" || r.report_type === typeFilter

    const buildingMatch =
      buildingFilter === "All" || r.building_name === buildingFilter

    const monthMatch = new Date(r.created_at).getMonth() === selectedMonth

    return typeMatch && buildingMatch && monthMatch
  })

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-green-900">
          Farm Reports
        </h2>
        <p className="text-xs sm:text-sm text-gray-600">
          Filter and review farm operation records
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 mb-4 sm:mb-6">
        {/* Month Filter */}
        <div className="flex items-center gap-2">
          <label htmlFor="month-filter" className="text-sm font-medium text-gray-700">Month:</label>
          <select 
            id="month-filter" 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(Number(e.target.value))} 
            className="bg-white border-2 border-gray-400 rounded-lg px-3 py-2 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-green-200 min-w-[150px]"
          >
            <option value={0}>January</option>
            <option value={1}>February</option>
            <option value={2}>March</option>
            <option value={3}>April</option>
            <option value={4}>May</option>
            <option value={5}>June</option>
            <option value={6}>July</option>
            <option value={7}>August</option>
            <option value={8}>September</option>
            <option value={9}>October</option>
            <option value={10}>November</option>
            <option value={11}>December</option>
          </select>
        </div>

        {/* Report Type */}
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="
            bg-white border-2 border-gray-400 rounded-lg
            px-3 py-2 text-gray-900 text-sm sm:text-base
            focus:outline-none focus:ring-2 focus:ring-green-200
            flex-1 sm:flex-initial min-w-[150px]
          "
        >
          <option value="All">All Report Types</option>
          <option value="Egg Harvest">Egg Harvest</option>
          <option value="Feed Usage">Feed Usage</option>
          <option value="Mortality">Mortality</option>
        </select>

        {/* Building */}
        <select
          value={buildingFilter}
          onChange={e => setBuildingFilter(e.target.value)}
          className="
            bg-white border-2 border-gray-400 rounded-lg
            px-3 py-2 text-gray-900 text-sm sm:text-base
            focus:outline-none focus:ring-2 focus:ring-green-200
            flex-1 sm:flex-initial min-w-[150px]
          "
        >
          <option value="All">All Buildings</option>
          {buildings.map(b => (
            <option key={b.id} value={b.name}>
              {b.name}
            </option>
          ))}
        </select>

        {/* Delete Button */}
        <button
          onClick={() => {
            if (selectionMode) {
              setSelectionMode(false)
              setSelectedReports(new Set())
            } else {
              setSelectionMode(true)
            }
          }}
          className={`px-4 py-2 rounded-lg text-sm sm:text-base whitespace-nowrap transition ${
            selectionMode 
              ? "bg-gray-300 hover:bg-gray-400 text-gray-700" 
              : "bg-red-600 hover:bg-red-700 text-white"
          }`}
        >
          {selectionMode ? "Cancel Selection" : "Delete Reports"}
        </button>

        {/* Reset */}
        <button
          onClick={() => {
            setTypeFilter("All")
            setBuildingFilter("All")
            setSelectedMonth(new Date().getMonth())
          }}
          className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg text-sm sm:text-base whitespace-nowrap"
        >
          Clear Filters
        </button>
      </div>

      {/* Selection Mode Actions */}
      {selectionMode && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="text-sm sm:text-base">
              <span className="font-medium text-yellow-800">
                {selectedReports.size} of {filteredReports.length} reports selected
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={toggleSelectAll}
                className="px-3 py-1 sm:px-4 sm:py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm sm:text-base transition"
              >
                {selectedReports.size === filteredReports.length ? "Deselect All" : "Select All"}
              </button>
              {selectedReports.size > 0 && (
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="px-3 py-1 sm:px-4 sm:py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm sm:text-base transition"
                >
                  Delete Selected ({selectedReports.size})
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-md overflow-hidden">
        {loading ? (
          <div className="p-6 sm:p-8 text-center text-gray-600 text-sm sm:text-base">
            Loading reports...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[600px]">
              <thead className="bg-green-100 text-green-900">
                <tr>
                  {selectionMode && (
                    <th className="p-2 sm:p-3 text-xs sm:text-sm">
                      <input
                        type="checkbox"
                        checked={selectedReports.size === filteredReports.length && filteredReports.length > 0}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                    </th>
                  )}
                  <th className="p-2 sm:p-3 text-xs sm:text-sm">Date</th>
                  <th className="p-2 sm:p-3 text-xs sm:text-sm">Submitted By</th>
                  <th className="p-2 sm:p-3 text-xs sm:text-sm">Report Type</th>
                  <th className="p-2 sm:p-3 text-xs sm:text-sm">Building</th>
                  <th className="p-2 sm:p-3 text-xs sm:text-sm">Value</th>
                </tr>
              </thead>

              <tbody>
                {filteredReports.map((r) => (
                  <tr 
                    key={r.id} 
                    className={`border-t hover:bg-green-50 ${
                      selectionMode && selectedReports.has(r.id) ? "bg-green-50" : ""
                    }`}
                  >
                    {selectionMode && (
                      <td className="p-2 sm:p-3 text-xs sm:text-sm">
                        <input
                          type="checkbox"
                          checked={selectedReports.has(r.id)}
                          onChange={() => toggleReportSelection(r.id)}
                          className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                      </td>
                    )}
                    <td className="p-2 sm:p-3 text-xs sm:text-sm">
                      {new Date(r.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-2 sm:p-3 text-xs sm:text-sm">{r.submitted_by}</td>
                    <td className="p-2 sm:p-3 text-xs sm:text-sm font-medium">{r.report_type}</td>
                    <td className="p-2 sm:p-3 text-xs sm:text-sm">{r.building_name}</td>
                    <td className="p-2 sm:p-3 text-xs sm:text-sm font-semibold">
                      {r.data_value}
                      {r.report_type === "Feed Usage" && " bags"}
                      {r.report_type === "Egg Harvest" && " trays"}
                      {r.report_type === "Mortality" && " mortalities"}
                    </td>
                  </tr>
                ))}

                {filteredReports.length === 0 && (
                  <tr>
                    <td colSpan={selectionMode ? "6" : "5"} className="p-4 text-center text-gray-500 text-sm sm:text-base">
                      {reports.length === 0
                        ? "No reports found"
                        : "No matching reports found"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={showDeleteModal}
        title="Delete Reports"
        message={`Are you sure you want to delete ${selectedReports.size} report${selectedReports.size !== 1 ? 's' : ''}? This action cannot be undone.`}
        confirmText={`Delete ${selectedReports.size} Report${selectedReports.size !== 1 ? 's' : ''}`}
        confirmColor="red"
        onConfirm={handleDeleteReports}
        onCancel={() => setShowDeleteModal(false)}
      />
    </DashboardLayout>
  )
}
