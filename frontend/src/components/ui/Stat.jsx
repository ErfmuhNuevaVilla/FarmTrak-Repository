export default function Stat({ title, value, accent = "green" }) {
  return (
    <div className="relative bg-white rounded-2xl shadow-md p-6 overflow-hidden">
      <div className={`absolute top-0 left-0 h-1 w-full bg-${accent}-600`} />

      <p className="text-sm text-gray-500">{title}</p>
      <p className={`text-4xl font-bold text-${accent}-700 mt-2`}>
        {value}
      </p>
    </div>
  )
}
  