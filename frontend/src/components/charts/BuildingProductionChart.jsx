import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts"

export default function BuildingProductionChart({ data }) {
  const getBarColor = (percentage) => {
    if (percentage >= 80) return "#16a34a"
    if (percentage >= 60) return "#eab308"
    if (percentage >= 40) return "#f97316"
    return "#dc2626"
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload?.length) {
      const d = payload[0].payload
      return (
        <div className="bg-white p-3 border border-gray-300 rounded-lg shadow">
          <p className="font-semibold">{d.buildingName}</p>
          <p className="text-sm">Stock: {d.stockCount}</p>
          <p className="text-sm">Eggs: {d.dailyEggs}</p>
          <p className="font-medium">Production: {d.productionPercentage}%</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="bg-white rounded-2xl shadow p-6 min-h-[320px]">
      <h3 className="font-semibold mb-4">Building Production %</h3>

      <ResponsiveContainer width="100%" height={260}>
        <BarChart
          data={data}
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
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="productionPercentage" radius={[6, 6, 0, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={index}
                fill={getBarColor(entry.productionPercentage)}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
