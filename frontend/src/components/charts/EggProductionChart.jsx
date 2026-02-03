import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"

export default function EggProductionChart({ data }) {
  return (
    <div className="bg-white rounded-2xl shadow p-6 h-80">
      <h3 className="font-semibold mb-4">Egg Production Trend</h3>

      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="eggs"
            stroke="#166534"
            strokeWidth={3}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
