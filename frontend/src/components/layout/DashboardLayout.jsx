import { useState } from "react"
import Sidebar from "./Sidebar"
import Topbar from "./Topbar"

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-green-50 to-green-100">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Sidebar Overlay (Mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col w-full lg:w-auto">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />

        <main className="p-4 sm:p-6 flex-1">
          {children}
        </main>
      </div>
    </div>
  )
}

