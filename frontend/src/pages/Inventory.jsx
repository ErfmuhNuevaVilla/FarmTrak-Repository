import DashboardLayout from "../components/layout/DashboardLayout"
import { useEffect, useState } from "react"
import { apiFetch } from "../lib/api"
import { getToken } from "../lib/auth"
import { useToast } from "../contexts/ToastContext"
import Stat from "../components/ui/Stat"
import Card from "../components/ui/Card"

export default function Inventory() {
  const [feedUsage, setFeedUsage] = useState([])
  const [deliveries, setDeliveries] = useState([])
  const [harvestReports, setHarvestReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [filter, setFilter] = useState("all") // "all", "feed", "eggs", "ingoing-feed"
  const { success, error: toastError } = useToast()

  // Calculate inventory totals
  const totalEggsHarvested = harvestReports
    .filter(r => r.report_type === "Egg Harvest")
    .reduce((sum, r) => sum + (r.data_value || 0), 0)
  
  // Calculate total feed bags received (from ingoing feed deliveries)
  const totalFeedReceived = deliveries
    .filter(d => d.delivery_type === "Ingoing Feed")
    .reduce((sum, d) => sum + (d.feed_bags || 0), 0)
  
  // Calculate total feed bags used from reports (excluding inventory adjustments)
  const totalFeedBagsUsed = feedUsage
    .filter(f => f.building_name !== "Inventory Adjustment")
    .reduce((sum, f) => sum + (f.data_value || 0), 0)
  
  // Calculate total eggs delivered (from outgoing egg deliveries)
  const totalEggsDelivered = deliveries
    .filter(d => d.delivery_type === "Outgoing Eggs")
    .reduce((sum, d) => sum + (d.egg_trays || 0), 0)
  
  // Calculate current feed inventory (received - used)
  const totalInventoryFeeds = Math.max(0, totalFeedReceived - totalFeedBagsUsed)
  
  // Calculate current egg inventory (harvested - delivered)
  const totalEggInventory = Math.max(0, totalEggsHarvested - totalEggsDelivered)

  const fetchFeedUsage = async () => {
    try {
      const data = await apiFetch("/reports?report_type=eq.Feed Usage")
      setFeedUsage(data || [])
    } catch (err) {
      console.error("Failed to load feed usage:", err)
      toastError("Failed to load feed usage data")
    }
  }

  const fetchHarvestReports = async () => {
    try {
      const data = await apiFetch("/reports?report_type=eq.Egg Harvest")
      setHarvestReports(data || [])
    } catch (err) {
      console.error("Failed to load harvest reports:", err)
      toastError("Failed to load harvest reports data")
    }
  }

  const fetchDeliveries = async () => {
    try {
      const data = await apiFetch("/deliveries")
      setDeliveries(data || [])
    } catch (err) {
      console.error("Failed to load deliveries:", err)
      toastError("Failed to load deliveries data")
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setError("")
      await Promise.all([fetchFeedUsage(), fetchHarvestReports(), fetchDeliveries()])
      setLoading(false)
    }
    loadData()
  }, [])

  const filteredData = () => {
    switch (filter) {
      case "feed":
        return feedUsage.map(f => ({
          ...f,
          type: "feed",
          displayValue: `${f.data_value} bags`
        }))
      case "eggs":
        return deliveries
          .filter(d => d.delivery_type === "Outgoing Eggs")
          .map(d => ({
            ...d,
            type: "delivery",
            displayValue: `${d.egg_trays} trays`
          }))
      case "ingoing-feed":
        return deliveries
          .filter(d => d.delivery_type === "Ingoing Feed")
          .map(d => ({
            ...d,
            type: "delivery",
            displayValue: `${d.feed_bags} bags`
          }))
      default:
        // Only show Feed Usage reports in "All" filter
        return feedUsage.map(f => ({
          ...f,
          type: "feed",
          displayValue: `${f.data_value} bags`
        }))
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h2 className="text-2xl font-bold text-green-900 mb-2">
            Inventory Management
          </h2>
          <p className="text-sm text-gray-600">
            Track feed usage and egg deliveries
          </p>
        </div>

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
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Stat
              title="Eggs in Inventory"
              value={`${totalEggInventory.toLocaleString()} trays`}
              accent="yellow"
            />
            <Stat
              title="Feeds in Inventory"
              value={`${totalInventoryFeeds.toLocaleString()} bags`}
              accent="blue"
            />
            <Stat
              title="Feed Used"
              value={`${totalFeedBagsUsed.toLocaleString()} bags`}
              accent="gray"
            />
            <Stat
              title="Delivered Eggs"
              value={`${totalEggsDelivered.toLocaleString()} trays`}
              accent="green"
            />
          </div>
        )}

        {/* Filter and Table */}
        <Card>
          <div className="p-4 sm:p-6">
            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
              <button
                onClick={() => setFilter("all")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  filter === "all"
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter("feed")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  filter === "feed"
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Feed Usage
              </button>
              <button
                onClick={() => setFilter("eggs")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  filter === "eggs"
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Egg Deliveries
              </button>
              <button
                onClick={() => setFilter("ingoing-feed")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  filter === "ingoing-feed"
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Ingoing Feed Delivery
              </button>
            </div>

            {/* Data Table */}
            {loading ? (
              <div className="p-6 text-center text-gray-600 text-sm">
                Loading inventory data...
              </div>
            ) : error ? (
              <div className="p-6 text-center text-red-600 text-sm">
                {error}
              </div>
            ) : filteredData().length === 0 ? (
              <div className="p-6 text-center text-gray-500 text-sm">
                {filter === "all" 
                  ? "No inventory data found"
                  : filter === "feed"
                  ? "No feed usage records found"
                  : filter === "eggs"
                  ? "No egg deliveries found"
                  : "No ingoing feed deliveries found"
                }
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[600px]">
                  <thead className="bg-green-100 text-green-900">
                    <tr>
                      <th className="p-2 sm:p-3 text-xs sm:text-sm">Date</th>
                      <th className="p-2 sm:p-3 text-xs sm:text-sm">Time</th>
                      <th className="p-2 sm:p-3 text-xs sm:text-sm">Type</th>
                      <th className="p-2 sm:p-3 text-xs sm:text-sm">
                        {filter === "feed" 
                          ? "Building" 
                          : filter === "eggs" 
                          ? "Client"
                          : filter === "ingoing-feed"
                          ? "Supplier"
                          : "Building"
                        }
                      </th>
                      <th className="p-2 sm:p-3 text-xs sm:text-sm">Submitted By</th>
                      <th className="p-2 sm:p-3 text-xs sm:text-sm">Worker Name</th>
                      <th className="p-2 sm:p-3 text-xs sm:text-sm">Value</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredData().map((item) => (
                      <tr 
                        key={`${item.type}-${item.id}`} 
                        className="border-t hover:bg-green-50"
                      >
                        <td className="p-2 sm:p-3 text-xs sm:text-sm">
                          {new Date(item.created_at).toLocaleDateString()}
                        </td>
                        <td className="p-2 sm:p-3 text-xs sm:text-sm">
                          {new Date(item.created_at).toLocaleTimeString()}
                        </td>
                        <td className="p-2 sm:p-3 text-xs sm:text-sm">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            item.type === "feed" 
                              ? "bg-blue-100 text-blue-800" 
                              : item.delivery_type === "Outgoing Eggs"
                              ? "bg-orange-100 text-orange-800"
                              : "bg-green-100 text-green-800"
                          }`}>
                            {item.type === "feed" 
                              ? "Feed Usage" 
                              : item.delivery_type === "Outgoing Eggs"
                              ? "Outgoing Eggs"
                              : "Ingoing Feed"
                            }
                          </span>
                        </td>
                        <td className="p-2 sm:p-3 text-xs sm:text-sm">
                          {item.type === "feed" 
                            ? item.building_name 
                            : item.type === "delivery"
                            ? item.client
                            : item.building_name
                          }
                        </td>
                        <td className="p-2 sm:p-3 text-xs sm:text-sm">{item.submitted_by}</td>
                        <td className="p-2 sm:p-3 text-xs sm:text-sm">{item.worker_name || '-'}</td>
                        <td className="p-2 sm:p-3 text-xs sm:text-sm font-semibold">
                          {item.displayValue}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}
