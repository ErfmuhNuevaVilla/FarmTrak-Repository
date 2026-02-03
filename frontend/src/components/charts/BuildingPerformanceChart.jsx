import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts"

export default function BuildingPerformanceChart({ data }) {
  console.log(data)

  // Clamp values to reasonable ranges
  const safeData = data.map(d => ({
    ...d,
    value: Math.min(Math.max(d.value, 0), d.metricType === 'productionPercentage' ? 100 : 10000)
  }))

  const getBarColor = (value, metricType) => {
    if (metricType === 'productionPercentage') {
      if (value >= 80) return "#16a34a" // green
      if (value >= 60) return "#eab308" // yellow
      if (value >= 40) return "#f97316" // orange
      return "#dc2626" // red
    } else {
      // For feed usage and mortality, use gradient colors
      if (value >= 100) return "#dc2626" // red - high values
      if (value >= 50) return "#f97316" // orange - medium values
      if (value >= 10) return "#eab308" // yellow - low values
      return "#16a34a" // green - very low values
    }
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload?.length) {
      const d = payload[0].payload
      return (
        <div className="bg-white p-3 border rounded-lg shadow">
          <p className="font-semibold">{d.buildingName}</p>
          <p className="text-sm">Livestock: {d.stockCount}</p>
          {d.metricType === 'productionPercentage' && (
            <>
              <p className="text-sm">Eggs Today: {d.dailyEggs}</p>
              <p className="font-medium">
                Production: {d.value}%
              </p>
            </>
          )}
          {d.metricType === 'feedUsage' && (
            <p className="font-medium">
              Feed Used: {d.value} bags
            </p>
          )}
          {d.metricType === 'mortality' && (
            <p className="font-medium">
              Mortality: {d.value} birds
            </p>
          )}
        </div>
      )
    }
    return null
  }

  const formatYAxis = (metricType) => {
    if (metricType === 'productionPercentage') {
      return (v) => `${v}%`
    }
    if (metricType === 'feedUsage') {
      return (v) => `${v} bags`
    }
    if (metricType === 'mortality') {
      return (v) => `${v}`
    }
    return v
  }

  const getLabel = (metricType) => {
    switch (metricType) {
      case 'productionPercentage':
        return 'Production %'
      case 'feedUsage':
        return 'Feed Usage (bags)'
      case 'mortality':
        return 'Mortality Count'
      default:
        return 'Value'
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow p-6 min-h-[320px]">
      <h3 className="font-semibold mb-4">Building Performance</h3>

      <ResponsiveContainer width="100%" height={260}>
        <BarChart
          data={safeData}
          margin={{ top: 20, right: 20, left: 10, bottom: 80 }}
        >
          <XAxis
            dataKey="buildingName"
            angle={-35}
            textAnchor="end"
            interval={0}
            tick={{ fontSize: 11 }}
          />

          <YAxis
            domain={safeData[0]?.metricType === 'productionPercentage' ? [0, 100] : [0, 'auto']}
            tickFormatter={formatYAxis(safeData[0]?.metricType)}
          />

          <Tooltip content={<CustomTooltip />} />

          <Bar dataKey="value" radius={[6, 6, 0, 0]}>
            {safeData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={getBarColor(entry.value, entry.metricType)}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
