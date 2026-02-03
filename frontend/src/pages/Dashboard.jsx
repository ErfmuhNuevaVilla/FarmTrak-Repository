import { useEffect, useState } from "react"
import DashboardLayout from "../components/layout/DashboardLayout"
import EggProductionChart from "../components/charts/EggProductionChart"
import BuildingPerformanceChart from "../components/charts/BuildingPerformanceChart"
import Stat from "../components/ui/Stat"
import Card from "../components/ui/Card"
import { apiFetch } from "../lib/api"
import { getToken } from "../lib/auth"

export default function Dashboard() {
  const [stats, setStats] = useState({
    livestock: 0,
    eggProduction: 0,
    feed: 0,
    mortality: 0
  })
  const [buildings, setBuildings] = useState([])
  const [selectedBuilding, setSelectedBuilding] = useState("All")
  const [chartData, setChartData] = useState([])
  const [buildingPerformanceData, setBuildingPerformanceData] = useState([])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [performanceMetric, setPerformanceMetric] = useState("productionPercentage")
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [monthlyData, setMonthlyData] = useState({
    eggsHarvested: 0,
    feedUsage: 0,
    mortality: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const fetchBuildings = async () => {
    try {
      const token = getToken()
      if (!token) return
      const data = await apiFetch("/api/buildings", { token })
      setBuildings(data || [])
    } catch (err) {
      console.error("Failed to load buildings:", err)
    }
  }

  const fetchEggTrend = async () => {
    try {
      const token = getToken()
      if (!token) return
      
      // Build query params
      const params = new URLSearchParams()
      if (selectedBuilding !== "All") {
        params.append("buildingId", selectedBuilding)
      }
      
      const url = `/api/dashboard/egg-trend${params.toString() ? `?${params.toString()}` : ""}`
      const data = await apiFetch(url, { token })
      setChartData(data || [])
    } catch (err) {
      console.error("Failed to load egg trend data:", err)
      setChartData([])
    }
  }

  const fetchBuildingPerformance = async () => {
    try {
      const token = getToken()
      if (!token) return
      
      let url = `/api/dashboard/building-production?date=${selectedDate}`
      
      if (performanceMetric === 'feedUsage') {
        url = `/api/dashboard/building-feed-usage?date=${selectedDate}`
      } else if (performanceMetric === 'mortality') {
        url = `/api/dashboard/building-mortality?date=${selectedDate}`
      }
      
      const data = await apiFetch(url, { token })
      
      // Transform data based on metric type
      const transformedData = data.map(item => ({
        ...item,
        metricType: performanceMetric,
        value: performanceMetric === 'productionPercentage' 
          ? item.productionPercentage 
          : performanceMetric === 'feedUsage'
          ? item.feedUsage
          : item.mortality
      }))
      
      setBuildingPerformanceData(transformedData)
    } catch (err) {
      console.error("Failed to load building performance data:", err)
      setBuildingPerformanceData([])
    }
  }

  const fetchMonthlyData = async () => {
    try {
      const token = getToken()
      if (!token) return
      
      const currentYear = new Date().getFullYear()
      const monthStr = String(selectedMonth + 1).padStart(2, '0')
      const startDate = `${currentYear}-${monthStr}-01`
      
      // Get the last day of the selected month
      const lastDayOfMonth = new Date(currentYear, selectedMonth + 1, 0).getDate()
      const endDate = `${currentYear}-${monthStr}-${String(lastDayOfMonth).padStart(2, '0')}`
      
      const url = `/api/dashboard/monthly-report?startDate=${startDate}&endDate=${endDate}`
      const data = await apiFetch(url, { token })
      
      setMonthlyData(data || {
        eggsHarvested: 0,
        feedUsage: 0,
        mortality: 0
      })
    } catch (err) {
      console.error("Failed to load monthly data:", err)
      setMonthlyData({
        eggsHarvested: 0,
        feedUsage: 0,
        mortality: 0
      })
    }
  }

  const handleExportExcel = async () => {
    try {
      const token = getToken()
      if (!token) {
        setError("Authentication required for export")
        return
      }
      
      const currentYear = new Date().getFullYear()
      const monthStr = String(selectedMonth + 1).padStart(2, '0')
      const startDate = `${currentYear}-${monthStr}-01`
      
      // Get the last day of the selected month
      const lastDayOfMonth = new Date(currentYear, selectedMonth + 1, 0).getDate()
      const endDate = `${currentYear}-${monthStr}-${String(lastDayOfMonth).padStart(2, '0')}`
      
      const url = `/api/dashboard/export-excel?startDate=${startDate}&endDate=${endDate}`
      
      // Create a download link for the Excel file
      const response = await fetch(`http://localhost:5000${url}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Export failed')
      }
      
      // Get the blob and create download link
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      
      // Generate filename with month and year
      const monthName = new Date(0, selectedMonth).toLocaleString('default', { month: 'long' })
      link.download = `Monthly_Report_${monthName}_${currentYear}.xlsx`
      
      // Trigger download
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)
      
    } catch (err) {
      console.error("Failed to export Excel:", err)
      setError("Failed to export Excel file")
    }
  }

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError("")
      const token = getToken()
      if (!token) {
        setError("Not authenticated")
        return
      }
      
      // Build query params
      const params = new URLSearchParams()
      if (selectedBuilding !== "All") {
        params.append("buildingId", selectedBuilding)
      }
      
      const url = `/api/dashboard${params.toString() ? `?${params.toString()}` : ""}`
      const data = await apiFetch(url, { token })
      setStats(data || {
        livestock: 0,
        eggProduction: 0,
        feed: 0,
        mortality: 0
      })
    } catch (err) {
      setError(err?.message || "Failed to load dashboard data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchBuildings(), fetchDashboardData(), fetchEggTrend(), fetchBuildingPerformance(), fetchMonthlyData()])
    }
    loadData()
  }, [])

  useEffect(() => {
    fetchDashboardData()
    fetchEggTrend()
  }, [selectedBuilding])

  useEffect(() => {
    fetchBuildingPerformance()
  }, [selectedDate, performanceMetric])

  useEffect(() => {
    fetchMonthlyData()
  }, [selectedMonth])

  const today = new Date().toLocaleDateString()

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-green-900">
              Farm Operations Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-gray-600">
              Daily farm performance report · {today}
            </p>
          </div>
          
          {/* Building Filter */}
          <div className="flex items-center gap-2">
            <label htmlFor="building-filter" className="text-sm font-medium text-gray-700">
              Building:
            </label>
            <select
              id="building-filter"
              value={selectedBuilding}
              onChange={(e) => setSelectedBuilding(e.target.value)}
              className="
                bg-white border-2 border-gray-400 rounded-lg
                px-3 py-2 text-gray-900 text-sm sm:text-base
                focus:outline-none focus:ring-2 focus:ring-green-200
                min-w-[150px]
              "
              disabled={loading}
            >
              <option value="All">All Buildings</option>
              {buildings.map((building) => (
                <option key={building.id} value={building.id}>
                  {building.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* KPI Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Stat
            title="Total Livestock"
            value={stats.livestock.toLocaleString()}
            subtitle={selectedBuilding === "All" ? "Across all buildings" : "In selected building"}
          />

          <Stat
            title="Daily Egg Production"
            value={`${stats.eggProduction.toFixed(2)}%`}
            subtitle="Today's production efficiency"
          />

          <Stat
            title="Feed Used Today"
            value={`${stats.feed.toLocaleString()} bags`}
            subtitle="Today's feed consumption"
          />

          <Stat
            title="Today's Mortality"
            value={stats.mortality.toLocaleString()}
            subtitle="Recorded losses today"
            variant="danger"
          />
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 sm:mb-8">
        {/* Egg Production Trend Chart */}
        <div className="bg-white rounded-2xl shadow-md p-4 sm:p-6 overflow-hidden">
          <h2 className="text-base sm:text-lg font-semibold mb-4 text-gray-800">
            Egg Production Trend (Last 14 Days)
          </h2>

          <div className="overflow-x-auto">
            <div className="min-w-[300px]">
              {chartData.length > 0 ? (
                <EggProductionChart data={chartData} />
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <p className="text-sm">No egg production data available for the selected period</p>
                  <p className="text-xs mt-2">Data will appear once workers submit harvest reports</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Building Performance Chart */}
        <div className="bg-white rounded-2xl shadow-md p-4 sm:p-6 overflow-hidden">
          <div className="flex flex-col gap-3 mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h2 className="text-base sm:text-lg font-semibold text-gray-800">
                Building Performance
              </h2>
              
              {/* Date Filter */}
              <div className="flex items-center gap-2">
                <label htmlFor="date-filter" className="text-sm font-medium text-gray-700">
                  Date:
                </label>
                <input
                  id="date-filter"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="
                    bg-white border-2 border-gray-400 rounded-lg
                    px-3 py-2 text-gray-900 text-sm
                    focus:outline-none focus:ring-2 focus:ring-green-200
                  "
                />
              </div>
            </div>
            
            {/* Metric Filter */}
            <div className="flex items-center gap-2">
              <label htmlFor="metric-filter" className="text-sm font-medium text-gray-700">
                Metric:
              </label>
              <select
                id="metric-filter"
                value={performanceMetric}
                onChange={(e) => setPerformanceMetric(e.target.value)}
                className="
                  bg-white border-2 border-gray-400 rounded-lg
                  px-3 py-2 text-gray-900 text-sm
                  focus:outline-none focus:ring-2 focus:ring-green-200
                  min-w-[150px]
                "
              >
                <option value="productionPercentage">Egg Production %</option>
                <option value="feedUsage">Feed Usage (bags)</option>
                <option value="mortality">Mortality Count</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[300px]">
              {buildingPerformanceData.length > 0 ? (
                <BuildingPerformanceChart data={buildingPerformanceData} />
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <p className="text-sm">No building performance data available for {new Date(selectedDate).toLocaleDateString()}</p>
                  <p className="text-xs mt-2">Data will appear once workers submit reports</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Report */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
            Monthly Report
          </h2>
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Month Filter */}
            <div className="flex items-center gap-2">
              <label htmlFor="month-filter" className="text-sm font-medium text-gray-700">
                Month:
              </label>
              <select
                id="month-filter"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="
                  bg-white border-2 border-gray-400 rounded-lg
                  px-3 py-2 text-gray-900 text-sm
                  focus:outline-none focus:ring-2 focus:ring-green-200
                  min-w-[150px]
                "
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

            {/* Export Button */}
            <button
              onClick={handleExportExcel}
              className="
                bg-green-600 hover:bg-green-700 text-white
                px-4 py-2 rounded-lg text-sm font-medium
                transition-colors duration-200
                flex items-center gap-2
                whitespace-nowrap
              "
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export Excel
            </button>
          </div>
        </div>

        {/* Monthly Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Stat
            title="Eggs Harvested"
            value={`${monthlyData.eggsHarvested.toLocaleString()} trays`}
            subtitle={`${new Date(0, selectedMonth).toLocaleString('default', { month: 'long' })} ${new Date().getFullYear()}`}
          />

          <Stat
            title="Feed Usage"
            value={`${monthlyData.feedUsage.toLocaleString()} bags`}
            subtitle={`${new Date(0, selectedMonth).toLocaleString('default', { month: 'long' })} ${new Date().getFullYear()}`}
          />

          <Stat
            title="Mortality"
            value={monthlyData.mortality.toLocaleString()}
            subtitle={`${new Date(0, selectedMonth).toLocaleString('default', { month: 'long' })} ${new Date().getFullYear()}`}
            variant="danger"
          />
        </div>
      </div>
    </DashboardLayout>
  )
}
