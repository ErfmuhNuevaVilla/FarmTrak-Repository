import { Link, useLocation } from "react-router-dom"
import { X } from "lucide-react"
import {
  LayoutDashboard,
  Egg,
  Package,
  AlertTriangle,
  BarChart3,
  Users,
  Building,
  Settings2,
  FileText,
  PackageOpen,
  Truck,
  PackagePlus
} from "lucide-react"
import { getUserRole } from "../../lib/auth"

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation()
  const role = getUserRole()

  const navItem = (to, label, Icon) => {
    const isActive = location.pathname === to
  
    return (
      <Link
        to={to}
        onClick={onClose}
        className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition
          ${
            isActive
              ? "bg-green-100 text-green-900"
              : "text-green-800 hover:bg-green-50"
          }`}
      >
        <Icon
          size={20}
          className={isActive ? "text-green-900" : "text-green-700"}
        />
        <span>{label}</span>
      </Link>
    )
  }
  

  return (
    <>
      {/* Mobile Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50
          w-64 h-screen flex flex-col shadow-lg bg-white
          transform transition-transform duration-300 ease-in-out
          lg:sticky lg:top-0 lg:left-0 lg:translate-x-0 lg:z-40
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Brand Header */}
        <div className="h-16 bg-green-900 text-white px-6 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <img 
              src="/Farmtrak.png" 
              alt="FarmTrak Logo" 
              className="w-8 h-8"
            />
            <span className="text-xl sm:text-2xl font-bold">FarmTrak</span>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden text-white hover:text-green-200"
          >
            <X size={24} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 bg-white px-4 py-6 space-y-2 overflow-y-auto">
          {role === "manager" && navItem("/dashboard", "Dashboard", LayoutDashboard)}
          {role === "manager" && navItem("/inventory", "Inventory", PackageOpen)}
          {role === "manager" && navItem("/ingoing-feed", "Ingoing Feed", PackagePlus)}
          {role === "manager" && navItem("/deliveries", "Record Delivery", Truck)}
          {role === "worker" && navItem("/harvest", "Egg Harvest", Egg)}
          {role === "worker" && navItem("/feed", "Feed Usage", Package)}
          {role === "worker" && navItem("/mortality", "Mortality", AlertTriangle)}
          {role === "worker" && navItem("/my-reports", "My Reports", FileText)}
          {role === "manager" && navItem("/reports", "Reports", BarChart3)}
          {role === "admin" && navItem("/users", "Users Management", Users)}
          {role === "manager" && navItem("/buildings", "Buildings", Building)}
        </nav>

        {/* Bottom Section - Fixed at bottom */}
        <div className="flex-shrink-0 border-t border-green-800/30 p-4 bg-green-900 text-white">
          <Link
            to="/settings"
            onClick={onClose}
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-green-800 transition"
          >
            <Settings2 size={20} />
            <span>User Settings</span>
          </Link>
        </div>
      </aside>
    </>
  )
}
