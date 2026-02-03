import DashboardLayout from "../components/layout/DashboardLayout"
import { useEffect, useState } from "react"
import { apiFetch } from "../lib/api"
import { getToken } from "../lib/auth"

export default function WorkerReports() {
  const [reports, setReports] = useState([])
  const [buildings, setBuildings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [typeFilter, setTypeFilter] = useState("All")
  const [buildingFilter, setBuildingFilter] = useState("All")
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth()) // Current month

  const fetchReports = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('farmtrak_user'))
      const data = await apiFetch(`/reports?submitted_by=eq.${user?.name}`)
      setReports(data || [])
    } catch (err) {
      setError(err?.message || "Failed to load your reports")
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
          My Reports
        </h2>
        <p className="text-xs sm:text-sm text-gray-600">
          View and filter your submitted farm operation records
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

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-md overflow-hidden">
        {loading ? (
          <div className="p-6 sm:p-8 text-center text-gray-600 text-sm sm:text-base">
            Loading your reports...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[600px]">
              <thead className="bg-green-100 text-green-900">
                <tr>
                  <th className="p-2 sm:p-3 text-xs sm:text-sm">Date</th>
                  <th className="p-2 sm:p-3 text-xs sm:text-sm">Report Type</th>
                  <th className="p-2 sm:p-3 text-xs sm:text-sm">Building</th>
                  <th className="p-2 sm:p-3 text-xs sm:text-sm">Value</th>
                </tr>
              </thead>

              <tbody>
                {filteredReports.map((r) => (
                  <tr key={r.id} className="border-t hover:bg-green-50">
                    <td className="p-2 sm:p-3 text-xs sm:text-sm">
                      {new Date(r.created_at).toLocaleDateString()}
                    </td>
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
                    <td colSpan="4" className="p-4 text-center text-gray-500 text-sm sm:text-base">
                      {reports.length === 0
                        ? "You haven't submitted any reports yet"
                        : "No matching reports found"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
