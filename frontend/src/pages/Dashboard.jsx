import { useEffect, useState } from "react"
import DashboardLayout from "../components/layout/DashboardLayout"
import EggProductionChart from "../components/charts/EggProductionChart"
import BuildingPerformanceChart from "../components/charts/BuildingPerformanceChart"
import Stat from "../components/ui/Stat"
import Card from "../components/ui/Card"
import { apiFetch } from "../lib/api"
import { getToken } from "../lib/auth"
import * as XLSX from 'xlsx'

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
      const data = await apiFetch("/buildings")
      setBuildings(data || [])
    } catch (err) {
      console.error("Failed to load buildings:", err)
    }
  }

  const fetchEggTrend = async () => {
    try {
      // Build Supabase query - always show all buildings for trend chart
      let query = "/reports?report_type=eq.Egg Harvest"
      
      // Get last 14 days of data
      const fourteenDaysAgo = new Date()
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)
      const dateFilter = `&created_at=gte.${fourteenDaysAgo.toISOString().split('T')[0]}T00:00:00`
      query += dateFilter
      
      const data = await apiFetch(query)
      
      // Get total livestock count for percentage calculation
      const buildingsData = await apiFetch("/buildings")
      const totalLivestock = buildingsData.reduce((sum, building) => {
        return sum + (building.stock_count || 0)
      }, 0)
      
      // Group by date and sum eggs
      const dailyData = {}
      data.forEach(item => {
        const date = new Date(item.created_at).toLocaleDateString()
        if (!dailyData[date]) {
          dailyData[date] = 0
        }
        dailyData[date] += item.data_value || 0
      })
      
      // Convert to chart format with production percentage
      const chartData = Object.entries(dailyData).map(([date, eggs]) => {
        // Calculate production percentage using same formula as daily card
        // Formula: (Daily Eggs × 30 ÷ Total Livestock) × 100 = Daily Production Percentage
        const productionPercent = totalLivestock > 0
          ? ((eggs * 30) / totalLivestock) * 100
          : 0
        
        return {
          date,
          production: Math.round(productionPercent * 100) / 100 // Round to 2 decimal places
        }
      }).sort((a, b) => new Date(a.date) - new Date(b.date))
      
      setChartData(chartData)
    } catch (err) {
      console.error("Failed to load egg trend data:", err)
      setChartData([])
    }
  }

  const fetchBuildingPerformance = async () => {
    try {
      let query = "/reports"
      
      // Filter by date
      query += `?created_at=gte.${selectedDate}T00:00:00&created_at=lte.${selectedDate}T23:59:59`
      
      // Filter by report type based on metric
      if (performanceMetric === 'feedUsage') {
        query += "&report_type=eq.Feed Usage"
      } else if (performanceMetric === 'mortality') {
        query += "&report_type=eq.Mortality"
      } else {
        query += "&report_type=eq.Egg Harvest"
      }
      
      const data = await apiFetch(query)
      
      // Group data by building and calculate metrics
      const buildingData = {}
      data.forEach(item => {
        // Use building_name as key since building_id is null in reports
        const buildingKey = item.building_name || 'Unknown Building'
        if (!buildingData[buildingKey]) {
          buildingData[buildingKey] = {
            building_id: item.building_id,
            building_name: item.building_name || buildingKey,
            totalEggs: 0,
            totalFeed: 0,
            totalMortality: 0,
            stockCount: 0 // Will be updated later if we have building info
          }
        }
        
        if (item.report_type === 'Egg Harvest') {
          buildingData[buildingKey].totalEggs += item.data_value || 0
        } else if (item.report_type === 'Feed Usage') {
          buildingData[buildingKey].totalFeed += item.data_value || 0
        } else if (item.report_type === 'Mortality') {
          buildingData[buildingKey].totalMortality += item.data_value || 0
        }
      })
      
      // Get building stock counts and names
      try {
        const buildingsData = await apiFetch("/buildings")
        buildingsData.forEach(building => {
          // Match by building name since that's what we're using as key
          const buildingKey = building.name
          if (buildingData[buildingKey]) {
            buildingData[buildingKey].stockCount = building.stock_count || 0
            // Always use the building name from buildings table as primary source
            buildingData[buildingKey].building_name = building.name
          }
        })
      } catch (err) {
        console.warn("Could not fetch building stock counts:", err)
      }
      
      // Transform to expected format
      const transformedData = Object.values(buildingData).map(item => {
        // Calculate production percentage using same formula as daily card
        // Formula: (Daily Eggs × 30 ÷ Total Livestock) × 100 = Daily Production Percentage
        const productionPercent = item.stockCount > 0
          ? ((item.totalEggs * 30) / item.stockCount) * 100
          : 0
        
        return {
          buildingName: item.building_name || `Building ${item.building_id}`,
          building_id: item.building_id,
          stockCount: item.stockCount,
          dailyEggs: item.totalEggs,
          metricType: performanceMetric,
          value: performanceMetric === 'productionPercentage' 
            ? Math.round(productionPercent * 100) / 100 // Round to 2 decimal places
            : performanceMetric === 'feedUsage'
            ? item.totalFeed
            : item.totalMortality,
          productionPercentage: Math.round(productionPercent * 100) / 100, // Round to 2 decimal places
          feedUsage: item.totalFeed,
          mortality: item.totalMortality
        }
      })
      
      setBuildingPerformanceData(transformedData)
    } catch (err) {
      console.error("Failed to load building performance data:", err)
      setBuildingPerformanceData([])
    }
  }

  const fetchMonthlyData = async () => {
    try {
      const currentYear = new Date().getFullYear()
      const monthStr = String(selectedMonth + 1).padStart(2, '0')
      const startDate = `${currentYear}-${monthStr}-01`
      
      // Get the last day of the selected month
      const lastDayOfMonth = new Date(currentYear, selectedMonth + 1, 0).getDate()
      const endDate = `${currentYear}-${monthStr}-${String(lastDayOfMonth).padStart(2, '0')}`
      
      // Fetch all reports for the month
      const query = `/reports?created_at=gte.${startDate}T00:00:00&created_at=lte.${endDate}T23:59:59`
      const data = await apiFetch(query)
      
      // Calculate totals by report type
      const totals = {
        eggsHarvested: 0,
        feedUsage: 0,
        mortality: 0
      }
      
      data.forEach(item => {
        if (item.report_type === 'Egg Harvest') {
          totals.eggsHarvested += item.data_value || 0
        } else if (item.report_type === 'Feed Usage') {
          totals.feedUsage += item.data_value || 0
        } else if (item.report_type === 'Mortality') {
          totals.mortality += item.data_value || 0
        }
      })
      
      setMonthlyData(totals)
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
      
      // Fetch data for export
      const reportsQuery = `/reports?created_at=gte.${startDate}T00:00:00&created_at=lte.${endDate}T23:59:59`
      const reportsData = await apiFetch(reportsQuery)
      const buildingsData = await apiFetch("/buildings")
      
      // Calculate summary totals
      const summaryTotals = {
        totalHarvestedTrays: 0,
        totalFeedUsed: 0,
        totalMortalities: 0
      }
      
      reportsData.forEach(report => {
        if (report.report_type === 'Egg Harvest') {
          summaryTotals.totalHarvestedTrays += report.data_value || 0
        } else if (report.report_type === 'Feed Usage') {
          summaryTotals.totalFeedUsed += report.data_value || 0
        } else if (report.report_type === 'Mortality') {
          summaryTotals.totalMortalities += report.data_value || 0
        }
      })
      
      // Create summary sheet data
      const summaryData = [
        { 'METRIC': 'Total Harvested Trays', 'TOTAL': summaryTotals.totalHarvestedTrays },
        { 'METRIC': 'Total Feed Used', 'TOTAL': summaryTotals.totalFeedUsed },
        { 'METRIC': 'Total Mortalities', 'TOTAL': summaryTotals.totalMortalities }
      ]
      
      // Create worker reports sheet data
      const workerReportsData = [
        { 'WORKER': 'WORKER NAME', 'BUILDING': 'BUILDING NAME', 'TYPE': 'REPORT TYPE', 'VALUE': 'VALUE', 'DATE': 'DATE' }
      ]
      
      // Add detailed worker reports
      reportsData.forEach(report => {
        console.log('Processing report:', {
          reportId: report.id,
          buildingId: report.building_id,
          reportBuildingName: report.building_name,
          allBuildings: buildingsData.map(b => ({ id: b.id, name: b.name }))
        })
        
        const building = buildingsData.find(b => b.id === report.building_id)
        const buildingName = building?.name || report.building_name || `Building ${report.building_id}`
        
        console.log('Final building name:', buildingName)
        
        // Only add data rows, not another header
        if (report.submitted_by || report.building_id) { // Skip empty/invalid reports
          workerReportsData.push({
            'WORKER': report.submitted_by || 'Unknown',
            'BUILDING': buildingName,
            'TYPE': report.report_type,
            'VALUE': report.data_value,
            'DATE': new Date(report.created_at).toLocaleDateString()
          })
        }
      })
      
      // Create and style summary worksheet
      const summaryWorksheet = XLSX.utils.json_to_sheet(summaryData)
      const summaryColWidths = [
        { wch: 25 }, // METRIC column
        { wch: 20 }  // TOTAL column
      ]
      summaryWorksheet['!cols'] = summaryColWidths
      
      // Style summary sheet
      for (let row = 0; row <= 2; row++) {
        for (let col = 0; col <= 1; col++) {
          const cellAddress = XLSX.utils.encode_cell({ r: row, c: col })
          if (!summaryWorksheet[cellAddress]) continue
          
          summaryWorksheet[cellAddress].s = {
            font: { bold: true, sz: 12 },
            fill: { fgColor: { rgb: "E8F5E8" } },
            alignment: { horizontal: "center", vertical: "center" }
          }
        }
      }
      
      // Create and style worker reports worksheet
      const workerReportsWorksheet = XLSX.utils.json_to_sheet(workerReportsData)
      const workerColWidths = [
        { wch: 25 }, // WORKER column
        { wch: 20 }, // BUILDING column
        { wch: 15 }, // TYPE column
        { wch: 10 }, // VALUE column
        { wch: 12 }  // DATE column
      ]
      workerReportsWorksheet['!cols'] = workerColWidths
      
      // Style worker reports header row
      for (let col = 0; col <= 4; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col })
        if (!workerReportsWorksheet[cellAddress]) continue
        
        workerReportsWorksheet[cellAddress].s = {
          font: { bold: true, sz: 11, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "4CAF50" } },
          alignment: { horizontal: "center", vertical: "center" }
        }
      }
      
      // Create workbook with both sheets
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, summaryWorksheet, "Summary")
      XLSX.utils.book_append_sheet(workbook, workerReportsWorksheet, "Worker Reports")
      
      // Generate improved file name
      const monthNames = ["January", "February", "March", "April", "May", "June",
                         "July", "August", "September", "October", "November", "December"]
      const monthName = monthNames[selectedMonth]
      const fileName = `Monthly_Report_${monthName}_${currentYear}.xlsx`
      
      XLSX.writeFile(workbook, fileName)
      
    } catch (err) {
      console.error("Failed to export Excel:", err)
      setError("Failed to export Excel file")
    }
  }

  const fetchDashboardData = async (buildingId = null) => {
    try {
      setLoading(true)
      setError("")
      
      // Fetch buildings to get livestock count
      let buildingsUrl = "/buildings"
      if (buildingId && buildingId !== "All") {
        buildingsUrl += `?id=eq.${buildingId}`
      }
      const buildingsData = await apiFetch(buildingsUrl)
      
      // Calculate total livestock from buildings (filtered by selected building)
      const totalLivestock = buildingsData.reduce((sum, building) => {
        return sum + (building.stock_count || 0)
      }, 0)
      
      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0]
      
      // Calculate stats from reports filtered by today's date
      let reportsUrl = `/reports?created_at=gte.${today}T00:00:00&created_at=lte.${today}T23:59:59`
      const allReportsData = await apiFetch(reportsUrl)
      
      // Apply building filter by building_name (since building_id is null in reports)
      const reportsData = buildingId && buildingId !== "All"
        ? allReportsData.filter(report => {
            // Find the building name from the buildings data using the buildingId
            const selectedBuilding = buildingsData.find(b => b.id === buildingId)
            return selectedBuilding && report.building_name === selectedBuilding.name
          })
        : allReportsData
      
      const stats = {
        livestock: totalLivestock,
        eggProduction: 0,
        feed: 0,
        mortality: 0
      }
      
      reportsData.forEach(item => {
        if (item.report_type === 'Egg Harvest') {
          stats.eggProduction += item.data_value || 0
        } else if (item.report_type === 'Feed Usage') {
          stats.feed += item.data_value || 0
        } else if (item.report_type === 'Mortality') {
          stats.mortality += item.data_value || 0
        }
      })
      
      // Calculate egg production percentage
      // Formula: (Daily Eggs × 30 ÷ Total Livestock) × 100 = Daily Production Percentage
      const eggProductionPercent = totalLivestock > 0
        ? ((stats.eggProduction * 30) / totalLivestock) * 100
        : 0;
      
      setStats({
        ...stats,
        eggProduction: Math.round(eggProductionPercent * 100) / 100 // Round to 2 decimal places
      })
    } catch (err) {
      console.error("Failed to load dashboard data:", err)
      setError("Failed to load dashboard data")
      setStats({
        livestock: 0,
        eggProduction: 0,
        feed: 0,
        mortality: 0
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchBuildings(), fetchDashboardData(selectedBuilding), fetchEggTrend(), fetchBuildingPerformance(), fetchMonthlyData()])
    }
    loadData()
  }, [])

  useEffect(() => {
    fetchDashboardData(selectedBuilding)
  }, [selectedBuilding])

  useEffect(() => {
    fetchEggTrend()
  }, []) // Only fetch once on mount, not affected by building filter

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
